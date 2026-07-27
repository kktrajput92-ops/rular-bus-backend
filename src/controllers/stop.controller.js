const pool = require("../config/db");

const VALID_STOP_TYPES = [
  "ORIGIN",
  "CITY",
  "TOWN",
  "VILLAGE",
  "BUS_STAND",
  "PICKUP_POINT",
  "BYPASS",
  "LANDMARK",
  "STOP",
  "DESTINATION",
];

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const parsePositiveInteger = (value) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseNonNegativeInteger = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const parseNonNegativeNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const parseCoordinate = (value, minimum, maximum) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    return undefined;
  }

  return parsed;
};

const parseBoolean = (value, fallback = true) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const STOP_SELECT = `
  SELECT
    st.id,
    st.route_id,
    r.source AS route_source,
    r.destination AS route_destination,
    st.location_id,
    pl.location_name,
    pl.display_name AS location_display_name,
    pl.state_name,
    pl.location_type,
    st.stop_name,
    COALESCE(
      NULLIF(TRIM(st.display_name), ''),
      NULLIF(TRIM(pl.display_name), ''),
      NULLIF(TRIM(pl.location_name), ''),
      st.stop_name
    ) AS display_name,
    st.stop_type,
    st.stop_order,
    st.arrival_offset_minutes,
    st.departure_offset_minutes,
    st.distance_from_origin_km,
    st.boarding_allowed,
    st.dropping_allowed,
    st.landmark,
    st.address,
    st.latitude,
    st.longitude,
    st.is_active,
    st.created_at,
    st.updated_at
  FROM stops st
  INNER JOIN routes r
    ON r.id = st.route_id
  LEFT JOIN passenger_locations pl
    ON pl.id = st.location_id
`;

const validateStopPayload = async (body, existingId = null) => {
  const routeId = parsePositiveInteger(body.route_id);
  const locationId =
    body.location_id === undefined ||
    body.location_id === null ||
    body.location_id === ""
      ? null
      : parsePositiveInteger(body.location_id);

  const stopName = normalizeText(body.stop_name);
  const displayName = normalizeText(body.display_name);

  const stopType = String(body.stop_type || "STOP")
    .trim()
    .toUpperCase();

  const stopOrder = parseNonNegativeInteger(body.stop_order);
  const arrivalOffset = parseNonNegativeInteger(
    body.arrival_offset_minutes,
    null
  );
  const departureOffset = parseNonNegativeInteger(
    body.departure_offset_minutes,
    null
  );
  const distanceFromOrigin = parseNonNegativeNumber(
    body.distance_from_origin_km,
    null
  );

  const latitude = parseCoordinate(body.latitude, -90, 90);
  const longitude = parseCoordinate(body.longitude, -180, 180);

  if (!routeId) {
    return {
      error: "A valid route is required.",
    };
  }

  if (!stopName && !locationId) {
    return {
      error: "Stop name or passenger location is required.",
    };
  }

  if (!VALID_STOP_TYPES.includes(stopType)) {
    return {
      error: "Invalid stop type.",
    };
  }

  if (stopOrder === null) {
    return {
      error: "Stop order must be a non-negative integer.",
    };
  }

  if (
    body.arrival_offset_minutes !== undefined &&
    body.arrival_offset_minutes !== null &&
    body.arrival_offset_minutes !== "" &&
    arrivalOffset === null
  ) {
    return {
      error:
        "Arrival offset must be a non-negative integer.",
    };
  }

  if (
    body.departure_offset_minutes !== undefined &&
    body.departure_offset_minutes !== null &&
    body.departure_offset_minutes !== "" &&
    departureOffset === null
  ) {
    return {
      error:
        "Departure offset must be a non-negative integer.",
    };
  }

  if (
    body.distance_from_origin_km !== undefined &&
    body.distance_from_origin_km !== null &&
    body.distance_from_origin_km !== "" &&
    distanceFromOrigin === null
  ) {
    return {
      error:
        "Distance from origin must be a non-negative number.",
    };
  }

  if (latitude === undefined) {
    return {
      error: "Latitude must be between -90 and 90.",
    };
  }

  if (longitude === undefined) {
    return {
      error: "Longitude must be between -180 and 180.",
    };
  }

  const routeResult = await pool.query(
    "SELECT id FROM routes WHERE id = $1",
    [routeId]
  );

  if (routeResult.rows.length === 0) {
    return {
      error: "Selected route was not found.",
      status: 404,
    };
  }

  let resolvedStopName = stopName;

  if (locationId) {
    const locationResult = await pool.query(
      `SELECT
         id,
         location_name,
         display_name
       FROM passenger_locations
       WHERE id = $1`,
      [locationId]
    );

    if (locationResult.rows.length === 0) {
      return {
        error: "Selected passenger location was not found.",
        status: 404,
      };
    }

    if (!resolvedStopName) {
      resolvedStopName =
        normalizeText(locationResult.rows[0].display_name) ||
        locationResult.rows[0].location_name;
    }
  }

  const orderConflict = await pool.query(
    `SELECT id
     FROM stops
     WHERE route_id = $1
       AND stop_order = $2
       AND ($3::INTEGER IS NULL OR id <> $3)
     LIMIT 1`,
    [routeId, stopOrder, existingId]
  );

  if (orderConflict.rows.length > 0) {
    return {
      error:
        "Another stop already uses this order on the selected route.",
      status: 409,
    };
  }

  if (locationId) {
    const locationConflict = await pool.query(
      `SELECT id
       FROM stops
       WHERE route_id = $1
         AND location_id = $2
         AND ($3::INTEGER IS NULL OR id <> $3)
       LIMIT 1`,
      [routeId, locationId, existingId]
    );

    if (locationConflict.rows.length > 0) {
      return {
        error:
          "This location is already added to the selected route.",
        status: 409,
      };
    }
  }

  return {
    data: {
      routeId,
      locationId,
      stopName: resolvedStopName,
      displayName,
      stopType,
      stopOrder,
      arrivalOffset,
      departureOffset,
      distanceFromOrigin,
      boardingAllowed: parseBoolean(
        body.boarding_allowed,
        true
      ),
      droppingAllowed: parseBoolean(
        body.dropping_allowed,
        true
      ),
      landmark: normalizeText(body.landmark),
      address: normalizeText(body.address),
      latitude,
      longitude,
      isActive: parseBoolean(body.is_active, true),
    },
  };
};

const addStop = async (req, res) => {
  try {
    const validation = await validateStopPayload(req.body);

    if (validation.error) {
      return res
        .status(validation.status || 400)
        .json({
          success: false,
          message: validation.error,
        });
    }

    const stop = validation.data;

    const result = await pool.query(
      `INSERT INTO stops
        (
          route_id,
          location_id,
          stop_name,
          display_name,
          stop_type,
          stop_order,
          arrival_offset_minutes,
          departure_offset_minutes,
          distance_from_origin_km,
          boarding_allowed,
          dropping_allowed,
          landmark,
          address,
          latitude,
          longitude,
          is_active,
          updated_at
        )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10, $11, $12, $13, $14, $15, $16,
         CURRENT_TIMESTAMP
       )
       RETURNING *`,
      [
        stop.routeId,
        stop.locationId,
        stop.stopName,
        stop.displayName,
        stop.stopType,
        stop.stopOrder,
        stop.arrivalOffset,
        stop.departureOffset,
        stop.distanceFromOrigin,
        stop.boardingAllowed,
        stop.droppingAllowed,
        stop.landmark,
        stop.address,
        stop.latitude,
        stop.longitude,
        stop.isActive,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Route stop created successfully.",
      stop: result.rows[0],
    });
  } catch (error) {
    console.error("Create route stop failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create route stop.",
    });
  }
};

const getAllStops = async (req, res) => {
  try {
    const result = await pool.query(`
      ${STOP_SELECT}
      ORDER BY
        st.route_id ASC,
        st.stop_order ASC,
        st.id ASC
    `);

    return res.json({
      success: true,
      total: result.rows.length,
      stops: result.rows,
    });
  } catch (error) {
    console.error("Get route stops failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load route stops.",
    });
  }
};

const getStopsByRoute = async (req, res) => {
  try {
    const routeId = parsePositiveInteger(req.params.route_id);

    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: "Invalid route ID.",
      });
    }

    const includeInactive =
      String(req.query.include_inactive || "")
        .trim()
        .toLowerCase() === "true";

    const result = await pool.query(
      `
      ${STOP_SELECT}
      WHERE st.route_id = $1
        AND ($2::BOOLEAN = TRUE OR st.is_active = TRUE)
      ORDER BY st.stop_order ASC, st.id ASC
      `,
      [routeId, includeInactive]
    );

    return res.json({
      success: true,
      total: result.rows.length,
      route_id: routeId,
      stops: result.rows,
    });
  } catch (error) {
    console.error("Get stops by route failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load stops for this route.",
    });
  }
};

const getPublicStopsByRoute = async (req, res) => {
  try {
    const routeId = parsePositiveInteger(req.params.route_id);

    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: "Invalid route ID.",
      });
    }

    const result = await pool.query(
      `
      ${STOP_SELECT}
      WHERE st.route_id = $1
        AND st.is_active = TRUE
      ORDER BY st.stop_order ASC, st.id ASC
      `,
      [routeId]
    );

    return res.json({
      success: true,
      total: result.rows.length,
      route_id: routeId,
      stops: result.rows,
    });
  } catch (error) {
    console.error("Get public route stops failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load public route stops.",
    });
  }
};

const updateStop = async (req, res) => {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid stop ID.",
      });
    }

    const currentResult = await pool.query(
      "SELECT * FROM stops WHERE id = $1",
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Route stop was not found.",
      });
    }

    const current = currentResult.rows[0];

    const mergedPayload = {
      route_id:
        req.body.route_id !== undefined
          ? req.body.route_id
          : current.route_id,
      location_id:
        req.body.location_id !== undefined
          ? req.body.location_id
          : current.location_id,
      stop_name:
        req.body.stop_name !== undefined
          ? req.body.stop_name
          : current.stop_name,
      display_name:
        req.body.display_name !== undefined
          ? req.body.display_name
          : current.display_name,
      stop_type:
        req.body.stop_type !== undefined
          ? req.body.stop_type
          : current.stop_type,
      stop_order:
        req.body.stop_order !== undefined
          ? req.body.stop_order
          : current.stop_order,
      arrival_offset_minutes:
        req.body.arrival_offset_minutes !== undefined
          ? req.body.arrival_offset_minutes
          : current.arrival_offset_minutes,
      departure_offset_minutes:
        req.body.departure_offset_minutes !== undefined
          ? req.body.departure_offset_minutes
          : current.departure_offset_minutes,
      distance_from_origin_km:
        req.body.distance_from_origin_km !== undefined
          ? req.body.distance_from_origin_km
          : current.distance_from_origin_km,
      boarding_allowed:
        req.body.boarding_allowed !== undefined
          ? req.body.boarding_allowed
          : current.boarding_allowed,
      dropping_allowed:
        req.body.dropping_allowed !== undefined
          ? req.body.dropping_allowed
          : current.dropping_allowed,
      landmark:
        req.body.landmark !== undefined
          ? req.body.landmark
          : current.landmark,
      address:
        req.body.address !== undefined
          ? req.body.address
          : current.address,
      latitude:
        req.body.latitude !== undefined
          ? req.body.latitude
          : current.latitude,
      longitude:
        req.body.longitude !== undefined
          ? req.body.longitude
          : current.longitude,
      is_active:
        req.body.is_active !== undefined
          ? req.body.is_active
          : current.is_active,
    };

    const validation = await validateStopPayload(
      mergedPayload,
      id
    );

    if (validation.error) {
      return res
        .status(validation.status || 400)
        .json({
          success: false,
          message: validation.error,
        });
    }

    const stop = validation.data;

    const result = await pool.query(
      `UPDATE stops
       SET
         route_id = $1,
         location_id = $2,
         stop_name = $3,
         display_name = $4,
         stop_type = $5,
         stop_order = $6,
         arrival_offset_minutes = $7,
         departure_offset_minutes = $8,
         distance_from_origin_km = $9,
         boarding_allowed = $10,
         dropping_allowed = $11,
         landmark = $12,
         address = $13,
         latitude = $14,
         longitude = $15,
         is_active = $16,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING *`,
      [
        stop.routeId,
        stop.locationId,
        stop.stopName,
        stop.displayName,
        stop.stopType,
        stop.stopOrder,
        stop.arrivalOffset,
        stop.departureOffset,
        stop.distanceFromOrigin,
        stop.boardingAllowed,
        stop.droppingAllowed,
        stop.landmark,
        stop.address,
        stop.latitude,
        stop.longitude,
        stop.isActive,
        id,
      ]
    );

    return res.json({
      success: true,
      message: "Route stop updated successfully.",
      stop: result.rows[0],
    });
  } catch (error) {
    console.error("Update route stop failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update route stop.",
    });
  }
};

const deleteStop = async (req, res) => {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid stop ID.",
      });
    }

    const dependencyResult = await pool.query(
      `SELECT
         (
           SELECT COUNT(*)
           FROM journeys
           WHERE boarding_stop_id = $1
              OR dropping_stop_id = $1
         )::INT AS journey_count`,
      [id]
    );

    if (dependencyResult.rows[0].journey_count > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This stop is used by existing journeys. Deactivate it instead of deleting it.",
      });
    }

    const result = await pool.query(
      `DELETE FROM stops
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Route stop was not found.",
      });
    }

    return res.json({
      success: true,
      message: "Route stop deleted successfully.",
    });
  } catch (error) {
    console.error("Delete route stop failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete route stop.",
    });
  }
};

module.exports = {
  addStop,
  getAllStops,
  getStopsByRoute,
  getPublicStopsByRoute,
  updateStop,
  deleteStop,
};
