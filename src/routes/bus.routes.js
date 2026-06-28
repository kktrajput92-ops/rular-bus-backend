const express = require("express");

const router = express.Router();

const { addBus, getAllBuses } = require("../controllers/bus.controller");

router.post("/", addBus);
router.get("/", getAllBuses);

module.exports = router;
