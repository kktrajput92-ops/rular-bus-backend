const express = require("express");

const {
  calculateFare,
} = require("../controllers/pricingEngine.controller");

const router = express.Router();

router.post("/calculate", calculateFare);

module.exports = router;
