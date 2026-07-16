const Designation = require("../models/designation.model");

// Get All Designations
const getDesignations = async (req, res) => {
  try {
    const designations = await Designation.getAll(req.query.department_id);

    res.json({
      success: true,
      data: designations,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Designation By ID
const getDesignationById = async (req, res) => {
  try {
    const designation = await Designation.getById(req.params.id);

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    res.json({
      success: true,
      data: designation,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Designation
const createDesignation = async (req, res) => {
  try {
    const designation = await Designation.create(req.body);

    res.status(201).json({
      success: true,
      message: "Designation created successfully",
      data: designation,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Update Designation
const updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.update(req.params.id, req.body);

    res.json({
      success: true,
      message: "Designation updated successfully",
      data: designation,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
module.exports = {
  getDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
};
