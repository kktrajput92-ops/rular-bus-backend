const express = require("express");

const router = express.Router();

const {
  getCatalogSummary,

  getManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,

  getModels,
  createModel,
  updateModel,
  deleteModel,

  getBodyVariants,
  createBodyVariant,
  updateBodyVariant,
  deleteBodyVariant,

  getLayoutTemplates,
} = require("../controllers/busCatalog.controller");

router.get("/summary", getCatalogSummary);

router.get("/manufacturers", getManufacturers);
router.post("/manufacturers", createManufacturer);
router.put("/manufacturers/:id", updateManufacturer);
router.delete("/manufacturers/:id", deleteManufacturer);

router.get("/models", getModels);
router.post("/models", createModel);
router.put("/models/:id", updateModel);
router.delete("/models/:id", deleteModel);

router.get("/body-variants", getBodyVariants);
router.post("/body-variants", createBodyVariant);
router.put("/body-variants/:id", updateBodyVariant);
router.delete("/body-variants/:id", deleteBodyVariant);

router.get("/layout-templates", getLayoutTemplates);

module.exports = router;
