const Payroll = require("../models/payroll.model");

exports.getAllPayroll = async (req, res) => {
  try {
    const data = await Payroll.getAll();

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

exports.getPayrollById = async (req, res) => {
  try {
    const data = await Payroll.getById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found"
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

exports.createPayroll = async (req, res) => {
  try {
    const data = await Payroll.create(req.body);

    res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

