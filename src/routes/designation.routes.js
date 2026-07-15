const express = require("express");
const router = express.Router();

const {
  getDesignations,
  getDesignationById,
  createDesignation,
updateDesignation,
} = require("../controllers/designation.controller");

router.get("/", getDesignations);
router.get("/:id", getDesignationById);
router.post("/", createDesignation);
router.put("/:id", updateDesignation);
module.exports = router;

