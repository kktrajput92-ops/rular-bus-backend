const express = require("express");
const router = express.Router();

const {
  getStaff,
  getStaffById,
  createStaff,
} = require("../controllers/staff.controller");

router.get("/", getStaff);
router.get("/:id", getStaffById);
router.post("/", createStaff);

module.exports = router;

