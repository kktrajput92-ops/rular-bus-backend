const Department = require("../models/department.model");

// Get All Departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.getAll();

    res.json({
      success: true,
      data: departments,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Department By ID
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.getById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Department
const createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
};

