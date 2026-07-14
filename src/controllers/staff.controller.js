const Staff = require("../models/staff.model");

// Get All Staff
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.getAll();

    res.json({
      success: true,
      data: staff,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Staff By ID
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.getById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Staff
const createStaff = async (req, res) => {
  try {
    const staff = await Staff.create(req.body);

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
};

