const pool = require("../config/db");

const addBus = async (req, res) => {
  try {
    const { bus_name, bus_number, bus_type, total_seats } = req.body;

    const result = await pool.query(
      `INSERT INTO buses (bus_name, bus_number, bus_type, total_seats)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bus_name, bus_number, bus_type, total_seats]
    );

    res.json({
      success: true,
      message: "Bus Added Successfully",
      bus: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllBuses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM buses ORDER BY id DESC"
    );

    res.json({
      success: true,
      buses: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { bus_name, bus_number, bus_type, total_seats } = req.body;

    const result = await pool.query(
      `UPDATE buses
       SET bus_name=$1,
           bus_number=$2,
           bus_type=$3,
           total_seats=$4
       WHERE id=$5
       RETURNING *`,
      [bus_name, bus_number, bus_type, total_seats, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.json({
      success: true,
      message: "Bus Updated Successfully",
      bus: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM buses WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.json({
      success: true,
      message: "Bus Deleted Successfully",
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
  addBus,
  getAllBuses,
  updateBus,
  deleteBus,
};
