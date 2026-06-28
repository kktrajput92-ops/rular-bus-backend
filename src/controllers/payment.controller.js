const pool = require("../config/db");

// Add Payment
const addPayment = async (req, res) => {
  try {
    const {
      booking_id,
      amount,
      payment_method,
    } = req.body;

    // Check booking exists
    const booking = await pool.query(
      "SELECT * FROM bookings WHERE id=$1",
      [booking_id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check payment already exists
    const payment = await pool.query(
      "SELECT * FROM payments WHERE booking_id=$1",
      [booking_id]
    );

    if (payment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists",
      });
    }

    const transaction_id =
      "TXN" + Date.now();

    const result = await pool.query(
      `INSERT INTO payments
      (booking_id, amount, payment_method, transaction_id)
      VALUES ($1,$2,$3,$4)
      RETURNING *`,
      [
        booking_id,
        amount,
        payment_method,
        transaction_id,
      ]
    );

    res.json({
      success: true,
      message: "Payment Added Successfully",
      payment: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Payments
const getAllPayments = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
      payments.id,
      passengers.full_name,
      routes.source,
      routes.destination,
      payments.amount,
      payments.payment_method,
      payments.payment_status,
      payments.transaction_id

      FROM payments

      JOIN bookings
      ON payments.booking_id=bookings.id

      JOIN passengers
      ON bookings.passenger_id=passengers.id

      JOIN schedules
      ON bookings.schedule_id=schedules.id

      JOIN routes
      ON schedules.route_id=routes.id

      ORDER BY payments.id DESC
    `);

    res.json({
      success: true,
      payments: result.rows,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Payment Status
const updatePaymentStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { payment_status } = req.body;

    const result = await pool.query(
      `UPDATE payments
       SET payment_status=$1
       WHERE id=$2
       RETURNING *`,
      [payment_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      message: "Payment Updated Successfully",
      payment: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Payment
const deletePayment = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM payments WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      message: "Payment Deleted Successfully",
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
  addPayment,
  getAllPayments,
  updatePaymentStatus,
  deletePayment,
};
