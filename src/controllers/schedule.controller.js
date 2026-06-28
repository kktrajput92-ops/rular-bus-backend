const pool = require("../config/db");

// Add Schedule
const addSchedule = async (req, res) => {
  try {
    const {
      bus_id,
      route_id,
      departure_time,
      arrival_time,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO schedules
      (bus_id, route_id, departure_time, arrival_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [bus_id, route_id, departure_time, arrival_time]
    );

    res.json({
      success: true,
      message: "Schedule Added Successfully",
      schedule: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Schedules
const getAllSchedules = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        schedules.id,
        buses.bus_name,
        buses.bus_number,
        routes.source,
        routes.destination,
        schedules.departure_time,
        schedules.arrival_time
      FROM schedules
      JOIN buses
        ON schedules.bus_id = buses.id
      JOIN routes
        ON schedules.route_id = routes.id
      ORDER BY schedules.id DESC
    `);

    res.json({
      success: true,
      schedules: result.rows,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Schedule
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      bus_id,
      route_id,
      departure_time,
      arrival_time,
    } = req.body;

    const result = await pool.query(
      `UPDATE schedules
       SET bus_id=$1,
           route_id=$2,
           departure_time=$3,
           arrival_time=$4
       WHERE id=$5
       RETURNING *`,
      [
        bus_id,
        route_id,
        departure_time,
        arrival_time,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    res.json({
      success: true,
      message: "Schedule Updated Successfully",
      schedule: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM schedules WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    res.json({
      success: true,
      message: "Schedule Deleted Successfully",
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
  addSchedule,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
};
