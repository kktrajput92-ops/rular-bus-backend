const pool = require("../config/db");

const allowedStatuses = new Set([
  "GRANTED",
  "DENIED",
  "UNAVAILABLE",
  "TIMEOUT",
]);

const allowedChannels = new Set([
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

const normalizeText = (value) =>
  String(value || "").trim();

const parseOptionalInteger = (value) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return req.socket?.remoteAddress || req.ip || null;
};

const logLocationConsent = async (req, res) => {
  try {
    const anonymousSessionId = normalizeText(
      req.body.anonymous_session_id
    );

    const consentStatus = normalizeText(
      req.body.consent_status
    ).toUpperCase();

    const channelInput = normalizeText(
      req.body.channel
    ).toUpperCase();

    const channel = allowedChannels.has(channelInput)
      ? channelInput
      : "OTHER";

    if (!anonymousSessionId) {
      return res.status(400).json({
        success: false,
        message:
          "Anonymous session ID is required.",
      });
    }

    if (!allowedStatuses.has(consentStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid location consent status.",
      });
    }

    const result = await pool.query(
      `INSERT INTO customer_location_consent_logs
       (
         anonymous_session_id,
         consent_status,
         purpose,
         channel,
         nearest_location_id,
         accuracy_meters,
         ip_address,
         user_agent
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        anonymousSessionId,
        consentStatus,
        "NEAREST_PICKUP_LOCATION",
        channel,
        parseOptionalInteger(
          req.body.nearest_location_id
        ),
        parseOptionalInteger(
          req.body.accuracy_meters
        ),
        getClientIp(req),
        req.headers["user-agent"] || null,
      ]
    );

    return res.status(201).json({
      success: true,
      consent_log: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Location consent logging failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to record location consent.",
    });
  }
};

const parseAnalyticsDays = (value) => {
  const parsed = Number(value ?? 30);

  if (!Number.isInteger(parsed)) {
    return 30;
  }

  return Math.min(Math.max(parsed, 1), 365);
};

const getCustomerIntelligenceOverview = async (
  req,
  res
) => {
  try {
    const days = parseAnalyticsDays(req.query.days);

    const result = await pool.query(
      `SELECT
         COUNT(*)::INT AS total_searches,

         COUNT(
           DISTINCT anonymous_session_id
         )::INT AS unique_users,

         COUNT(*) FILTER (
           WHERE bus_found = TRUE
         )::INT AS searches_with_buses,

         COUNT(*) FILTER (
           WHERE bus_found = FALSE
         )::INT AS no_bus_searches,

         COUNT(*) FILTER (
           WHERE booking_created = TRUE
         )::INT AS converted_searches,

         COUNT(*) FILTER (
           WHERE channel = 'MOBILE_WEB'
         )::INT AS mobile_web_searches,

         COUNT(*) FILTER (
           WHERE channel = 'DESKTOP_WEB'
         )::INT AS desktop_web_searches,

         COUNT(*) FILTER (
           WHERE channel = 'ANDROID_APP'
         )::INT AS android_app_searches,

         COUNT(*) FILTER (
           WHERE channel = 'IOS_APP'
         )::INT AS ios_app_searches,

         COUNT(*) FILTER (
           WHERE location_permission_status = 'GRANTED'
         )::INT AS location_granted_searches,

         COUNT(*) FILTER (
           WHERE location_permission_status = 'DENIED'
         )::INT AS location_denied_searches
       FROM customer_search_logs
       WHERE searched_at >=
         CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')`,
      [days]
    );

    const metrics = result.rows[0];

    const totalSearches =
      Number(metrics.total_searches) || 0;

    const convertedSearches =
      Number(metrics.converted_searches) || 0;

    const noBusSearches =
      Number(metrics.no_bus_searches) || 0;

    return res.json({
      success: true,
      days,
      overview: {
        ...metrics,

        conversion_rate:
          totalSearches > 0
            ? Number(
                (
                  (convertedSearches /
                    totalSearches) *
                  100
                ).toFixed(2)
              )
            : 0,

        no_bus_rate:
          totalSearches > 0
            ? Number(
                (
                  (noBusSearches /
                    totalSearches) *
                  100
                ).toFixed(2)
              )
            : 0,
      },
    });
  } catch (error) {
    console.error(
      "Customer intelligence overview failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load customer intelligence overview.",
    });
  }
};

const getPlatformAnalytics = async (req, res) => {
  try {
    const days = parseAnalyticsDays(req.query.days);

    const result = await pool.query(
      `SELECT
         channel,
         COALESCE(device_type, 'UNKNOWN')
           AS device_type,
         COALESCE(operating_system, 'UNKNOWN')
           AS operating_system,

         COUNT(*)::INT AS total_searches,

         COUNT(
           DISTINCT anonymous_session_id
         )::INT AS unique_users,

         COUNT(*) FILTER (
           WHERE bus_found = TRUE
         )::INT AS searches_with_buses,

         COUNT(*) FILTER (
           WHERE booking_created = TRUE
         )::INT AS converted_searches
       FROM customer_search_logs
       WHERE searched_at >=
         CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
       GROUP BY
         channel,
         COALESCE(device_type, 'UNKNOWN'),
         COALESCE(operating_system, 'UNKNOWN')
       ORDER BY
         unique_users DESC,
         total_searches DESC`,
      [days]
    );

    return res.json({
      success: true,
      days,
      platforms: result.rows,
    });
  } catch (error) {
    console.error(
      "Platform analytics failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load platform analytics.",
    });
  }
};

const getLocationAnalytics = async (req, res) => {
  try {
    const days = parseAnalyticsDays(req.query.days);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const result = await pool.query(
      `SELECT
         COALESCE(
           pl.id,
           csl.source_location_id
         ) AS location_id,

         COALESCE(
           NULLIF(TRIM(pl.display_name), ''),
           pl.location_name,
           csl.source_text
         ) AS location_name,

         pl.state_name,
         pl.latitude,
         pl.longitude,

         COUNT(*)::INT AS total_searches,

         COUNT(
           DISTINCT csl.anonymous_session_id
         )::INT AS unique_users,

         COUNT(*) FILTER (
           WHERE csl.bus_found = TRUE
         )::INT AS searches_with_buses,

         COUNT(*) FILTER (
           WHERE csl.bus_found = FALSE
         )::INT AS no_bus_searches,

         COUNT(*) FILTER (
           WHERE csl.booking_created = TRUE
         )::INT AS converted_searches
       FROM customer_search_logs csl
       LEFT JOIN passenger_locations pl
         ON pl.id = csl.source_location_id
       WHERE csl.searched_at >=
         CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
       GROUP BY
         COALESCE(
           pl.id,
           csl.source_location_id
         ),
         COALESCE(
           NULLIF(TRIM(pl.display_name), ''),
           pl.location_name,
           csl.source_text
         ),
         pl.state_name,
         pl.latitude,
         pl.longitude
       ORDER BY
         unique_users DESC,
         total_searches DESC
       LIMIT $2`,
      [days, limit]
    );

    return res.json({
      success: true,
      days,
      locations: result.rows,
    });
  } catch (error) {
    console.error(
      "Location analytics failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load location analytics.",
    });
  }
};

const getRouteAnalytics = async (req, res) => {
  try {
    const days = parseAnalyticsDays(req.query.days);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const result = await pool.query(
      `SELECT
         source_text,
         destination_text,

         COUNT(*)::INT AS total_searches,

         COUNT(
           DISTINCT anonymous_session_id
         )::INT AS unique_users,

         COUNT(*) FILTER (
           WHERE bus_found = TRUE
         )::INT AS searches_with_buses,

         COUNT(*) FILTER (
           WHERE bus_found = FALSE
         )::INT AS no_bus_searches,

         COUNT(*) FILTER (
           WHERE booking_created = TRUE
         )::INT AS converted_searches,

         ROUND(
           (
             100.0 *
             COUNT(*) FILTER (
               WHERE booking_created = TRUE
             ) /
             NULLIF(COUNT(*), 0)
           ),
           2
         ) AS conversion_rate
       FROM customer_search_logs
       WHERE searched_at >=
         CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
       GROUP BY
         source_text,
         destination_text
       ORDER BY
         unique_users DESC,
         total_searches DESC
       LIMIT $2`,
      [days, limit]
    );

    return res.json({
      success: true,
      days,
      routes: result.rows,
    });
  } catch (error) {
    console.error(
      "Route analytics failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load route analytics.",
    });
  }
};

const getNoBusDemandAnalytics = async (
  req,
  res
) => {
  try {
    const days = parseAnalyticsDays(req.query.days);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const result = await pool.query(
      `SELECT
         source_text,
         destination_text,

         COUNT(*)::INT AS no_bus_searches,

         COUNT(
           DISTINCT anonymous_session_id
         )::INT AS affected_users,

         MIN(journey_date) AS earliest_journey_date,
         MAX(journey_date) AS latest_journey_date,
         MAX(searched_at) AS last_searched_at
       FROM customer_search_logs
       WHERE bus_found = FALSE
         AND searched_at >=
           CURRENT_TIMESTAMP -
           ($1 * INTERVAL '1 day')
       GROUP BY
         source_text,
         destination_text
       ORDER BY
         affected_users DESC,
         no_bus_searches DESC
       LIMIT $2`,
      [days, limit]
    );

    return res.json({
      success: true,
      days,
      no_bus_demand: result.rows,
    });
  } catch (error) {
    console.error(
      "No-bus demand analytics failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load no-bus demand analytics.",
    });
  }
};

const getLocationConsentAnalytics = async (
  req,
  res
) => {
  try {
    const days = parseAnalyticsDays(req.query.days);

    const result = await pool.query(
      `SELECT
         consent_status,
         channel,

         COUNT(*)::INT AS total_events,

         COUNT(
           DISTINCT anonymous_session_id
         )::INT AS unique_users
       FROM customer_location_consent_logs
       WHERE created_at >=
         CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
       GROUP BY consent_status, channel
       ORDER BY
         unique_users DESC,
         total_events DESC`,
      [days]
    );

    return res.json({
      success: true,
      days,
      consent: result.rows,
    });
  } catch (error) {
    console.error(
      "Location consent analytics failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load location consent analytics.",
    });
  }
};

const linkSearchToBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const searchLogId = parseOptionalInteger(
      req.body.search_log_id
    );

    const bookingId = parseOptionalInteger(
      req.body.booking_id
    );

    const passengerId = parseOptionalInteger(
      req.body.passenger_id
    );

    const anonymousSessionId = normalizeText(
      req.body.anonymous_session_id
    );

    if (
      !searchLogId ||
      !bookingId ||
      !passengerId ||
      !anonymousSessionId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Search log ID, booking ID, passenger ID and anonymous session ID are required.",
      });
    }

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT
         b.id,
         b.passenger_id,
         b.schedule_id,
         b.booking_status,
         TRIM(r.source) AS source,
         TRIM(r.destination) AS destination,
         DATE(s.departure_time) AS journey_date
       FROM bookings b
       INNER JOIN schedules s
         ON s.id = b.schedule_id
       INNER JOIN routes r
         ON r.id = s.route_id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const booking = bookingResult.rows[0];

    const passengerBelongsToBooking =
      Number(booking.passenger_id) === passengerId;

    let multiPassengerMatch = false;

    if (!passengerBelongsToBooking) {
      const bookingPassengerResult =
        await client.query(
          `SELECT 1
           FROM booking_passengers
           WHERE booking_id = $1
             AND passenger_id = $2
           LIMIT 1`,
          [bookingId, passengerId]
        );

      multiPassengerMatch =
        bookingPassengerResult.rows.length > 0;
    }

    if (
      !passengerBelongsToBooking &&
      !multiPassengerMatch
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Passenger does not belong to this booking.",
      });
    }

    const searchResult = await client.query(
      `SELECT
         id,
         anonymous_session_id,
         source_text,
         destination_text,
         journey_date,
         bus_found,
         booking_created,
         booking_id
       FROM customer_search_logs
       WHERE id = $1
       FOR UPDATE`,
      [searchLogId]
    );

    if (searchResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Search analytics record not found.",
      });
    }

    const searchLog = searchResult.rows[0];

    if (
      searchLog.anonymous_session_id !==
      anonymousSessionId
    ) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message:
          "Search analytics session does not match.",
      });
    }

    if (!searchLog.bus_found) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "A no-bus search cannot be linked to a booking.",
      });
    }

    const normalizedSearchSource =
      normalizeText(searchLog.source_text).toLowerCase();

    const normalizedSearchDestination =
      normalizeText(
        searchLog.destination_text
      ).toLowerCase();

    const normalizedBookingSource =
      normalizeText(booking.source).toLowerCase();

    const normalizedBookingDestination =
      normalizeText(
        booking.destination
      ).toLowerCase();

    const searchJourneyDate = new Date(
      searchLog.journey_date
    )
      .toISOString()
      .slice(0, 10);

    const bookingJourneyDate = new Date(
      booking.journey_date
    )
      .toISOString()
      .slice(0, 10);

    if (
      normalizedSearchSource !==
        normalizedBookingSource ||
      normalizedSearchDestination !==
        normalizedBookingDestination ||
      searchJourneyDate !== bookingJourneyDate
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "Booking route or journey date does not match the original search.",
        search: {
          source: searchLog.source_text,
          destination:
            searchLog.destination_text,
          journey_date: searchJourneyDate,
        },
        booking: {
          source: booking.source,
          destination: booking.destination,
          journey_date: bookingJourneyDate,
        },
      });
    }

    if (
      searchLog.booking_created &&
      Number(searchLog.booking_id) === bookingId
    ) {
      await client.query("COMMIT");

      return res.json({
        success: true,
        already_linked: true,
        conversion: searchLog,
      });
    }

    if (
      searchLog.booking_created &&
      searchLog.booking_id &&
      Number(searchLog.booking_id) !== bookingId
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "This search is already linked to another booking.",
      });
    }

    const updateResult = await client.query(
      `UPDATE customer_search_logs
       SET
         passenger_id = $1,
         booking_id = $2,
         booking_created = TRUE,
         converted_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING
         id,
         passenger_id,
         booking_id,
         booking_created,
         converted_at`,
      [
        passengerId,
        bookingId,
        searchLogId,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      already_linked: false,
      conversion: updateResult.rows[0],
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Conversion rollback failed:",
        rollbackError
      );
    }

    console.error(
      "Search booking conversion link failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to link search with booking.",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  logLocationConsent,

  getCustomerIntelligenceOverview,
  getPlatformAnalytics,
  getLocationAnalytics,
  getRouteAnalytics,
  getNoBusDemandAnalytics,
  getLocationConsentAnalytics,
  linkSearchToBooking,};
