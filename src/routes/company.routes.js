const express = require("express");
console.log("✅ Company Routes Loaded");
const router = express.Router();

const {
  getCompanies,
  getCompanyById,
  createCompany,
} = require("../controllers/company.controller");

router.get("/", getCompanies);
router.get("/:id", getCompanyById);
router.post("/", createCompany);

module.exports = router;
