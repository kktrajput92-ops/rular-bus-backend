const pool = require("../config/db");

// Dashboard
const getConductorDashboard = async (req, res) => {
  try {
    const total = await pool.query(
      "SELECT COUNT(*) FROM tickets"
    );

    const boarded = await pool.query(
      "SELECT COUNT(*) FROM tickets WHERE boarded = TRUE"
    );

    const remaining = await pool.query(
      "SELECT COUNT(*) FROM tickets WHERE boarded = FALSE"
    );

    res.json({
      success: true,
      totalPassengers: Number(total.rows[0].count),
      boarded: Number(boarded.rows[0].count),
      remaining: Number(remaining.rows[0].count),
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Passenger List
const getPassengerList = async (req, res) => {
  try {

const result = await pool.query(`
SELECT
    t.ticket_number,
    b.seat_number,
    p.full_name,
    t.boarded
FROM tickets t
JOIN bookings b
ON t.booking_id = b.id
JOIN passengers p
ON b.passenger_id = p.id
ORDER BY b.seat_number ASC
`);

res.json({
  success: true,
  passengers: result.rows,
});  

res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Boarding
const boardPassenger = async (req, res) => {
  try {

    const { ticket_number } = req.params;

    const result = await pool.query(
      `UPDATE tickets
       SET boarded = TRUE
       WHERE ticket_number = $1
       RETURNING *`,
      [ticket_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      message: "Passenger Boarded Successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getConductorDashboard,
  getPassengerList,
  boardPassenger,
};
