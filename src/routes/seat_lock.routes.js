const express = require("express");

const router = express.Router();

const {
  lockSeat,
  getLockedSeats,
  unlockSeat
} = require("../controllers/seat_lock.controller");

// Lock Seat
router.post("/lock", lockSeat);

// Get Locked Seats
router.get("/:schedule_id", getLockedSeats);

// Unlock Seat
router.delete("/unlock/:id", unlockSeat);

module.exports = router;
