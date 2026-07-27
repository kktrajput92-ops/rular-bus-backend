const pool = require("../config/db");

const VALID_PAYMENT_METHODS = [
  "UPI",
  "DEBIT_CARD",
  "CREDIT_CARD",
  "NET_BANKING",
  "WALLET",
];

const normalizePaymentMethod = (
  value
) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const addPayment = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const bookingId = Number(
      req.body.booking_id
    );

    const paymentMethod =
      normalizePaymentMethod(
        req.body.payment_method
      );

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid booking ID is required.",
      });
    }

    if (
      !VALID_PAYMENT_METHODS.includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid payment method is required.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const bookingResult =
      await client.query(
        `
          SELECT
            id,
            fare_amount,
            currency_code,
            booking_status
          FROM bookings
          WHERE id = $1
          FOR UPDATE
        `,
        [bookingId]
      );

    if (!bookingResult.rows.length) {
      const error = new Error(
        "Booking not found."
      );

      error.status = 404;
      throw error;
    }

    const booking =
      bookingResult.rows[0];

    const amount = Number(
      booking.fare_amount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      const error = new Error(
        "Booking fare is invalid."
      );

      error.status = 400;
      throw error;
    }

    const existingPayment =
      await client.query(
        `
          SELECT *
          FROM payments
          WHERE booking_id = $1
          ORDER BY id DESC
          LIMIT 1
          FOR UPDATE
        `,
        [bookingId]
      );

    if (existingPayment.rows.length) {
      const existing =
        existingPayment.rows[0];

      if (
        String(
          existing.payment_status
        ).toLowerCase() === "paid"
      ) {
        const error = new Error(
          "Payment already completed for this booking."
        );

        error.status = 409;
        throw error;
      }

      const updated =
        await client.query(
          `
            UPDATE payments
            SET
              amount = $1,
              payment_method = $2,
              payment_status = 'paid',
              transaction_id = $3
            WHERE id = $4
            RETURNING *
          `,
          [
            amount,
            paymentMethod,
            `TXN${Date.now()}`,
            existing.id,
          ]
        );

      await client.query("COMMIT");
      transactionStarted = false;

      return res.json({
        success: true,
        message:
          "Payment completed successfully.",
        payment: updated.rows[0],
      });
    }

    const transactionId =
      `TXN${Date.now()}`;

    const result = await client.query(
      `
        INSERT INTO payments (
          booking_id,
          amount,
          payment_method,
          payment_status,
          transaction_id
        )
        VALUES (
          $1,
          $2,
          $3,
          'paid',
          $4
        )
        RETURNING *
      `,
      [
        bookingId,
        amount,
        paymentMethod,
        transactionId,
      ]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message:
        "Payment completed successfully.",
      payment: result.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Payment rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Add payment failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Payment failed.",
      });
  } finally {
    client.release();
  }
};

const getAllPayments = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `
        SELECT
          payments.id,
          payments.booking_id,
          payments.amount,
          payments.payment_method,
          payments.payment_status,
          payments.transaction_id,
          payments.created_at,

          bookings.contact_phone,
          bookings.contact_email,
          bookings.passenger_count,
          bookings.fare_amount AS booking_fare,

          routes.source,
          routes.destination

        FROM payments

        INNER JOIN bookings
          ON bookings.id =
             payments.booking_id

        INNER JOIN schedules
          ON schedules.id =
             bookings.schedule_id

        INNER JOIN routes
          ON routes.id =
             schedules.route_id

        ORDER BY payments.id DESC
      `
    );

    return res.json({
      success: true,
      payments: result.rows,
    });
  } catch (error) {
    console.error(
      "Get payments failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load payments.",
    });
  }
};

const updatePaymentStatus = async (
  req,
  res
) => {
  try {
    const paymentId = Number(
      req.params.id
    );

    const paymentStatus = String(
      req.body.payment_status || ""
    )
      .trim()
      .toLowerCase();

    if (
      !Number.isInteger(paymentId) ||
      paymentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid payment ID is required.",
      });
    }

    if (
      ![
        "pending",
        "paid",
        "failed",
        "refunded",
      ].includes(paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status.",
      });
    }

    const result = await pool.query(
      `
        UPDATE payments
        SET payment_status = $1
        WHERE id = $2
        RETURNING *
      `,
      [paymentStatus, paymentId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Payment updated successfully.",
      payment: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update payment failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update payment.",
    });
  }
};

const deletePayment = async (
  req,
  res
) => {
  try {
    const paymentId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(paymentId) ||
      paymentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid payment ID is required.",
      });
    }

    const result = await pool.query(
      `
        DELETE FROM payments
        WHERE id = $1
        RETURNING *
      `,
      [paymentId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Payment deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete payment failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete payment.",
    });
  }
};

module.exports = {
  addPayment,
  getAllPayments,
  updatePaymentStatus,
  deletePayment,
};
