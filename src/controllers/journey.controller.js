const pool = require("../config/db");

// ===============================
// GET ALL JOURNEYS
// ===============================
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

      ORDER BY j.id
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

// ===============================
// GET JOURNEY BY ID
// ===============================
const getJourneyById = async (req, res) => {
  try {

    const { id } = req.params;

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

      WHERE j.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Journey not found"
      });
    }

    res.json({
      success: true,
      journey: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

// ===============================
// ADD JOURNEY
// ===============================
const addJourney = async (req, res) => {
  try {

    const {
      route_id,
      boarding_stop_id,
      dropping_stop_id,
      distance_km,
      duration_minutes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO journeys
      (
        route_id,
        boarding_stop_id,
        dropping_stop_id,
        distance_km,
        duration_minutes
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        route_id,
        boarding_stop_id,
        dropping_stop_id,
        distance_km,
        duration_minutes
      ]
    );

    res.status(201).json({
      success: true,
      message: "Journey Added Successfully",
      journey: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

// ===============================
// UPDATE JOURNEY
// ===============================
const updateJourney = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      route_id,
      boarding_stop_id,
      dropping_stop_id,
      distance_km,
      duration_minutes
    } = req.body;

    const result = await pool.query(
      `UPDATE journeys
      SET
      route_id=$1,
      boarding_stop_id=$2,
      dropping_stop_id=$3,
      distance_km=$4,
      duration_minutes=$5
      WHERE id=$6
      RETURNING *`,
      [
        route_id,
        boarding_stop_id,
        dropping_stop_id,
        distance_km,
        duration_minutes,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Journey not found"
      });
    }

    res.json({
      success: true,
      message: "Journey Updated Successfully",
      journey: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};
// ===============================
// DELETE JOURNEY
// ===============================
const deleteJourney = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM journeys WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Journey not found"
      });
    }

    res.json({
      success: true,
      message: "Journey Deleted Successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

// ===============================
// MODULE EXPORTS
// ===============================
module.exports = {
  getAllJourneys,
  getJourneyById,
  addJourney,
  updateJourney,
  deleteJourney
};
