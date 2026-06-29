const express = require("express");

const router = express.Router();

const {
  lockSeat,
  getLockedSeats,
  unlockSeat,
  cleanupExpiredLocks
} = require("../controllers/seat_lock.controller");

// Lock Seat
router.post("/lock", lockSeat);

// Get Locked Seats
router.get("/:schedule_id", getLockedSeats);

// Unlock Seat
router.delete("/unlock/:id", unlockSeat);

// Cleanup Expired Locks
router.delete("/cleanup", cleanupExpiredLocks);

module.exports = router;
