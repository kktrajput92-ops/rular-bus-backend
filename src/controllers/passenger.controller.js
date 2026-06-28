const pool = require("../config/db");

// Add Passenger
const addPassenger = async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      gender,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO passengers
      (full_name, phone, email, gender)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [full_name, phone, email, gender]
    );

    res.json({
      success: true,
      message: "Passenger Added Successfully",
      passenger: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Passengers
const getAllPassengers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM passengers ORDER BY id DESC"
    );

    res.json({
      success: true,
      passengers: result.rows,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Passenger
const updatePassenger = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      full_name,
      phone,
      email,
      gender,
    } = req.body;

    const result = await pool.query(
      `UPDATE passengers
       SET full_name=$1,
           phone=$2,
           email=$3,
           gender=$4
       WHERE id=$5
       RETURNING *`,
      [
        full_name,
        phone,
        email,
        gender,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Passenger not found",
      });
    }

    res.json({
      success: true,
      message: "Passenger Updated Successfully",
      passenger: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Passenger
const deletePassenger = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM passengers WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Passenger not found",
      });
    }

    res.json({
      success: true,
      message: "Passenger Deleted Successfully",
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
  addPassenger,
  getAllPassengers,
  updatePassenger,
  deletePassenger,
};
