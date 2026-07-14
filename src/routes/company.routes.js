const express = require("express");
console.log("✅ Company Routes Loaded");
const router = express.Router();
const validate = require("../middleware/validate.middleware");

const {
  getCompanies,
  getCompanyById,
  createCompany,
} = require("../controllers/company.controller");

router.get("/", getCompanies);
router.get("/:id", getCompanyById);
router.post(
  "/",
  validate([
    "company_code",
    "company_name",
    "legal_name",
    "company_type",
    "email",
    "phone"
  ]),
  createCompany
);

module.exports = router;
