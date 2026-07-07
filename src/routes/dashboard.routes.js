const express = require("express");

const router = express.Router();

const {
  getDashboard,
  getRecentBookings,
} = require("../controllers/dashboard.controller");

router.get("/", getDashboard);

router.get("/recent-bookings", getRecentBookings);

module.exports = router;
