const Asset = require("../models/asset.model");

exports.getAllAssets = async (req, res) => {
  try {
    const data = await Asset.getAll();

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getAssetById = async (req, res) => {
  try {
    const data = await Asset.getById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Asset not found"
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const data = await Asset.create(req.body);

    res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

