const pool = require("../config/db");

const normalizeText = (value) =>
  String(value || "").trim();

const parseOptionalPositiveInteger = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const validChannels = new Set([
  "ANDROID_APP",
  "IOS_APP",
  "MOBILE_WEB",
  "DESKTOP_WEB",
  "COUNTER",
  "AGENT",
  "CONDUCTOR",
  "ADMIN",
  "OTHER",
]);

const validPermissionStatuses = new Set([
  "NOT_REQUESTED",
  "GRANTED",
  "DENIED",
  "UNAVAILABLE",
  "TIMEOUT",
]);

const normalizeChannel = (value) => {
  const normalized = normalizeText(value).toUpperCase();

  return validChannels.has(normalized)
    ? normalized
    : "OTHER";
};

const normalizePermissionStatus = (value) => {
  const normalized = normalizeText(value).toUpperCase();

  return validPermissionStatuses.has(normalized)
    ? normalized
    : "NOT_REQUESTED";
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return (
    req.socket?.remoteAddress ||
    req.ip ||
    null
  );
};

const resolveLocationId = async (text, suppliedId) => {
  const parsedId = parseOptionalPositiveInteger(suppliedId);

  if (parsedId) {
    const byId = await pool.query(
      `SELECT id
       FROM passenger_locations
       WHERE id = $1`,
      [parsedId]
    );

    if (byId.rows.length > 0) {
      return byId.rows[0].id;
    }
  }

  if (!text) {
    return null;
  }

  const byName = await pool.query(
    `SELECT id
     FROM passenger_locations
     WHERE
       LOWER(TRIM(location_name)) = LOWER(TRIM($1))
       OR LOWER(TRIM(display_name)) = LOWER(TRIM($1))
     ORDER BY
       is_active DESC,
       sort_order ASC,
       id ASC
     LIMIT 1`,
    [text]
  );

  return byName.rows[0]?.id || null;
};

const searchBus = async (req, res) => {
  try {
    const source = normalizeText(req.query.source);
    const destination = normalizeText(
      req.query.destination
    );
    const journeyDate = normalizeText(
      req.query.journey_date
    );

    const anonymousSessionId = normalizeText(
      req.query.anonymous_session_id
    );

    if (
      !source ||
      !destination ||
      !journeyDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Source, destination and journey date are required.",
      });
    }

    if (!anonymousSessionId) {
      return res.status(400).json({
        success: false,
        message:
          "Anonymous session ID is required.",
      });
    }

    const sourceLocationId = await resolveLocationId(
      source,
      req.query.source_location_id
    );

    const destinationLocationId =
      await resolveLocationId(
        destination,
        req.query.destination_location_id
      );

    const nearestLocationId =
      parseOptionalPositiveInteger(
        req.query.nearest_location_id
      );

    const selectedNearestLocationId =
      parseOptionalPositiveInteger(
        req.query.selected_nearest_location_id
      );

    const channel = normalizeChannel(
      req.query.channel
    );

    const locationPermissionStatus =
      normalizePermissionStatus(
        req.query.location_permission_status
      );

    const sql = `
      SELECT
        s.id AS schedule_id,
        s.bus_id,
        s.route_id,
        b.bus_name,
        b.bus_number,
        b.total_seats,
        TRIM(r.source) AS source,
        TRIM(r.destination) AS destination,
        s.departure_time,
        s.arrival_time,
        (
          SELECT COUNT(*)
          FROM bookings bk
          WHERE bk.schedule_id = s.id
            AND bk.booking_status = 'confirmed'
        )::INT AS booked_seats
      FROM schedules s
      INNER JOIN buses b
        ON b.id = s.bus_id
      INNER JOIN routes r
        ON r.id = s.route_id
      WHERE
        TRIM(LOWER(r.source)) = LOWER($1)
        AND TRIM(LOWER(r.destination)) = LOWER($2)
        AND DATE(s.departure_time) = $3::date
      ORDER BY s.departure_time
    `;

    const result = await pool.query(sql, [
      source,
      destination,
      journeyDate,
    ]);

    const buses = result.rows.map((row) => ({
      ...row,
      available_seats:
        Number(row.total_seats) -
        Number(row.booked_seats),
    }));

    const logResult = await pool.query(
      `INSERT INTO customer_search_logs
       (
         anonymous_session_id,
         channel,
         device_type,
         operating_system,
         browser_name,
         app_version,
         source_text,
         destination_text,
         journey_date,
         source_location_id,
         destination_location_id,
         nearest_location_id,
         selected_nearest_location_id,
         location_permission_status,
         result_count,
         bus_found,
         ip_address,
         user_agent
       )
       VALUES
       (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16, $17, $18
       )
       RETURNING id`,
      [
        anonymousSessionId,
        channel,
        normalizeText(req.query.device_type) || null,
        normalizeText(req.query.operating_system) || null,
        normalizeText(req.query.browser_name) || null,
        normalizeText(req.query.app_version) || null,
        source,
        destination,
        journeyDate,
        sourceLocationId,
        destinationLocationId,
        nearestLocationId,
        selectedNearestLocationId,
        locationPermissionStatus,
        buses.length,
        buses.length > 0,
        getClientIp(req),
        req.headers["user-agent"] || null,
      ]
    );

    return res.json({
      success: true,
      total: buses.length,
      search_log_id: logResult.rows[0].id,
      buses,
    });
  } catch (error) {
    console.error("Search bus failed:", error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to search buses.",
    });
  }
};

module.exports = {
  searchBus,
};
