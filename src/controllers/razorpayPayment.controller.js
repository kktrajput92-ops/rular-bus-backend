const pool = require("../config/db");

const {
  capturePayment,
  convertRupeesToSubunits,
  createOrder,
  fetchPayment,
  getPublicKeyId,
  verifyCheckoutSignature,
} = require(
  "../services/razorpayPayment.service"
);

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

const normalizeCurrency = (
  value
) =>
  String(value || "INR")
    .trim()
    .toUpperCase();

const normalizeRazorpayMethod = (
  payment,
  selectedMethod
) => {
  const gatewayMethod = String(
    payment?.method || ""
  )
    .trim()
    .toLowerCase();

  if (gatewayMethod === "upi") {
    return "UPI";
  }

  if (gatewayMethod === "netbanking") {
    return "NET_BANKING";
  }

  if (gatewayMethod === "wallet") {
    return "WALLET";
  }

  if (gatewayMethod === "card") {
    const cardType = String(
      payment?.card?.type || ""
    )
      .trim()
      .toLowerCase();

    return cardType === "debit"
      ? "DEBIT_CARD"
      : "CREDIT_CARD";
  }

  return selectedMethod;
};

const serializeGatewayError = (
  error
) => ({
  message:
    error?.error?.description ||
    error?.description ||
    error?.message ||
    "Razorpay request failed.",

  code:
    error?.error?.code ||
    error?.code ||
    null,

  field:
    error?.error?.field ||
    error?.field ||
    null,

  source:
    error?.error?.source ||
    error?.source ||
    null,

  step:
    error?.error?.step ||
    error?.step ||
    null,

  reason:
    error?.error?.reason ||
    error?.reason ||
    null,
});

const createPaymentOrder = async (
  req,
  res
) => {
  const client =
    await pool.connect();

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
            COALESCE(
              NULLIF(
                TRIM(currency_code),
                ''
              ),
              'INR'
            ) AS currency_code,
            booking_status,
            contact_phone,
            contact_email
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

    const currency =
      normalizeCurrency(
        booking.currency_code
      );

    const existingResult =
      await client.query(
        `
          SELECT *
          FROM payments
          WHERE booking_id = $1
          LIMIT 1
          FOR UPDATE
        `,
        [bookingId]
      );

    const existingPayment =
      existingResult.rows[0] ||
      null;

    if (
      existingPayment &&
      String(
        existingPayment.payment_status
      ).toLowerCase() === "paid"
    ) {
      const error = new Error(
        "Payment already completed for this booking."
      );

      error.status = 409;
      throw error;
    }

    /*
     * Do not reuse a Razorpay order whose payment
     * could already have been attempted. Generate a
     * fresh order and update the one-booking payment row.
     */
    const receipt =
      `rb_${bookingId}_${Date.now()}`;

    const gatewayOrder =
      await createOrder({
        amount,
        currency,
        receipt,
        notes: {
          booking_id:
            String(bookingId),

          selected_method:
            paymentMethod,

          application:
            "Rular Bus",
        },
      });

    let paymentRow;

    if (existingPayment) {
      const updated =
        await client.query(
          `
            UPDATE payments
            SET
              amount = $1,
              payment_method = $2,
              payment_status = 'pending',
              transaction_id = NULL,
              gateway_name = 'RAZORPAY',
              gateway_order_id = $3,
              gateway_payment_id = NULL,
              gateway_signature = NULL,
              gateway_status = $4,
              gateway_response = $5::jsonb,
              verified_at = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
          `,
          [
            amount,
            paymentMethod,
            gatewayOrder.id,
            gatewayOrder.status,
            JSON.stringify({
              order:
                gatewayOrder,
            }),
            existingPayment.id,
          ]
        );

      paymentRow =
        updated.rows[0];
    } else {
      const inserted =
        await client.query(
          `
            INSERT INTO payments (
              booking_id,
              amount,
              payment_method,
              payment_status,
              transaction_id,
              gateway_name,
              gateway_order_id,
              gateway_status,
              gateway_response,
              updated_at
            )
            VALUES (
              $1,
              $2,
              $3,
              'pending',
              NULL,
              'RAZORPAY',
              $4,
              $5,
              $6::jsonb,
              CURRENT_TIMESTAMP
            )
            RETURNING *
          `,
          [
            bookingId,
            amount,
            paymentMethod,
            gatewayOrder.id,
            gatewayOrder.status,
            JSON.stringify({
              order:
                gatewayOrder,
            }),
          ]
        );

      paymentRow =
        inserted.rows[0];
    }

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message:
        "Razorpay order created successfully.",

      key_id:
        getPublicKeyId(),

      order: {
        id:
          gatewayOrder.id,

        amount:
          gatewayOrder.amount,

        currency:
          gatewayOrder.currency,

        receipt:
          gatewayOrder.receipt,
      },

      payment: paymentRow,

      customer: {
        contact:
          booking.contact_phone ||
          "",

        email:
          booking.contact_email ||
          "",
      },
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Create Razorpay order rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Create Razorpay order failed:",
      serializeGatewayError(
        error
      )
    );

    return res
      .status(error.status || 502)
      .json({
        success: false,
        message:
          error?.error?.description ||
          error.message ||
          "Unable to create Razorpay order.",
      });
  } finally {
    client.release();
  }
};

const verifyPayment = async (
  req,
  res
) => {
  const client =
    await pool.connect();

  let transactionStarted = false;

  try {
    const bookingId = Number(
      req.body.booking_id
    );

    const orderId = String(
      req.body.razorpay_order_id ||
      ""
    ).trim();

    const paymentId = String(
      req.body.razorpay_payment_id ||
      ""
    ).trim();

    const signature = String(
      req.body.razorpay_signature ||
      ""
    ).trim();

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
      !orderId.startsWith(
        "order_"
      ) ||
      !paymentId.startsWith(
        "pay_"
      ) ||
      !signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete Razorpay payment verification data is required.",
      });
    }

    const signatureValid =
      verifyCheckoutSignature({
        orderId,
        paymentId,
        signature,
      });

    if (!signatureValid) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment signature verification failed.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const localResult =
      await client.query(
        `
          SELECT
            p.*,
            b.currency_code
          FROM payments p
          INNER JOIN bookings b
            ON b.id = p.booking_id
          WHERE
            p.booking_id = $1
            AND p.gateway_name = 'RAZORPAY'
            AND p.gateway_order_id = $2
          LIMIT 1
          FOR UPDATE OF p
        `,
        [
          bookingId,
          orderId,
        ]
      );

    if (!localResult.rows.length) {
      const error = new Error(
        "Matching local Razorpay order was not found."
      );

      error.status = 404;
      throw error;
    }

    const localPayment =
      localResult.rows[0];

    if (
      String(
        localPayment.payment_status
      ).toLowerCase() === "paid"
    ) {
      if (
        localPayment.gateway_payment_id ===
        paymentId
      ) {
        await client.query(
          "COMMIT"
        );

        transactionStarted = false;

        return res.json({
          success: true,
          message:
            "Payment was already verified.",

          payment:
            localPayment,
        });
      }

      const error = new Error(
        "A different payment is already recorded for this booking."
      );

      error.status = 409;
      throw error;
    }

    const expectedAmount =
      convertRupeesToSubunits(
        localPayment.amount
      );

    const expectedCurrency =
      normalizeCurrency(
        localPayment.currency_code
      );

    let gatewayPayment =
      await fetchPayment(
        paymentId
      );

    if (
      gatewayPayment.order_id !==
      orderId
    ) {
      const error = new Error(
        "Razorpay payment does not belong to this order."
      );

      error.status = 400;
      throw error;
    }

    if (
      Number(gatewayPayment.amount) !==
      expectedAmount
    ) {
      const error = new Error(
        "Razorpay payment amount does not match the booking amount."
      );

      error.status = 400;
      throw error;
    }

    if (
      normalizeCurrency(
        gatewayPayment.currency
      ) !== expectedCurrency
    ) {
      const error = new Error(
        "Razorpay payment currency does not match the booking currency."
      );

      error.status = 400;
      throw error;
    }

    if (
      gatewayPayment.status ===
      "authorized"
    ) {
      gatewayPayment =
        await capturePayment({
          paymentId,
          amountSubunits:
            expectedAmount,
          currency:
            expectedCurrency,
        });
    }

    if (
      gatewayPayment.status !==
        "captured" ||
      gatewayPayment.captured !==
        true
    ) {
      const error = new Error(
        `Razorpay payment is not captured. Current status: ${
          gatewayPayment.status ||
          "unknown"
        }.`
      );

      error.status = 409;
      throw error;
    }

    const selectedMethod =
      normalizePaymentMethod(
        localPayment.payment_method
      );

    const finalPaymentMethod =
      normalizeRazorpayMethod(
        gatewayPayment,
        selectedMethod
      );

    const updated =
      await client.query(
        `
          UPDATE payments
          SET
            payment_method = $1,
            payment_status = 'paid',
            transaction_id = $2,
            gateway_payment_id = $2,
            gateway_signature = $3,
            gateway_status = $4,
            gateway_response =
              COALESCE(
                gateway_response,
                '{}'::jsonb
              ) ||
              $5::jsonb,
            verified_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $6
          RETURNING *
        `,
        [
          finalPaymentMethod,
          paymentId,
          signature,
          gatewayPayment.status,
          JSON.stringify({
            payment:
              gatewayPayment,
          }),
          localPayment.id,
        ]
      );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message:
        "Razorpay payment verified successfully.",

      payment:
        updated.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Verify payment rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Verify Razorpay payment failed:",
      serializeGatewayError(
        error
      )
    );

    return res
      .status(error.status || 502)
      .json({
        success: false,
        message:
          error?.error?.description ||
          error.message ||
          "Unable to verify Razorpay payment.",
      });
  } finally {
    client.release();
  }
};

const rejectLegacyMockPayment = (
  req,
  res
) =>
  res.status(410).json({
    success: false,
    message:
      "Legacy mock payment endpoint is disabled. Use /api/payments/create-order and /api/payments/verify.",
  });

module.exports = {
  createPaymentOrder,
  rejectLegacyMockPayment,
  verifyPayment,
};
