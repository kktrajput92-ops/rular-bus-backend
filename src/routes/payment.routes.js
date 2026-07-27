const express = require("express");

const router = express.Router();

const {
  getAllPayments,
  updatePaymentStatus,
  deletePayment,
} = require(
  "../controllers/payment.controller"
);

const {
  createPaymentOrder,
  rejectLegacyMockPayment,
  verifyPayment,
} = require(
  "../controllers/razorpayPayment.controller"
);

/*
 * Public customer payment flow.
 * Amount is always loaded from the booking in the backend.
 */
router.post(
  "/create-order",
  createPaymentOrder
);

router.post(
  "/verify",
  verifyPayment
);

/*
 * Old endpoint previously marked payments paid
 * without talking to a payment gateway.
 */
router.post(
  "/",
  rejectLegacyMockPayment
);

router.get(
  "/",
  getAllPayments
);

router.put(
  "/:id",
  updatePaymentStatus
);

router.delete(
  "/:id",
  deletePayment
);

module.exports = router;
