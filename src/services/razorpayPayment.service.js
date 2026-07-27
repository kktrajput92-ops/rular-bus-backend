const crypto = require("crypto");
const Razorpay = require("razorpay");

const getRequiredEnvironmentValue = (name) => {
  const value = String(
    process.env[name] || ""
  ).trim();

  if (!value) {
    const error = new Error(
      `${name} is not configured.`
    );

    error.status = 503;
    throw error;
  }

  return value;
};

const getRazorpayClient = () =>
  new Razorpay({
    key_id:
      getRequiredEnvironmentValue(
        "RAZORPAY_KEY_ID"
      ),

    key_secret:
      getRequiredEnvironmentValue(
        "RAZORPAY_KEY_SECRET"
      ),
  });

const getPublicKeyId = () =>
  getRequiredEnvironmentValue(
    "RAZORPAY_KEY_ID"
  );

const convertRupeesToSubunits = (amount) => {
  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    const error = new Error(
      "Payment amount is invalid."
    );

    error.status = 400;
    throw error;
  }

  const subunits = Math.round(
    numericAmount * 100
  );

  if (
    !Number.isSafeInteger(subunits) ||
    subunits <= 0
  ) {
    const error = new Error(
      "Payment amount cannot be converted safely."
    );

    error.status = 400;
    throw error;
  }

  return subunits;
};

const createOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}) => {
  const razorpay =
    getRazorpayClient();

  return razorpay.orders.create({
    amount:
      convertRupeesToSubunits(
        amount
      ),

    currency:
      String(currency || "INR")
        .trim()
        .toUpperCase(),

    receipt,
    notes,
  });
};

const verifyCheckoutSignature = ({
  orderId,
  paymentId,
  signature,
}) => {
  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        getRequiredEnvironmentValue(
          "RAZORPAY_KEY_SECRET"
        )
      )
      .update(
        `${orderId}|${paymentId}`
      )
      .digest("hex");

  const suppliedBuffer =
    Buffer.from(
      String(signature || ""),
      "utf8"
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  return (
    suppliedBuffer.length ===
      expectedBuffer.length &&
    crypto.timingSafeEqual(
      suppliedBuffer,
      expectedBuffer
    )
  );
};

const fetchPayment = async (
  paymentId
) => {
  const razorpay =
    getRazorpayClient();

  return razorpay.payments.fetch(
    paymentId
  );
};

const capturePayment = async ({
  paymentId,
  amountSubunits,
  currency,
}) => {
  const razorpay =
    getRazorpayClient();

  return razorpay.payments.capture(
    paymentId,
    amountSubunits,
    currency
  );
};

module.exports = {
  capturePayment,
  convertRupeesToSubunits,
  createOrder,
  fetchPayment,
  getPublicKeyId,
  verifyCheckoutSignature,
};
