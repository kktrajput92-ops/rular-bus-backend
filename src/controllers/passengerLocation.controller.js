const pool = require("../config/db");

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;

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

const parseSortOrder = (value) => {
  const parsed = Number(value ?? 0);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const parseOptionalCoordinate = (
  value,
  minimum,
  maximum
) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
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

const parseGeofenceRadius = (value) => {
  const parsed = Number(value ?? 5000);

  if (
    !Number.isInteger(parsed) ||
    parsed < 100 ||
    parsed > 100000
  ) {
    return null;
  }

  return parsed;
};

const parseBoolean = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  return fallback;
};

const resolveLocationType = async ({
  locationTypeId,
  locationTypeCode,
  allowInactive = false,
}) => {
  const parsedId = parsePositiveInteger(locationTypeId);

  if (parsedId) {
    const result = await pool.query(
      `SELECT
         id,
         type_code,
         type_name,
         display_name,
         icon,
         is_active
       FROM passenger_location_types
       WHERE id = $1`,
      [parsedId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    if (!allowInactive && !result.rows[0].is_active) {
      return null;
    }

    return result.rows[0];
  }

  const normalizedCode = String(
    locationTypeCode || "CITY"
  )
    .trim()
    .toUpperCase();

  const result = await pool.query(
    `SELECT
       id,
       type_code,
       type_name,
       display_name,
       icon,
       is_active
     FROM passenger_location_types
     WHERE type_code = $1`,
    [normalizedCode]
  );

  if (result.rows.length === 0) {
    return null;
  }

  if (!allowInactive && !result.rows[0].is_active) {
    return null;
  }

  return result.rows[0];
};

const getPublicLocations = async (req, res) => {
  try {
    const type = String(req.query.type || "")
      .trim()
      .toLowerCase();

    let permissionFilter = "";

    if (type === "source") {
      permissionFilter = "AND pl.allow_source = TRUE";
    }

    if (type === "destination") {
      permissionFilter = "AND pl.allow_destination = TRUE";
    }

    const result = await pool.query(`
      SELECT
        pl.id,
        pl.location_name,
        COALESCE(
          NULLIF(TRIM(pl.display_name), ''),
          pl.location_name
        ) AS display_name,
        pl.state_name,
        pl.location_type,
        pl.location_type_id,
        plt.type_name AS location_type_name,
        plt.display_name AS location_type_display_name,
        plt.icon AS location_type_icon,
        pl.allow_source,
        pl.allow_destination,
        pl.sort_order
      FROM passenger_locations pl
      LEFT JOIN passenger_location_types plt
        ON plt.id = pl.location_type_id
      WHERE pl.is_active = TRUE
      ${permissionFilter}
      ORDER BY
        pl.sort_order ASC,
        pl.display_name ASC,
        pl.id ASC
    `);

    return res.json({
      success: true,
      locations: result.rows,
    });
  } catch (error) {
    console.error(
      "Get public passenger locations failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load passenger locations.",
    });
  }
};

const getNearestLocations = async (req, res) => {
  try {
    const latitude = parseOptionalCoordinate(
      req.query.latitude,
      -90,
      90
    );

    const longitude = parseOptionalCoordinate(
      req.query.longitude,
      -180,
      180
    );

    const requestedLimit = Number(req.query.limit ?? 5);

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 20)
      : 5;

    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid latitude and longitude are required.",
      });
    }

    const result = await pool.query(
      `SELECT
         pl.id,
         pl.location_name,
         COALESCE(
           NULLIF(TRIM(pl.display_name), ''),
           pl.location_name
         ) AS display_name,
         pl.state_name,
         pl.location_type,
         pl.location_type_id,
         plt.type_name AS location_type_name,
         plt.display_name AS location_type_display_name,
         plt.icon AS location_type_icon,
         pl.latitude,
         pl.longitude,
         pl.geofence_radius_meters,
         pl.landmark,
         pl.address,
         ROUND(
           (
             6371 * ACOS(
               LEAST(
                 1,
                 GREATEST(
                   -1,
                   COS(RADIANS($1))
                   * COS(RADIANS(pl.latitude::DOUBLE PRECISION))
                   * COS(
                       RADIANS(
                         pl.longitude::DOUBLE PRECISION
                       ) - RADIANS($2)
                     )
                   + SIN(RADIANS($1))
                   * SIN(
                       RADIANS(
                         pl.latitude::DOUBLE PRECISION
                       )
                     )
                 )
               )
             )
           )::NUMERIC,
           2
         ) AS distance_km
       FROM passenger_locations pl
       LEFT JOIN passenger_location_types plt
         ON plt.id = pl.location_type_id
       WHERE pl.is_active = TRUE
         AND pl.allow_source = TRUE
         AND pl.latitude IS NOT NULL
         AND pl.longitude IS NOT NULL
       ORDER BY distance_km ASC, pl.sort_order ASC, pl.id ASC
       LIMIT $3`,
      [latitude, longitude, limit]
    );

    return res.json({
      success: true,
      current_location: {
        latitude,
        longitude,
      },
      nearest_locations: result.rows,
    });
  } catch (error) {
    console.error(
      "Get nearest passenger locations failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to find nearby passenger locations.",
    });
  }
};

const getAllLocations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pl.*,
        plt.type_name AS location_type_name,
        plt.display_name AS location_type_display_name,
        plt.icon AS location_type_icon
      FROM passenger_locations pl
      LEFT JOIN passenger_location_types plt
        ON plt.id = pl.location_type_id
      ORDER BY
        pl.sort_order ASC,
        pl.location_name ASC,
        pl.id ASC
    `);

    return res.json({
      success: true,
      locations: result.rows,
    });
  } catch (error) {
    console.error("Get passenger locations failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load passenger locations.",
    });
  }
};

const createLocation = async (req, res) => {
  try {
    const locationName = normalizeText(
      req.body.location_name
    );
    const displayName = normalizeText(
      req.body.display_name
    );
    const stateName = normalizeText(req.body.state_name);
    const sortOrder = parseSortOrder(req.body.sort_order);
    const latitude = parseOptionalCoordinate(
      req.body.latitude,
      -90,
      90
    );
    const longitude = parseOptionalCoordinate(
      req.body.longitude,
      -180,
      180
    );
    const geofenceRadius = parseGeofenceRadius(
      req.body.geofence_radius_meters
    );
    const address = normalizeText(req.body.address);
    const landmark = normalizeText(req.body.landmark);

    if (!locationName) {
      return res.status(400).json({
        success: false,
        message: "Location name is required.",
      });
    }

    if (sortOrder === null) {
      return res.status(400).json({
        success: false,
        message:
          "Sort order must be a non-negative integer.",
      });
    }

    if (latitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90.",
      });
    }

    if (longitude === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Longitude must be between -180 and 180.",
      });
    }

    if (
      (latitude === null && longitude !== null) ||
      (latitude !== null && longitude === null)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude and longitude must be provided together.",
      });
    }

    if (geofenceRadius === null) {
      return res.status(400).json({
        success: false,
        message:
          "Geofence radius must be between 100 and 100000 meters.",
      });
    }

    const selectedType = await resolveLocationType({
      locationTypeId: req.body.location_type_id,
      locationTypeCode: req.body.location_type,
    });

    if (!selectedType) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid active location type.",
      });
    }

    const result = await pool.query(
      `INSERT INTO passenger_locations
        (
          location_name,
          display_name,
          state_name,
          location_type,
          location_type_id,
          allow_source,
          allow_destination,
          sort_order,
          is_active,
          latitude,
          longitude,
          geofence_radius_meters,
          address,
          landmark
        )
       VALUES
        (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14
        )
       RETURNING *`,
      [
        locationName,
        displayName,
        stateName,
        selectedType.type_code,
        selectedType.id,
        parseBoolean(req.body.allow_source, true),
        parseBoolean(req.body.allow_destination, true),
        sortOrder,
        parseBoolean(req.body.is_active, true),
        latitude,
        longitude,
        geofenceRadius,
        address,
        landmark,
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Passenger location created successfully.",
      location: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create passenger location failed:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "This passenger location already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create passenger location.",
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const id = parsePositiveInteger(req.params.id);

    const locationName = normalizeText(
      req.body.location_name
    );

    const displayName = normalizeText(
      req.body.display_name
    );

    const stateName = normalizeText(
      req.body.state_name
    );

    const sortOrder = parseSortOrder(
      req.body.sort_order
    );

    const latitude = parseOptionalCoordinate(
      req.body.latitude,
      -90,
      90
    );

    const longitude = parseOptionalCoordinate(
      req.body.longitude,
      -180,
      180
    );

    const geofenceRadius = parseGeofenceRadius(
      req.body.geofence_radius_meters
    );

    const address = normalizeText(
      req.body.address
    );

    const landmark = normalizeText(
      req.body.landmark
    );

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid passenger location ID.",
      });
    }

    if (!locationName) {
      return res.status(400).json({
        success: false,
        message: "Location name is required.",
      });
    }

    if (sortOrder === null) {
      return res.status(400).json({
        success: false,
        message:
          "Sort order must be a non-negative integer.",
      });
    }

    if (latitude === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude must be between -90 and 90.",
      });
    }

    if (longitude === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Longitude must be between -180 and 180.",
      });
    }

    if (
      (latitude === null && longitude !== null) ||
      (latitude !== null && longitude === null)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude and longitude must be provided together.",
      });
    }

    if (geofenceRadius === null) {
      return res.status(400).json({
        success: false,
        message:
          "Geofence radius must be between 100 and 100000 meters.",
      });
    }

    const selectedType = await resolveLocationType({
      locationTypeId: req.body.location_type_id,
      locationTypeCode: req.body.location_type,
      allowInactive: true,
    });

    if (!selectedType) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid location type.",
      });
    }

    const result = await pool.query(
      `UPDATE passenger_locations
       SET
         location_name = $1,
         display_name = $2,
         state_name = $3,
         location_type = $4,
         location_type_id = $5,
         allow_source = $6,
         allow_destination = $7,
         sort_order = $8,
         is_active = $9,
         latitude = $10,
         longitude = $11,
         geofence_radius_meters = $12,
         address = $13,
         landmark = $14,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING *`,
      [
        locationName,
        displayName,
        stateName,
        selectedType.type_code,
        selectedType.id,
        parseBoolean(
          req.body.allow_source,
          true
        ),
        parseBoolean(
          req.body.allow_destination,
          true
        ),
        sortOrder,
        parseBoolean(
          req.body.is_active,
          true
        ),
        latitude,
        longitude,
        geofenceRadius,
        address,
        landmark,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Passenger location was not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Passenger location updated successfully.",
      location: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update passenger location failed:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "This passenger location already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update passenger location.",
    });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid passenger location ID.",
      });
    }

    const result = await pool.query(
      `DELETE FROM passenger_locations
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Passenger location was not found.",
      });
    }

    res.json({
      success: true,
      message: "Passenger location deleted successfully.",
    });
  } catch (error) {
    console.error("Delete passenger location failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete passenger location.",
    });
  }
};

module.exports = {
  getNearestLocations,
  getPublicLocations,
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
