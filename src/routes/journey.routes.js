const express = require("express");

const router = express.Router();

const {
  getAllJourneys,
  getJourneyById,
} = require("../controllers/journey.controller");

router.get("/", getAllJourneys);
router.get("/:id", getJourneyById);

module.exports = router;
