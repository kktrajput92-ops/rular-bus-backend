const pool = require("../config/db");

// Add Driver
const addDriver = async (req, res) => {
  try {
    const { full_name, phone, license_number, address } = req.body;

    const result = await pool.query(
      `INSERT INTO drivers
      (full_name, phone, license_number, address)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [full_name, phone, license_number, address]
    );

    res.json({
      success: true,
      message: "Driver Added Successfully",
      driver: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Drivers
const getAllDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM drivers ORDER BY id DESC"
    );

    res.json({
      success: true,
      drivers: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Driver
const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, license_number, address } = req.body;

    const result = await pool.query(
      `UPDATE drivers
       SET full_name=$1,
           phone=$2,
           license_number=$3,
           address=$4
       WHERE id=$5
       RETURNING *`,
      [full_name, phone, license_number, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.json({
      success: true,
      message: "Driver Updated Successfully",
      driver: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Driver
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM drivers WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.json({
      success: true,
      message: "Driver Deleted Successfully",
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
  addDriver,
  getAllDrivers,
  updateDriver,
  deleteDriver,
};
