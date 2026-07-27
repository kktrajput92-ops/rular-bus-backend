const crypto = require("crypto");

const getWebhookSecret = () => {
  const secret = String(
    process.env.RAZORPAY_WEBHOOK_SECRET || ""
  ).trim();

  if (!secret) {
    const error = new Error(
      "RAZORPAY_WEBHOOK_SECRET is not configured."
    );

    error.status = 503;
    throw error;
  }

  return secret;
};

const verifyWebhookSignature = ({
  rawBody,
  signature,
}) => {
  if (!Buffer.isBuffer(rawBody)) {
    return false;
  }

  const suppliedSignature = String(
    signature || ""
  ).trim();

  if (!suppliedSignature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      getWebhookSecret()
    )
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  const suppliedBuffer = Buffer.from(
    suppliedSignature,
    "utf8"
  );

  return (
    expectedBuffer.length ===
      suppliedBuffer.length &&
    crypto.timingSafeEqual(
      expectedBuffer,
      suppliedBuffer
    )
  );
};

const createSyntheticEventId = (
  rawBody
) =>
  `synthetic_${crypto
    .createHash("sha256")
    .update(rawBody)
    .digest("hex")}`;

const parseWebhookPayload = (
  rawBody
) => {
  if (!Buffer.isBuffer(rawBody)) {
    const error = new Error(
      "Webhook raw body is unavailable."
    );

    error.status = 400;
    throw error;
  }

  try {
    return JSON.parse(
      rawBody.toString("utf8")
    );
  } catch {
    const error = new Error(
      "Webhook payload is not valid JSON."
    );

    error.status = 400;
    throw error;
  }
};

const getPaymentEntity = (
  payload
) =>
  payload?.payload?.payment?.entity ||
  null;

const getOrderEntity = (
  payload
) =>
  payload?.payload?.order?.entity ||
  null;

const getRefundEntity = (
  payload
) =>
  payload?.payload?.refund?.entity ||
  null;

module.exports = {
  createSyntheticEventId,
  getOrderEntity,
  getPaymentEntity,
  getRefundEntity,
  parseWebhookPayload,
  verifyWebhookSignature,
};
