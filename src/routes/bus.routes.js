const express = require("express");

const router = express.Router();

const {
  addBus,
  getAllBuses,
  updateBus,
  deleteBus,
} = require("../controllers/bus.controller");

router.post("/", addBus);
router.get("/", getAllBuses);
router.put("/:id", updateBus);
router.delete("/:id", deleteBus);

module.exports = router;
