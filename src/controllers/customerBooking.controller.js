const pool = require("../config/db");
const generateTicket = require(
  "../utils/pdfTicket"
);

const getCustomerBookings = async (
  req,
  res
) => {
  try {
    const customerProfileId = Number(
      req.customer?.id
    );

    if (
      !Number.isInteger(customerProfileId) ||
      customerProfileId <= 0
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Valid customer account is required",
      });
    }

    const result = await pool.query(
      `
        SELECT
          tickets.id,
          tickets.booking_id,
          tickets.ticket_number,
          tickets.qr_code,
          tickets.issued_at,
          tickets.boarded,
          tickets.boarded_at,
          tickets.ticket_status,
          tickets.cancelled_at
            AS ticket_cancelled_at,
          tickets.cancellation_id
            AS ticket_cancellation_id,

          bookings.customer_profile_id,
          bookings.seat_number,
          bookings.booking_status,
          bookings.booking_mode,
          bookings.fare_amount,
          bookings.currency_code,
          bookings.contact_phone,
          bookings.contact_email,
          bookings.passenger_count,
          bookings.created_at
            AS booking_created_at,
          bookings.cancelled_at
            AS booking_cancelled_at,
          bookings.cancellation_id,

          (
            SELECT to_jsonb(latest_payment)
            FROM (
              SELECT payment_row.*
              FROM payments AS payment_row
              WHERE payment_row.booking_id =
                    bookings.id
              ORDER BY payment_row.id DESC
              LIMIT 1
            ) AS latest_payment
          ) AS payment,

          passengers.full_name,
          passengers.phone,
          passengers.email,
          passengers.gender,
          passengers.age,
          passengers.passenger_category,

          routes.source,
          routes.destination,

          schedules.departure_time,
          schedules.arrival_time,

          bookings.boarding_stop_id,
          bookings.dropping_stop_id,

          boarding_stop.stop_name
            AS boarding_stop_name,

          dropping_stop.stop_name
            AS dropping_stop_name,

          cancellation.cancellation_number,
          cancellation.cancelled_by_type,
          cancellation.reason_code,
          cancellation.reason_text,
          cancellation.booking_amount
            AS cancellation_booking_amount,
          cancellation.cancellation_charge,
          cancellation.refund_percentage,
          cancellation.refundable_amount,
          cancellation.currency_code
            AS cancellation_currency_code,
          cancellation.policy_code,
          cancellation.hours_before_departure,
          cancellation.cancellation_status,
          cancellation.cancelled_at
            AS cancellation_created_at,

          refund.refund_number,
          refund.original_payment_amount,
          refund.refund_amount,
          refund.currency_code
            AS refund_currency_code,
          refund.refund_method,
          refund.refund_status,
          refund.gateway_refund_id,
          refund.failure_reason,
          refund.requested_at,
          refund.processing_started_at,
          refund.completed_at

        FROM bookings

        INNER JOIN tickets
          ON tickets.booking_id =
             bookings.id

        LEFT JOIN passengers
          ON passengers.id =
             bookings.passenger_id

        LEFT JOIN schedules
          ON schedules.id =
             bookings.schedule_id

        LEFT JOIN routes
          ON routes.id =
             schedules.route_id

        LEFT JOIN stops AS boarding_stop
          ON boarding_stop.id =
             bookings.boarding_stop_id

        LEFT JOIN stops AS dropping_stop
          ON dropping_stop.id =
             bookings.dropping_stop_id

        LEFT JOIN booking_cancellations
          AS cancellation
          ON cancellation.id =
             bookings.cancellation_id

        LEFT JOIN refund_requests
          AS refund
          ON refund.cancellation_id =
             cancellation.id

        WHERE
          bookings.customer_profile_id = $1

        ORDER BY
          bookings.created_at DESC,
          tickets.id DESC
      `,
      [customerProfileId]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      tickets: result.rows,
    });
  } catch (error) {
    console.error(
      "Get customer bookings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load customer bookings",
    });
  }
};

const downloadCustomerTicket = async (
  req,
  res
) => {
  try {
    const ticketNumber = String(
      req.params.ticket_number || ""
    ).trim();

    const customerProfileId = Number(
      req.customer?.id
    );

    if (!ticketNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Ticket number is required",
      });
    }

    if (
      !Number.isInteger(customerProfileId) ||
      customerProfileId <= 0
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Valid customer account is required",
      });
    }

    const result = await pool.query(
      `
        SELECT
          tickets.ticket_number,
          tickets.qr_code,
          tickets.issued_at,
          tickets.ticket_status,
          tickets.cancelled_at
            AS ticket_cancelled_at,
          tickets.cancellation_id,

          bookings.id AS booking_id,
          bookings.seat_number,
          bookings.booking_status,
          bookings.fare_amount,
          bookings.currency_code,
          bookings.contact_phone,
          bookings.cancelled_at
            AS booking_cancelled_at,

          passengers.full_name,
          passengers.phone,

          routes.source,
          routes.destination,

          schedules.departure_time,
          schedules.arrival_time,

          cancellation.cancellation_number,
          cancellation.cancellation_status,

          refund.refund_number,
          refund.refund_amount,
          refund.refund_status

        FROM bookings

        INNER JOIN tickets
          ON tickets.booking_id =
             bookings.id

        LEFT JOIN passengers
          ON passengers.id =
             bookings.passenger_id

        LEFT JOIN schedules
          ON schedules.id =
             bookings.schedule_id

        LEFT JOIN routes
          ON routes.id =
             schedules.route_id

        LEFT JOIN booking_cancellations
          AS cancellation
          ON cancellation.id =
             bookings.cancellation_id

        LEFT JOIN refund_requests
          AS refund
          ON refund.cancellation_id =
             cancellation.id

        WHERE
          tickets.ticket_number = $1

          AND
          bookings.customer_profile_id = $2

        LIMIT 1
      `,
      [
        ticketNumber,
        customerProfileId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Ticket not found for this customer",
      });
    }

    const ticket = result.rows[0];

    const isCancelled =
      String(
        ticket.ticket_status || ""
      ).toUpperCase() ===
        "CANCELLED" ||
      String(
        ticket.booking_status || ""
      ).toLowerCase() ===
        "cancelled" ||
      Boolean(ticket.cancellation_id);

    if (isCancelled) {
      return res.status(409).json({
        success: false,
        message:
          "Cancelled ticket cannot be downloaded.",
        ticket_status:
          ticket.ticket_status,
        booking_status:
          ticket.booking_status,
        cancellation_number:
          ticket.cancellation_number ||
          null,
        refund_number:
          ticket.refund_number ||
          null,
        refund_amount:
          ticket.refund_amount ||
          null,
        refund_status:
          ticket.refund_status ||
          null,
      });
    }

    return generateTicket(
      res,
      ticket
    );
  } catch (error) {
    console.error(
      "Download customer ticket error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to download customer ticket",
    });
  }
};

module.exports = {
  getCustomerBookings,
  downloadCustomerTicket,
};
