const Shift = require("../models/shift.model");

exports.getAllShifts = async (req, res) => {
  try {
    const data = await Shift.getAll();

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getShiftById = async (req, res) => {
  try {
    const data = await Shift.getById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Shift not found"
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.createShift = async (req, res) => {
  try {
    const data = await Shift.create(req.body);

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
