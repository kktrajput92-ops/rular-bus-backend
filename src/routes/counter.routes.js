const express = require("express");
const router = express.Router();

const {
  getCounters,
  getCounterById,
  createCounter,
} = require("../controllers/counter.controller");

router.get("/", getCounters);
router.get("/:id", getCounterById);
router.post("/", createCounter);

module.exports = router;
