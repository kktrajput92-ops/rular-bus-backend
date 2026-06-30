const pool = require("../config/db");

// =====================================
// Add Bus
// =====================================

const addBus = async (req, res) => {

  try {

    const {
      bus_name,
      bus_number,
      bus_type,
      total_seats,
    } = req.body;

    if (
      !bus_name ||
      !bus_number ||
      !bus_type ||
      !total_seats
    ) {

      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });

    }

    const check = await pool.query(
      "SELECT id FROM buses WHERE bus_number=$1",
      [bus_number]
    );

    if (check.rows.length > 0) {

      return res.status(400).json({
        success: false,
        message: "Bus Number Already Exists",
      });

    }

    const result = await pool.query(
      `
      INSERT INTO buses
      (
        bus_name,
        bus_number,
        bus_type,
        total_seats
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING *
      `,
      [
        bus_name,
        bus_number,
        bus_type,
        total_seats,
      ]
    );

    return res.json({
      success: true,
      message: "Bus Added Successfully",
      bus: result.rows[0],
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// =====================================
// Get All Buses
// =====================================

const getAllBuses = async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT * FROM buses ORDER BY id DESC"
    );

    return res.json({
      success: true,
      total: result.rows.length,
      buses: result.rows,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// =====================================
// Get Bus By ID
// =====================================

const getBusById = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM buses WHERE id=$1",
      [id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });

    }

    return res.json({
      success: true,
      bus: result.rows[0],
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// =====================================
// Update Bus
// =====================================

const updateBus = async (req, res) => {

  try {

    const { id } = req.params;

    const {
      bus_name,
      bus_number,
      bus_type,
      total_seats,
    } = req.body;
    // Duplicate bus number check (ignore current bus)
    const check = await pool.query(
      `
      SELECT id
      FROM buses
      WHERE bus_number = $1
      AND id <> $2
      `,
      [bus_number, id]
    );

    if (check.rows.length > 0) {

      return res.status(400).json({
        success: false,
        message: "Bus Number Already Exists",
      });

    }

    const result = await pool.query(

      `
      UPDATE buses
      SET
        bus_name = $1,
        bus_number = $2,
        bus_type = $3,
        total_seats = $4
      WHERE id = $5
      RETURNING *
      `,

      [
        bus_name,
        bus_number,
        bus_type,
        total_seats,
        id,
      ]

    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });

    }

    return res.json({
      success: true,
      message: "Bus Updated Successfully",
      bus: result.rows[0],
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// =====================================
// Delete Bus
// =====================================

const deleteBus = async (req, res) => {

  try {

    const { id } = req.params;

    // Prevent deleting bus if schedules exist
    const schedule = await pool.query(
      "SELECT id FROM schedules WHERE bus_id = $1 LIMIT 1",
      [id]
    );

    if (schedule.rows.length > 0) {

      return res.status(400).json({
        success: false,
        message: "Cannot delete bus. Schedule already exists.",
      });

    }
    const result = await pool.query(
      "DELETE FROM buses WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });

    }

    return res.json({
      success: true,
      message: "Bus Deleted Successfully",
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// =====================================
// Exports
// =====================================

module.exports = {
  addBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
};

