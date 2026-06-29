const pool = require("../config/db");

// Get Available & Booked Seats
const getSeatStatus = async (req, res) => {
  try {
    const { schedule_id } = req.params;

    // Get Total Seats
    const busResult = await pool.query(`
      SELECT buses.total_seats
      FROM schedules
      JOIN buses ON schedules.bus_id = buses.id
      WHERE schedules.id = $1
    `, [schedule_id]);

    if (busResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    const totalSeats = busResult.rows[0].total_seats;

    // Get Booked Seats
    const booked = await pool.query(`
      SELECT seat_number
      FROM bookings
      WHERE schedule_id = $1
      AND booking_status = 'confirmed'
      ORDER BY seat_number
    `, [schedule_id]);

    const bookedSeats = booked.rows.map(r => r.seat_number);

    const availableSeats = [];

    for (let i = 1; i <= totalSeats; i++) {
      if (!bookedSeats.includes(i)) {
        availableSeats.push(i);
      }
    }

    res.json({
      success: true,
      total_seats: totalSeats,
      booked_seats: bookedSeats,
      available_seats: availableSeats,
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
  getSeatStatus,
};
