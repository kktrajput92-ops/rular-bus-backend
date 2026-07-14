const express = require("express");
const router = express.Router();

const {
  getOffices,
  getOfficeById,
  createOffice,
} = require("../controllers/office.controller");

router.get("/", getOffices);
router.get("/:id", getOfficeById);
router.post("/", createOffice);

module.exports = router;
