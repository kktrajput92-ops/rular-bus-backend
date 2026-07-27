const crypto = require("crypto");
const pool = require("../config/db");

const {
  calculateCancellationPolicy,
  roundMoney,
} = require(
  "../services/customerCancellationPolicy.service"
);

const ALLOWED_REASON_CODES =
  new Set([
    "CHANGE_OF_PLAN",
    "BOOKED_BY_MISTAKE",
    "DUPLICATE_BOOKING",
    "MEDICAL_REASON",
    "TRAVEL_DATE_CHANGED",
    "OTHER",
  ]);

const createReference = (
  prefix
) => {
  const timestamp = Date.now()
    .toString()
    .slice(-10);

  const randomPart =
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

  return `${prefix}${timestamp}${randomPart}`;
};

const getRequestIp = (req) =>
  String(
    req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      req.ip ||
      ""
  )
    .split(",")[0]
    .trim()
    .slice(0, 100);

const parseBookingId = (value) => {
  const bookingId = Number(value);

  if (
    !Number.isInteger(bookingId) ||
    bookingId <= 0
  ) {
    return null;
  }

  return bookingId;
};

const loadCancellationBooking = async (
  queryable,
  {
    bookingId,
    customerProfileId,
    lock = false,
  }
) => {
  const lockClause =
    lock
      ? "FOR UPDATE OF booking"
      : "";

  const result =
    await queryable.query(
      `
        SELECT
          booking.id AS booking_id,
          booking.customer_profile_id,
          booking.booking_status,
          booking.fare_amount,
          booking.currency_code,
          booking.passenger_count,
          booking.schedule_id,
          booking.cancelled_at,
          booking.cancellation_id,

          schedule.departure_time,

          EXTRACT(
            EPOCH FROM (
              schedule.departure_time -
              CURRENT_TIMESTAMP
            )
          ) / 3600.0
            AS hours_before_departure,

          payment.id AS payment_id,
          payment.amount
            AS payment_amount,
          payment.payment_method,
          payment.payment_status,
          payment.transaction_id,
          payment.refund_status,
          payment.refunded_amount,

          ticket.id AS ticket_id,
          ticket.ticket_number,
          ticket.boarded,
          ticket.ticket_status,

          cancellation.cancellation_number,
          cancellation.cancellation_status,

          refund.refund_number,
          refund.refund_status
            AS request_refund_status,
          refund.refund_amount,
          refund.requested_at,
          refund.completed_at

        FROM bookings booking

        INNER JOIN schedules schedule
          ON schedule.id =
             booking.schedule_id

        LEFT JOIN payments payment
          ON payment.booking_id =
             booking.id

        LEFT JOIN tickets ticket
          ON ticket.booking_id =
             booking.id

        LEFT JOIN booking_cancellations
          cancellation
          ON cancellation.id =
             booking.cancellation_id

        LEFT JOIN refund_requests refund
          ON refund.cancellation_id =
             cancellation.id

        WHERE booking.id = $1
          AND
          booking.customer_profile_id =
            $2

        LIMIT 1

        ${lockClause}
      `,
      [
        bookingId,
        customerProfileId,
      ]
    );

  return result.rows[0] || null;
};

const buildPreview = (
  booking
) => {
  const bookingAmount =
    roundMoney(
      booking.fare_amount
    );

  const paymentAmount =
    roundMoney(
      booking.payment_amount
    );

  const hoursBeforeDeparture =
    Number(
      booking.hours_before_departure
    );

  if (
    String(
      booking.booking_status || ""
    ).toLowerCase() === "cancelled"
  ) {
    return {
      eligible: false,
      policy_code:
        "ALREADY_CANCELLED",
      message:
        "This booking is already cancelled.",
      hours_before_departure:
        hoursBeforeDeparture,
      booking_amount:
        bookingAmount,
      cancellation_charge: 0,
      refund_percentage: 0,
      refundable_amount:
        roundMoney(
          booking.refund_amount
        ),
    };
  }

  if (booking.boarded === true) {
    return {
      eligible: false,
      policy_code:
        "PASSENGER_ALREADY_BOARDED",
      message:
        "A boarded ticket cannot be cancelled.",
      hours_before_departure:
        hoursBeforeDeparture,
      booking_amount:
        bookingAmount,
      cancellation_charge:
        bookingAmount,
      refund_percentage: 0,
      refundable_amount: 0,
    };
  }

  if (
    booking.ticket_status ===
      "CANCELLED" ||
    booking.cancellation_id
  ) {
    return {
      eligible: false,
      policy_code:
        "CANCELLATION_ALREADY_EXISTS",
      message:
        "A cancellation already exists for this booking.",
      hours_before_departure:
        hoursBeforeDeparture,
      booking_amount:
        bookingAmount,
      cancellation_charge: 0,
      refund_percentage: 0,
      refundable_amount:
        roundMoney(
          booking.refund_amount
        ),
    };
  }

  const policy =
    calculateCancellationPolicy({
      hoursBeforeDeparture,
      bookingAmount,
      paymentAmount,
      paymentStatus:
        booking.payment_status,
    });

  return {
    eligible: policy.eligible,
    policy_code:
      policy.policyCode,
    message: policy.message,
    hours_before_departure:
      roundMoney(
        hoursBeforeDeparture
      ),
    booking_amount:
      bookingAmount,
    payment_amount:
      paymentAmount,
    payment_status:
      booking.payment_status ||
      null,
    refund_percentage:
      policy.refundPercentage,
    cancellation_charge:
      policy.cancellationCharge,
    refundable_amount:
      policy.refundableAmount,
    currency_code:
      booking.currency_code ||
      "INR",
    departure_time:
      booking.departure_time,
  };
};

const getCancellationPreview =
  async (req, res) => {
    try {
      const bookingId =
        parseBookingId(
          req.params.booking_id
        );

      if (!bookingId) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Valid booking ID is required.",
          });
      }

      const customerProfileId =
        Number(req.customer.id);

      const booking =
        await loadCancellationBooking(
          pool,
          {
            bookingId,
            customerProfileId,
          }
        );

      if (!booking) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Booking not found for this customer.",
          });
      }

      return res.json({
        success: true,
        booking: {
          id: booking.booking_id,
          booking_status:
            booking.booking_status,
          ticket_number:
            booking.ticket_number,
          departure_time:
            booking.departure_time,
        },
        cancellation:
          buildPreview(booking),
      });
    } catch (error) {
      console.error(
        "Cancellation preview error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to calculate cancellation details.",
        });
    }
  };

const cancelCustomerBooking =
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const bookingId =
        parseBookingId(
          req.params.booking_id
        );

      if (!bookingId) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Valid booking ID is required.",
          });
      }

      const customerProfileId =
        Number(req.customer.id);

      const reasonCode =
        String(
          req.body.reason_code || ""
        )
          .trim()
          .toUpperCase();

      const reasonText =
        String(
          req.body.reason_text || ""
        )
          .trim()
          .slice(0, 1000);

      if (
        !ALLOWED_REASON_CODES.has(
          reasonCode
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Valid cancellation reason is required.",
            allowed_reason_codes:
              Array.from(
                ALLOWED_REASON_CODES
              ),
          });
      }

      if (
        reasonCode === "OTHER" &&
        reasonText.length < 5
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Please provide a cancellation reason.",
          });
      }

      await client.query("BEGIN");

      const booking =
        await loadCancellationBooking(
          client,
          {
            bookingId,
            customerProfileId,
            lock: true,
          }
        );

      if (!booking) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(404)
          .json({
            success: false,
            message:
              "Booking not found for this customer.",
          });
      }

      const preview =
        buildPreview(booking);

      if (!preview.eligible) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(409)
          .json({
            success: false,
            message:
              preview.message,
            cancellation:
              preview,
          });
      }

      const duplicateResult =
        await client.query(
          `
            SELECT
              id,
              cancellation_number,
              cancellation_status
            FROM booking_cancellations
            WHERE booking_id = $1
              AND cancellation_status
                IN (
                  'REQUESTED',
                  'CONFIRMED'
                )
            LIMIT 1
            FOR UPDATE
          `,
          [bookingId]
        );

      if (
        duplicateResult.rows.length
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(409)
          .json({
            success: false,
            message:
              "This booking has already been cancelled.",
            cancellation:
              duplicateResult.rows[0],
          });
      }

      const cancellationNumber =
        createReference("CAN");

      const cancellationResult =
        await client.query(
          `
            INSERT INTO
              booking_cancellations
            (
              booking_id,
              customer_profile_id,
              cancellation_number,
              cancelled_by_type,
              cancelled_by_id,
              reason_code,
              reason_text,
              booking_amount,
              cancellation_charge,
              refund_percentage,
              refundable_amount,
              currency_code,
              policy_code,
              departure_time,
              hours_before_departure,
              cancellation_status,
              request_ip,
              user_agent
            )
            VALUES (
              $1, $2, $3,
              'CUSTOMER',
              ($2::integer)::bigint,
              $4, $5, $6,
              $7, $8, $9,
              $10, $11, $12,
              $13, 'CONFIRMED',
              $14, $15
            )
            RETURNING *
          `,
          [
            bookingId,
            customerProfileId,
            cancellationNumber,
            reasonCode,
            reasonText || null,
            preview.booking_amount,
            preview.cancellation_charge,
            preview.refund_percentage,
            preview.refundable_amount,
            preview.currency_code,
            preview.policy_code,
            booking.departure_time,
            preview.hours_before_departure,
            getRequestIp(req),
            String(
              req.headers[
                "user-agent"
              ] || ""
            ).slice(0, 2000),
          ]
        );

      const cancellation =
        cancellationResult.rows[0];

      await client.query(
        `
          UPDATE bookings
          SET
            booking_status =
              'cancelled',
            cancelled_at =
              CURRENT_TIMESTAMP,
            cancellation_id = $1
          WHERE id = $2
        `,
        [
          cancellation.id,
          bookingId,
        ]
      );

      if (booking.ticket_id) {
        await client.query(
          `
            UPDATE tickets
            SET
              ticket_status =
                'CANCELLED',
              cancelled_at =
                CURRENT_TIMESTAMP,
              cancellation_id = $1
            WHERE booking_id = $2
          `,
          [
            cancellation.id,
            bookingId,
          ]
        );
      }

      await client.query(
        `
          DELETE FROM seat_locks
          WHERE booking_id = $1
        `,
        [bookingId]
      );

      const hasPaidPayment =
        booking.payment_id &&
        String(
          booking.payment_status || ""
        ).toLowerCase() === "paid";

      const needsRefund =
        hasPaidPayment &&
        preview.refundable_amount > 0;

      const refundStatus =
        needsRefund
          ? "PENDING"
          : "NOT_REQUIRED";

      const refundNumber =
        createReference("REF");

      const refundResult =
        await client.query(
          `
            INSERT INTO refund_requests
            (
              refund_number,
              booking_id,
              cancellation_id,
              customer_profile_id,
              payment_id,
              original_payment_amount,
              refund_amount,
              currency_code,
              refund_method,
              refund_status
            )
            VALUES (
              $1, $2, $3,
              $4, $5, $6,
              $7, $8, $9, $10
            )
            RETURNING *
          `,
          [
            refundNumber,
            bookingId,
            cancellation.id,
            customerProfileId,
            booking.payment_id ||
              null,
            roundMoney(
              booking.payment_amount
            ),
            preview.refundable_amount,
            preview.currency_code,
            booking.payment_method ||
              null,
            refundStatus,
          ]
        );

      if (booking.payment_id) {
        await client.query(
          `
            UPDATE payments
            SET
              refund_status = $1,
              refunded_amount = 0,
              refunded_at = NULL
            WHERE id = $2
          `,
          [
            refundStatus,
            booking.payment_id,
          ]
        );
      }

      await client.query(
        `
          INSERT INTO audit_logs
          (
            module_name,
            action,
            record_id,
            ip_address,
            user_agent
          )
          VALUES (
            'CUSTOMER_BOOKING',
            'CUSTOMER_CANCELLED_BOOKING',
            $1,
            $2,
            $3
          )
        `,
        [
          bookingId,
          getRequestIp(req),
          String(
            req.headers[
              "user-agent"
            ] || ""
          ).slice(0, 2000),
        ]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message:
          needsRefund
            ? "Booking cancelled successfully. Refund request has been created."
            : "Booking cancelled successfully.",
        cancellation,
        refund:
          refundResult.rows[0],
      });
    } catch (error) {
      await client
        .query("ROLLBACK")
        .catch(() => {});

      if (
        error.code === "23505"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "A cancellation or refund request already exists for this booking.",
          });
      }

      console.error(
        "Customer booking cancellation error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to cancel booking.",
        });
    } finally {
      client.release();
    }
  };

module.exports = {
  getCancellationPreview,
  cancelCustomerBooking,
};
