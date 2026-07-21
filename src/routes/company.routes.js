const express = require("express");
console.log("✅ Company Routes Loaded");
const router = express.Router();
const validate = require("../middleware/validate.middleware");
const upload = require("../middleware/uploadCompanyBranding");
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
uploadCompanyBranding,
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
router.post(
  "/upload",
  (req, res, next) => {
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "signature", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error("MULTER ERROR:", err);
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  uploadCompanyBranding
);
router.put("/:id", updateCompany);
module.exports = router;
