const pool = require("../config/db");

/* ==========================
   Dashboard Statistics
========================== */

const getDashboard = async (req, res) => {
  try {
    const buses = await pool.query("SELECT COUNT(*) FROM buses");
    const drivers = await pool.query("SELECT COUNT(*) FROM drivers");
    const routes = await pool.query("SELECT COUNT(*) FROM routes");
    const schedules = await pool.query("SELECT COUNT(*) FROM schedules");
    const passengers = await pool.query("SELECT COUNT(*) FROM passengers");
    const bookings = await pool.query("SELECT COUNT(*) FROM bookings");
    const tickets = await pool.query("SELECT COUNT(*) FROM tickets");
const staff = await pool.query("SELECT COUNT(*) FROM staff");

const users = await pool.query("SELECT COUNT(*) FROM users");

const branches = await pool.query("SELECT COUNT(*) FROM branches");

const offices = await pool.query("SELECT COUNT(*) FROM offices");

const assets = await pool.query("SELECT COUNT(*) FROM assets");

const pendingLeaves = await pool.query(`
SELECT COUNT(*)
FROM leave_requests
WHERE approval_status='PENDING'
`);

const todayAttendance = await pool.query(`
SELECT COUNT(*)
FROM attendance
WHERE attendance_date = CURRENT_DATE
`);
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
        total_revenue: Number(revenue.rows[0].total),
total_staff: Number(staff.rows[0].count),
total_users: Number(users.rows[0].count),
total_branches: Number(branches.rows[0].count),
total_offices: Number(offices.rows[0].count),
total_assets: Number(assets.rows[0].count),
pending_leaves: Number(pendingLeaves.rows[0].count),
today_attendance: Number(todayAttendance.rows[0].count),      
},
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================
   Recent Bookings
========================== */

const getRecentBookings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.id,
        COALESCE(p.full_name,'Passenger') AS passenger_name,
        r.source,
        r.destination,
        b.seat_number,
        b.booking_status

      FROM bookings b

      LEFT JOIN passengers p
        ON p.id = b.passenger_id

      LEFT JOIN schedules s
        ON s.id = b.schedule_id

      LEFT JOIN routes r
        ON r.id = s.route_id

      ORDER BY b.id DESC

      LIMIT 10
    `);

    res.json({
      success: true,
      bookings: result.rows,
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
  getDashboard,
  getRecentBookings,
};
