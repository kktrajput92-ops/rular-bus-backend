const pool = require("../config/db");

const getDashboard = async (req, res) => {
  try {

    const buses = await pool.query("SELECT COUNT(*) FROM buses");
    const drivers = await pool.query("SELECT COUNT(*) FROM drivers");
    const routes = await pool.query("SELECT COUNT(*) FROM routes");
    const schedules = await pool.query("SELECT COUNT(*) FROM schedules");
    const passengers = await pool.query("SELECT COUNT(*) FROM passengers");
    const bookings = await pool.query("SELECT COUNT(*) FROM bookings");
    const tickets = await pool.query("SELECT COUNT(*) FROM tickets");

    const revenue = await pool.query(`
      SELECT COALESCE(SUM(amount),0) AS total
      FROM payments
      WHERE payment_status='paid'
    `);

    res.json({
      success: true,

      dashboard: {

        total_buses: Number(buses.rows[0].count),

        total_drivers: Number(drivers.rows[0].count),

        total_routes: Number(routes.rows[0].count),

        total_schedules: Number(schedules.rows[0].count),

        total_passengers: Number(passengers.rows[0].count),

        total_bookings: Number(bookings.rows[0].count),

        total_tickets: Number(tickets.rows[0].count),

        total_revenue: revenue.rows[0].total

      }

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

module.exports = {
  getDashboard,
};
