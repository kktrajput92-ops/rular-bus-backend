const express = require("express");

const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  updateCustomerProfile,
  logoutCustomer,
} = require(
  "../controllers/customerAuth.controller"
);

const {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetCustomerPassword,
  changeCustomerPassword,
} = require(
  "../controllers/customerPassword.controller"
);

const {
  getCustomerBookings,
  downloadCustomerTicket,
} = require(
  "../controllers/customerBooking.controller"
);

const {
  getCancellationPreview,
  cancelCustomerBooking,
} = require(
  "../controllers/customerCancellation.controller"
);

const customerAuthMiddleware = require(
  "../middleware/customerAuth.middleware"
);

router.post(
  "/register",
  registerCustomer
);

router.post(
  "/login",
  loginCustomer
);

router.post(
  "/forgot-password",
  requestPasswordResetOtp
);

router.post(
  "/verify-reset-otp",
  verifyPasswordResetOtp
);

router.post(
  "/reset-password",
  resetCustomerPassword
);

router.get(
  "/me",
  customerAuthMiddleware,
  getCurrentCustomer
);

router.put(
  "/profile",
  customerAuthMiddleware,
  updateCustomerProfile
);

router.post(
  "/change-password",
  customerAuthMiddleware,
  changeCustomerPassword
);

router.post(
  "/logout",
  customerAuthMiddleware,
  logoutCustomer
);

router.get(
  "/bookings",
  customerAuthMiddleware,
  getCustomerBookings
);


router.get(
  "/bookings/:booking_id/cancellation-preview",
  customerAuthMiddleware,
  getCancellationPreview
);

router.post(
  "/bookings/:booking_id/cancel",
  customerAuthMiddleware,
  cancelCustomerBooking
);

router.get(
  "/tickets/:ticket_number/pdf",
  customerAuthMiddleware,
  downloadCustomerTicket
);

module.exports = router;
