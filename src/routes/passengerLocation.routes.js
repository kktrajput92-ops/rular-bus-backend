const express = require("express");

const {
  getPublicLocations,
  getNearestLocations,
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require("../controllers/passengerLocation.controller");

const router = express.Router();

router.get("/public/nearest", getNearestLocations);
router.get("/public", getPublicLocations);
router.get("/", getAllLocations);
router.post("/", createLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

module.exports = router;
