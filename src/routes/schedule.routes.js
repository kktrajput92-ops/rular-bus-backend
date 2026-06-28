const express = require("express");

const router = express.Router();

const {
  addSchedule,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/schedule.controller");

router.post("/", addSchedule);
router.get("/", getAllSchedules);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

module.exports = router;
