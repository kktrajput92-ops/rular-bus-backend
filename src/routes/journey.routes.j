const express = require("express");

const router = express.Router();

const {
  getAllJourneys
} = require("../controllers/journey.controller");

router.get("/", getAllJourneys);

module.exports = router;
