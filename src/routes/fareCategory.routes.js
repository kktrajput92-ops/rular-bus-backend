const express = require("express");
const router = express.Router();

const {
  createFareCategory,
  getAllFareCategories,
  getFareCategoryById,
  updateFareCategory,
  deleteFareCategory,
} = require("../controllers/fareCategory.controller");

router.post("/", createFareCategory);
router.get("/", getAllFareCategories);
router.get("/:id", getFareCategoryById);
router.put("/:id", updateFareCategory);
router.delete("/:id", deleteFareCategory);

module.exports = router;
