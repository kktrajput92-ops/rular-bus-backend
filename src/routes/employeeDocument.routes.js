const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadDocument");
const {
  getAllDocuments,
  getDocumentById,
  createDocument
} = require("../controllers/employeeDocument.controller");

router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);
router.post(
  "/",
  upload.single("document"),
  (req, res, next) => {
    if (req.file) {
      req.body.file_path = req.file.path;
      req.body.document_name = req.file.originalname;
    }
    next();
  },
  createDocument
);

module.exports = router;

