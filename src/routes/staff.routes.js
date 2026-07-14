const express = require("express");
const router = express.Router();

const {
  getStaff,
  getStaffById,
  createStaff,
} = require("../controllers/staff.controller");
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

router.get("/", auth, authorize(1,2,3), getStaff);
router.get("/:id", auth, authorize(1,2,3), getStaffById);
router.post("/", auth, authorize(1,2), createStaff);


module.exports = router;

