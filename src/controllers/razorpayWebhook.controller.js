const pool = require("../config/db");

const {
  createSyntheticEventId,
  getOrderEntity,
  getPaymentEntity,
  getRefundEntity,
  parseWebhookPayload,
  verifyWebhookSignature,
} = require(
  "../services/razorpayWebhook.service"
);

const PAYMENT_SUCCESS_EVENTS =
  new Set([
    "payment.captured",
    "order.paid",
  ]);

const PAYMENT_FAILURE_EVENTS =
  new Set([
    "payment.failed",
  ]);

const REFUND_EVENTS =
  new Set([
    "refund.created",
    "refund.processed",
    "refund.failed",
    "refund.speed_changed",
  ]);

const normalizeCurrency = (
  value
) =>
  String(value || "INR")
    .trim()
    .toUpperCase();

const normalizePaymentMethod = (
  payment
) => {
  const method = String(
    payment?.method || ""
  )
    .trim()
    .toLowerCase();

  if (method === "upi") {
    return "UPI";
  }

  if (method === "netbanking") {
    return "NET_BANKING";
  }

  if (method === "wallet") {
    return "WALLET";
  }

  if (method === "card") {
    const cardType = String(
      payment?.card?.type || ""
    )
      .trim()
      .toLowerCase();

    return cardType === "debit"
      ? "DEBIT_CARD"
      : "CREDIT_CARD";
  }

  return null;
};

const toSafeErrorMessage = (
  error
) =>
  String(
    error?.message ||
    "Webhook processing failed."
  ).slice(0, 2000);

const handlePaymentSuccess = async ({
  client,
  eventType,
  payload,
  paymentEntity,
  orderEntity,
}) => {
  const gatewayOrderId = String(
    paymentEntity?.order_id ||
    orderEntity?.id ||
    ""
  ).trim();

  const gatewayPaymentId = String(
    paymentEntity?.id || ""
  ).trim();

  if (
    !gatewayOrderId.startsWith(
      "order_"
    ) ||
    !gatewayPaymentId.startsWith(
      "pay_"
    )
  ) {
    throw new Error(
      `${eventType} payload is missing valid order/payment IDs.`
    );
  }

  const localResult =
    await client.query(
      `
        SELECT
          p.*,
          COALESCE(
            NULLIF(
              TRIM(b.currency_code),
              ''
            ),
            'INR'
          ) AS booking_currency
        FROM payments p
        INNER JOIN bookings b
          ON b.id = p.booking_id
        WHERE
          p.gateway_name = 'RAZORPAY'
          AND p.gateway_order_id = $1
        LIMIT 1
        FOR UPDATE OF p
      `,
      [gatewayOrderId]
    );

  if (!localResult.rows.length) {
    throw new Error(
      `Local payment not found for ${gatewayOrderId}.`
    );
  }

  const localPayment =
    localResult.rows[0];

  const expectedAmount =
    Math.round(
      Number(localPayment.amount) *
      100
    );

  const gatewayAmount =
    Number(paymentEntity.amount);

  if (
    !Number.isSafeInteger(
      gatewayAmount
    ) ||
    gatewayAmount !==
      expectedAmount
  ) {
    throw new Error(
      "Webhook payment amount does not match the local payment."
    );
  }

  const expectedCurrency =
    normalizeCurrency(
      localPayment.booking_currency
    );

  const gatewayCurrency =
    normalizeCurrency(
      paymentEntity.currency
    );

  if (
    gatewayCurrency !==
    expectedCurrency
  ) {
    throw new Error(
      "Webhook payment currency does not match the booking currency."
    );
  }

  if (
    localPayment.gateway_payment_id &&
    localPayment.gateway_payment_id !==
      gatewayPaymentId
  ) {
    throw new Error(
      "Webhook payment ID conflicts with the stored payment ID."
    );
  }

  const method =
    normalizePaymentMethod(
      paymentEntity
    );

  const updated =
    await client.query(
      `
        UPDATE payments
        SET
          payment_status = 'paid',
          payment_method =
            COALESCE(
              $1,
              payment_method
            ),
          transaction_id = $2,
          gateway_payment_id = $2,
          gateway_status = 'captured',
          gateway_response =
            COALESCE(
              gateway_response,
              '{}'::jsonb
            ) ||
            jsonb_build_object(
              'latest_webhook',
              $3::jsonb
            ),
          verified_at =
            COALESCE(
              verified_at,
              CURRENT_TIMESTAMP
            ),
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `,
      [
        method,
        gatewayPaymentId,
        JSON.stringify({
          event:
            eventType,
          received_payload:
            payload,
        }),
        localPayment.id,
      ]
    );

  return updated.rows[0];
};

const handlePaymentFailure = async ({
  client,
  eventType,
  payload,
  paymentEntity,
}) => {
  const gatewayOrderId = String(
    paymentEntity?.order_id || ""
  ).trim();

  const gatewayPaymentId = String(
    paymentEntity?.id || ""
  ).trim();

  if (
    !gatewayOrderId.startsWith(
      "order_"
    )
  ) {
    throw new Error(
      "payment.failed payload is missing a valid order ID."
    );
  }

  const updated =
    await client.query(
      `
        UPDATE payments
        SET
          payment_status =
            CASE
              WHEN LOWER(
                COALESCE(
                  payment_status,
                  ''
                )
              ) = 'paid'
              THEN payment_status
              ELSE 'failed'
            END,
          gateway_payment_id =
            COALESCE(
              gateway_payment_id,
              NULLIF($1, '')
            ),
          gateway_status =
            CASE
              WHEN LOWER(
                COALESCE(
                  payment_status,
                  ''
                )
              ) = 'paid'
              THEN gateway_status
              ELSE 'failed'
            END,
          gateway_response =
            COALESCE(
              gateway_response,
              '{}'::jsonb
            ) ||
            jsonb_build_object(
              'latest_webhook',
              $2::jsonb
            ),
          updated_at =
            CURRENT_TIMESTAMP
        WHERE
          gateway_name = 'RAZORPAY'
          AND gateway_order_id = $3
        RETURNING *
      `,
      [
        gatewayPaymentId,
        JSON.stringify({
          event:
            eventType,
          received_payload:
            payload,
        }),
        gatewayOrderId,
      ]
    );

  return updated.rows[0] || null;
};

const receiveRazorpayWebhook = async (
  req,
  res
) => {
  const rawBody = req.body;

  const signature = String(
    req.get(
      "x-razorpay-signature"
    ) || ""
  ).trim();

  if (
    !verifyWebhookSignature({
      rawBody,
      signature,
    })
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid Razorpay webhook signature.",
    });
  }

  let payload;

  try {
    payload =
      parseWebhookPayload(
        rawBody
      );
  } catch (error) {
    return res
      .status(error.status || 400)
      .json({
        success: false,
        message: error.message,
      });
  }

  const eventType = String(
    payload?.event || ""
  ).trim();

  if (!eventType) {
    return res.status(400).json({
      success: false,
      message:
        "Webhook event type is missing.",
    });
  }

  const eventId =
    String(
      req.get(
        "x-razorpay-event-id"
      ) || ""
    ).trim() ||
    createSyntheticEventId(
      rawBody
    );

  const paymentEntity =
    getPaymentEntity(payload);

  const orderEntity =
    getOrderEntity(payload);

  const refundEntity =
    getRefundEntity(payload);

  const gatewayOrderId =
    String(
      paymentEntity?.order_id ||
      orderEntity?.id ||
      ""
    ).trim() || null;

  const gatewayPaymentId =
    String(
      paymentEntity?.id ||
      refundEntity?.payment_id ||
      ""
    ).trim() || null;

  const gatewayRefundId =
    String(
      refundEntity?.id || ""
    ).trim() || null;

  const client =
    await pool.connect();

  let transactionStarted = false;
  let ledgerId = null;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const existingResult =
      await client.query(
        `
          SELECT *
          FROM payment_webhook_events
          WHERE
            gateway_name = 'RAZORPAY'
            AND gateway_event_id = $1
          LIMIT 1
          FOR UPDATE
        `,
        [eventId]
      );

    const existing =
      existingResult.rows[0] ||
      null;

    if (
      existing &&
      existing.processing_status ===
        "PROCESSED"
    ) {
      await client.query("COMMIT");
      transactionStarted = false;

      return res.status(200).json({
        success: true,
        duplicate: true,
        message:
          "Webhook event already processed.",
      });
    }

    if (existing) {
      ledgerId = existing.id;

      await client.query(
        `
          UPDATE payment_webhook_events
          SET
            event_type = $1,
            processing_status =
              'PROCESSING',
            payload = $2::jsonb,
            signature_verified = TRUE,
            attempt_count =
              attempt_count + 1,
            gateway_order_id = $3,
            gateway_payment_id = $4,
            gateway_refund_id = $5,
            error_message = NULL,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $6
        `,
        [
          eventType,
          JSON.stringify(payload),
          gatewayOrderId,
          gatewayPaymentId,
          gatewayRefundId,
          ledgerId,
        ]
      );
    } else {
      const inserted =
        await client.query(
          `
            INSERT INTO
              payment_webhook_events (
                gateway_name,
                gateway_event_id,
                event_type,
                processing_status,
                payload,
                signature_verified,
                gateway_order_id,
                gateway_payment_id,
                gateway_refund_id
              )
            VALUES (
              'RAZORPAY',
              $1,
              $2,
              'PROCESSING',
              $3::jsonb,
              TRUE,
              $4,
              $5,
              $6
            )
            RETURNING id
          `,
          [
            eventId,
            eventType,
            JSON.stringify(payload),
            gatewayOrderId,
            gatewayPaymentId,
            gatewayRefundId,
          ]
        );

      ledgerId =
        inserted.rows[0].id;
    }

    let localPayment = null;
    let finalStatus =
      "IGNORED";

    if (
      PAYMENT_SUCCESS_EVENTS.has(
        eventType
      )
    ) {
      localPayment =
        await handlePaymentSuccess({
          client,
          eventType,
          payload,
          paymentEntity,
          orderEntity,
        });

      finalStatus =
        "PROCESSED";
    } else if (
      PAYMENT_FAILURE_EVENTS.has(
        eventType
      )
    ) {
      localPayment =
        await handlePaymentFailure({
          client,
          eventType,
          payload,
          paymentEntity,
        });

      finalStatus =
        localPayment
          ? "PROCESSED"
          : "IGNORED";
    } else if (
      REFUND_EVENTS.has(
        eventType
      )
    ) {
      /*
       * Refund events are stored and verified now.
       * Refund table state transitions will be
       * connected after gateway refund execution
       * is implemented.
       */
      finalStatus =
        "PROCESSED";
    }

    await client.query(
      `
        UPDATE payment_webhook_events
        SET
          processing_status = $1,
          payment_id = $2,
          booking_id = $3,
          processed_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $4
      `,
      [
        finalStatus,
        localPayment?.id || null,
        localPayment?.booking_id ||
          null,
        ledgerId,
      ]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      event: eventType,
      processed:
        finalStatus ===
        "PROCESSED",
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Webhook rollback failed:",
          rollbackError
        );
      }
    }

    if (ledgerId) {
      try {
        await pool.query(
          `
            UPDATE payment_webhook_events
            SET
              processing_status =
                'FAILED',
              error_message = $1,
              updated_at =
                CURRENT_TIMESTAMP
            WHERE id = $2
          `,
          [
            toSafeErrorMessage(
              error
            ),
            ledgerId,
          ]
        );
      } catch (ledgerError) {
        console.error(
          "Webhook ledger failure update failed:",
          ledgerError
        );
      }
    }

    console.error(
      "Razorpay webhook processing failed:",
      {
        event:
          eventType,
        event_id:
          eventId,
        message:
          toSafeErrorMessage(
            error
          ),
      }
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed.",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  receiveRazorpayWebhook,
};
