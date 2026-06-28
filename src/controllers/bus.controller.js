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

module.exports = {
  addBus,
  getAllBuses,
};
