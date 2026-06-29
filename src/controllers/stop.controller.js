const pool = require("../config/db");

// Add Stop
const addStop = async (req, res) => {
  try {

    const { route_id, stop_name, stop_order } = req.body;

    const result = await pool.query(
      `INSERT INTO stops
      (route_id,stop_name,stop_order)
      VALUES($1,$2,$3)
      RETURNING *`,
      [route_id, stop_name, stop_order]
    );

    res.json({
      success: true,
      message: "Stop Added Successfully",
      stop: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

// Get All Stops
const getAllStops = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
      stops.id,
      routes.source,
      routes.destination,
      stops.stop_name,
      stops.stop_order

      FROM stops

      JOIN routes
      ON stops.route_id=routes.id

      ORDER BY
      route_id,
      stop_order
    `);

    res.json({
      success: true,
      total: result.rows.length,
      stops: result.rows
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

// Get Stops By Route
const getStopsByRoute = async (req, res) => {
  try {

    const { route_id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM stops
       WHERE route_id=$1
       ORDER BY stop_order`,
      [route_id]
    );

    res.json({
      success: true,
      total: result.rows.length,
      stops: result.rows
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

// Update Stop
const updateStop = async (req, res) => {
  try {

    const { id } = req.params;
    const { stop_name, stop_order } = req.body;

    const result = await pool.query(
      `UPDATE stops
      SET stop_name=$1,
      stop_order=$2
      WHERE id=$3
      RETURNING *`,
      [stop_name, stop_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stop not found"
      });
    }

    res.json({
      success: true,
      message: "Stop Updated Successfully",
      stop: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

// Delete Stop
const deleteStop = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM stops WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stop not found"
      });
    }

    res.json({
      success: true,
      message: "Stop Deleted Successfully"
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
  addStop,
  getAllStops,
  getStopsByRoute,
  updateStop,
  deleteStop
};
