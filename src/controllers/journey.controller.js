const pool = require("../config/db");

// GET ALL JOURNEYS
const getAllJourneys = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        j.id,
        r.source,
        r.destination,
        s1.stop_name AS boarding_stop,
        s2.stop_name AS dropping_stop,
        j.distance_km,
        j.duration_minutes,
        f.amount AS fare

      FROM journeys j

      JOIN routes r
        ON j.route_id = r.id

      JOIN stops s1
        ON j.boarding_stop_id = s1.id

      JOIN stops s2
        ON j.dropping_stop_id = s2.id

      LEFT JOIN fares f
        ON j.id = f.journey_id

      ORDER BY j.id;
    `);

    res.json({
      success: true,
      total: result.rows.length,
      journeys: result.rows
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

module.exports = {
  getAllJourneys
};
