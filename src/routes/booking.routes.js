const express = require("express");

const router = express.Router();

const {
  addBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
} = require("../controllers/booking.controller");

// Create Booking
router.post("/", addBooking);

// Get All Bookings
router.get("/", getAllBookings);

// Get Booking By ID
router.get("/:id", getBookingById);

// Update Booking
router.put("/:id", updateBooking);

// Cancel Booking
router.put("/cancel/:id", cancelBooking);

module.exports = router;
