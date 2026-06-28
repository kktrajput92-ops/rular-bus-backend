const express = require("express");

const router = express.Router();

const {
  addBooking,
  getAllBookings,
  updateBooking,
  cancelBooking,
} = require("../controllers/booking.controller");

router.post("/", addBooking);
router.get("/", getAllBookings);
router.put("/:id", updateBooking);
router.put("/cancel/:id", cancelBooking);

module.exports = router;
