const express = require("express");
const router = express.Router();

const {
  getStaff,
  getStaffById,
  createStaff,
} = require("../controllers/staff.controller");
const auth = require("../middleware/auth.middleware");
router.get("/", auth, getStaff);
router.get("/:id", auth, getStaffById);
router.post("/", auth, createStaff);

module.exports = router;

