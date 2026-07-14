const express = require("express");
const router = express.Router();

const {
  getDepartments,
  getDepartmentById,
  createDepartment,
} = require("../controllers/department.controller");

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.post("/", createDepartment);

module.exports = router;
