const express = require("express");
const router = express.Router();

const {
  getAllShifts,
  getShiftById,
  createShift
} = require("../controllers/shift.controller");

router.get("/", getAllShifts);
router.get("/:id", getShiftById);
router.post("/", createShift);

module.exports = router;

