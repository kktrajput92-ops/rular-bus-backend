const express = require("express");
const router = express.Router();

const {
  getDesignations,
  getDesignationById,
  createDesignation,
} = require("../controllers/designation.controller");

router.get("/", getDesignations);
router.get("/:id", getDesignationById);
router.post("/", createDesignation);

module.exports = router;

