const pool = require("../config/db");

const searchBus = async (req, res) => {

  try {

    const source = (req.query.source || "").trim();
    const destination = (req.query.destination || "").trim();
    const journey_date = (req.query.journey_date || "").trim();

    console.log("========== SEARCH ==========");
    console.log("SOURCE :", source);
    console.log("DESTINATION :", destination);
    console.log("DATE :", journey_date);

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
          AND bk.booking_status='confirmed'
        )::INT AS booked_seats
      FROM schedules s
      INNER JOIN buses b
      ON b.id = s.bus_id
      INNER JOIN routes r
      ON r.id = s.route_id
      WHERE
        TRIM(LOWER(r.source)) = LOWER($1)
        AND
        TRIM(LOWER(r.destination)) = LOWER($2)
        AND
        DATE(s.departure_time) = $3::date
      ORDER BY s.departure_time;
    `;

    console.log(sql);
    console.log([source, destination, journey_date]);

    const result = await pool.query(sql, [
      source,
      destination,
      journey_date
    ]);

    console.log("ROWS FOUND =", result.rows.length);
    console.log(result.rows);

    const buses = result.rows.map((row) => ({
      ...row,
      available_seats:
        Number(row.total_seats) - Number(row.booked_seats)
    }));

    return res.json({
      success: true,
      total: buses.length,
      buses
    });

  } catch (err) {

    console.error("SEARCH ERROR");
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }

};

module.exports = {
  searchBus
};
