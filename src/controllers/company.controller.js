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
// Update Company
const updateCompany = async (req, res) => {
  try {
    const company = await Company.update(req.params.id, req.body);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const uploadCompanyBranding = async (req, res) => {
  try {
console.log("UPLOAD API HIT");
console.log(req.body);
console.log(req.files);   
 if (!req.body.company_id) {
  return res.status(400).json({
    success: false,
    message: "Company ID is required",
  });
}

const logo =
  req.files?.logo && req.files.logo.length
    ? "/uploads/company/" + req.files.logo[0].filename
    : null;

const signature =
  req.files?.signature && req.files.signature.length
    ? "/uploads/company/" + req.files.signature[0].filename
    : null;

const company = await Company.updateBranding(
  req.body.company_id,
  logo,
  signature
);

console.log("UPDATED COMPANY:");
console.log(company);
res.json({
  success: true,
  message: "Branding uploaded successfully",
  data: company,
});
  } catch (err) {
  console.error("UPLOAD ERROR:");
  console.error(err);

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
  updateCompany,
 uploadCompanyBranding,
};
