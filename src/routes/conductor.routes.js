const express = require("express");
const router = express.Router();

const {
  getConductorDashboard,
  getPassengerList,
  boardPassenger,
} = require("../controllers/conductor.controller");

router.get("/dashboard", getConductorDashboard);
router.get("/passengers", getPassengerList);
router.post("/board/:ticket_number", boardPassenger);

module.exports = router;

