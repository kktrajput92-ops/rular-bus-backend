const express = require("express");

const router = express.Router();

const {
  addBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
} = require("../controllers/bus.controller");

// Add Bus
router.post("/", addBus);

// Get All Buses
router.get("/", getAllBuses);

// Get Bus By ID
router.get("/:id", getBusById);

// Update Bus
router.put("/:id", updateBus);

// Delete Bus
router.delete("/:id", deleteBus);

module.exports = router;
