const express = require("express");

const router = express.Router();

const {
  getAllJourneys,
  getJourneyById,
  addJourney,
  updateJourney,
  deleteJourney
} = require("../controllers/journey.controller");

// Get All Journeys
router.get("/", getAllJourneys);

// Get Journey By ID
router.get("/:id", getJourneyById);

// Add Journey
router.post("/", addJourney);

// Update Journey
router.put("/:id", updateJourney);

// Delete Journey
router.delete("/:id", deleteJourney);

module.exports = router;
