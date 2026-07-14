const express = require("express");
const router = express.Router();

const {
  getAllAttendance,
  getAttendanceById,
  createAttendance
} = require("../controllers/attendance.controller");

router.get("/", getAllAttendance);
router.get("/:id", getAttendanceById);
router.post("/", createAttendance);

module.exports = router;
