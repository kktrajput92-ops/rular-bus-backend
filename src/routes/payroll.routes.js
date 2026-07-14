const express = require("express");
const router = express.Router();

const {
  getAllPayroll,
  getPayrollById,
  createPayroll
} = require("../controllers/payroll.controller");

router.get("/", getAllPayroll);
router.get("/:id", getPayrollById);
router.post("/", createPayroll);

module.exports = router;

