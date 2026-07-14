const express = require("express");
const router = express.Router();

const {
  getAllLeaves,
  getLeaveById,
  createLeave
} = require("../controllers/leave.controller");

router.get("/", getAllLeaves);
router.get("/:id", getLeaveById);
router.post("/", createLeave);

module.exports = router;
