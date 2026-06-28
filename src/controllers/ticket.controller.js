const pool = require("../config/db");

// Create Ticket
const createTicket = async (req, res) => {
  try {
    const { booking_id } = req.body;

    const booking = await pool.query(
      "SELECT * FROM tickets WHERE booking_id=$1",
      [booking_id]
    );

    if (booking.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ticket already generated",
      });
    }

    const count = await pool.query(
      "SELECT COUNT(*) FROM tickets"
    );

    const ticket_number =
      "RB2026" +
      String(Number(count.rows[0].count) + 1).padStart(5, "0");

    const result = await pool.query(
      `INSERT INTO tickets
      (booking_id, ticket_number)
      VALUES ($1,$2)
      RETURNING *`,
      [booking_id, ticket_number]
    );

    res.json({
      success: true,
      message: "Ticket Generated Successfully",
      ticket: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Tickets
const getAllTickets = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        tickets.id,
        tickets.ticket_number,
        passengers.full_name,
        passengers.phone,
        routes.source,
        routes.destination,
        bookings.seat_number,
        schedules.departure_time

      FROM tickets

      JOIN bookings
        ON tickets.booking_id = bookings.id

      JOIN passengers
        ON bookings.passenger_id = passengers.id

      JOIN schedules
        ON bookings.schedule_id = schedules.id

      JOIN routes
        ON schedules.route_id = routes.id

      ORDER BY tickets.id DESC
    `);

    res.json({
      success: true,
      tickets: result.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Ticket
const deleteTicket = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM tickets WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      message: "Ticket Deleted Successfully",
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
  createTicket,
  getAllTickets,
  deleteTicket,
};
