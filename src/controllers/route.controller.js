const pool = require("../config/db");

// Add Route
const addRoute = async (req, res) => {
  try {
    const {
      source,
      destination,
      distance_km,
      estimated_time,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO routes
      (source, destination, distance_km, estimated_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [source, destination, distance_km, estimated_time]
    );

    res.json({
      success: true,
      message: "Route Added Successfully",
      route: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Routes
const getAllRoutes = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM routes ORDER BY id DESC"
    );

    res.json({
      success: true,
      routes: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Route
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      source,
      destination,
      distance_km,
      estimated_time,
    } = req.body;

    const result = await pool.query(
      `UPDATE routes
       SET source=$1,
           destination=$2,
           distance_km=$3,
           estimated_time=$4
       WHERE id=$5
       RETURNING *`,
      [source, destination, distance_km, estimated_time, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      message: "Route Updated Successfully",
      route: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Route
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM routes WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      message: "Route Deleted Successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  addRoute,
  getAllRoutes,
  updateRoute,
  deleteRoute,
};
