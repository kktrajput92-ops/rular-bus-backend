const Leave = require("../models/leave.model");

exports.getAllLeaves = async (req, res) => {
  try {
    const data = await Leave.getAll();

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

exports.getLeaveById = async (req, res) => {
  try {
    const data = await Leave.getById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
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

exports.createLeave = async (req, res) => {
  try {
    const data = await Leave.create(req.body);

    res.status(201).json({
      success: true,
      message: "Leave request created successfully",
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
