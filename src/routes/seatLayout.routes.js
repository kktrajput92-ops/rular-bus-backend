const express = require("express");

const router = express.Router();

const {
  getLayout,
  saveLayout,
} = require("../controllers/seatLayout.controller");

// Get Bus Seat Layout
// Save Bus Seat Layout
router.post("/:busId", saveLayout);

router.get("/:busId", getLayout);

module.exports = router;
