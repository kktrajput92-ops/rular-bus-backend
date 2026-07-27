const roundMoney = (value) =>
  Math.round(
    (Number(value || 0) +
      Number.EPSILON) *
      100
  ) / 100;

const calculateCancellationPolicy = ({
  hoursBeforeDeparture,
  bookingAmount,
  paymentAmount,
  paymentStatus,
}) => {
  const hours = Number(
    hoursBeforeDeparture
  );

  const bookingFare = roundMoney(
    bookingAmount
  );

  const paidAmount = roundMoney(
    paymentAmount
  );

  const normalizedPaymentStatus =
    String(paymentStatus || "")
      .trim()
      .toLowerCase();

  if (
    !Number.isFinite(hours)
  ) {
    return {
      eligible: false,
      policyCode:
        "INVALID_DEPARTURE_TIME",
      message:
        "Departure time is unavailable.",
      refundPercentage: 0,
      cancellationCharge:
        bookingFare,
      refundableAmount: 0,
    };
  }

  if (hours <= 0) {
    return {
      eligible: false,
      policyCode:
        "DEPARTURE_ALREADY_PASSED",
      message:
        "This journey has already departed.",
      refundPercentage: 0,
      cancellationCharge:
        bookingFare,
      refundableAmount: 0,
    };
  }

  if (hours < 6) {
    return {
      eligible: false,
      policyCode:
        "LESS_THAN_6_HOURS",
      message:
        "Cancellation is unavailable within 6 hours of departure.",
      refundPercentage: 0,
      cancellationCharge:
        bookingFare,
      refundableAmount: 0,
    };
  }

  let refundPercentage;
  let policyCode;

  if (hours >= 24) {
    refundPercentage = 90;
    policyCode =
      "REFUND_90_PERCENT";
  } else if (hours >= 12) {
    refundPercentage = 75;
    policyCode =
      "REFUND_75_PERCENT";
  } else {
    refundPercentage = 50;
    policyCode =
      "REFUND_50_PERCENT";
  }

  const refundableBase =
    normalizedPaymentStatus === "paid"
      ? Math.min(
          bookingFare,
          paidAmount
        )
      : 0;

  const refundableAmount =
    roundMoney(
      refundableBase *
        (refundPercentage / 100)
    );

  const cancellationCharge =
    roundMoney(
      bookingFare -
        refundableAmount
    );

  return {
    eligible: true,
    policyCode,
    message:
      "Booking is eligible for cancellation.",
    refundPercentage,
    cancellationCharge,
    refundableAmount,
  };
};

module.exports = {
  calculateCancellationPolicy,
  roundMoney,
};
