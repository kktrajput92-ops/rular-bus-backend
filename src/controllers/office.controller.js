const Office = require("../models/office.model");

// Get All Offices
const getOffices = async (req, res) => {
  try {
    const offices = await Office.getAll(req.query.branch_id);

    res.json({
      success: true,
      data: offices,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Office By ID
const getOfficeById = async (req, res) => {
  try {
    const office = await Office.getById(req.params.id);

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    res.json({
      success: true,
      data: office,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Office
const createOffice = async (req, res) => {
  try {
    const office = await Office.create(req.body);

    res.status(201).json({
      success: true,
      message: "Office created successfully",
      data: office,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getOffices,
  getOfficeById,
  createOffice,
};
