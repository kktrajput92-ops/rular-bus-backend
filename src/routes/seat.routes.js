const express = require("express");

const router = express.Router();

const {
  getSeatStatus,
} = require("../controllers/seat.controller");

// Seat Status
router.get("/:schedule_id", getSeatStatus);

module.exports = router;
