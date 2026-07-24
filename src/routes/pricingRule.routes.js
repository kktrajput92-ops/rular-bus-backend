const express = require("express");
const router = express.Router();

const {
  createPricingRule,
  getAllPricingRules,
  getPricingRuleById,
  updatePricingRule,
deletePricingRule,
} = require("../controllers/pricingRule.controller");


router.post("/", createPricingRule);
router.get("/", getAllPricingRules);
router.get("/:id", getPricingRuleById);
router.put("/:id", updatePricingRule);
router.delete("/:id", deletePricingRule);
module.exports = router;

