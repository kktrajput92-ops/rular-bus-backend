const express = require("express");
const router = express.Router();

const {
  getAllAssets,
  getAssetById,
  createAsset
} = require("../controllers/asset.controller");

router.get("/", getAllAssets);
router.get("/:id", getAssetById);
router.post("/", createAsset);

module.exports = router;

