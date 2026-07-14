const Company = require("../models/company.model");

// Get All Companies
const getCompanies = async (req, res) => {
 
  try {
    const companies = await Company.getAll();

    res.json({
      success: true,
      data: companies,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Company By ID
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.getById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Company
const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
};
