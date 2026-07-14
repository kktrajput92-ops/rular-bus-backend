const EmployeeDocument = require("../models/employeeDocument.model");

exports.getAllDocuments = async (req, res) => {
  try {
    const data = await EmployeeDocument.getAll();

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

exports.getDocumentById = async (req, res) => {
  try {
    const data = await EmployeeDocument.getById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
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

exports.createDocument = async (req, res) => {
  try {
    const data = await EmployeeDocument.create(req.body);

    res.status(201).json({
      success: true,
      message: "Employee document created successfully",
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

