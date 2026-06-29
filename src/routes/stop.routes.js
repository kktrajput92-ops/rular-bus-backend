const express = require("express");

const router = express.Router();

const {
  addStop,
  getAllStops,
  getStopsByRoute,
  updateStop,
  deleteStop,
} = require("../controllers/stop.controller");

// Add Stop
router.post("/", addStop);

// Get All Stops
router.get("/", getAllStops);

// Get Stops By Route
router.get("/:route_id", getStopsByRoute);

// Update Stop
router.put("/:id", updateStop);

// Delete Stop
router.delete("/:id", deleteStop);

module.exports = router;
