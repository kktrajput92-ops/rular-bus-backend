const Attendance = require("../models/attendance.model");

exports.getAllAttendance = async (req, res) => {
  try {
    const data = await Attendance.getAll();

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

exports.getAttendanceById = async (req, res) => {
  try {
    const data = await Attendance.getById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found"
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

exports.createAttendance = async (req, res) => {
  try {
    const data = await Attendance.create(req.body);

    res.status(201).json({
      success: true,
      message: "Attendance created successfully",
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

