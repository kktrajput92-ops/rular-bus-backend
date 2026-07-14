const Region = require("../models/region.model");

// Get All Regions
const getRegions = async (req, res) => {
  try {
    const regions = await Region.getAll();

    res.json({
      success: true,
      data: regions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Region By ID
const getRegionById = async (req, res) => {
  try {
    const region = await Region.getById(req.params.id);

    if (!region) {
      return res.status(404).json({
        success: false,
        message: "Region not found",
      });
    }

    res.json({
      success: true,
      data: region,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Region
const createRegion = async (req, res) => {
  try {
    const region = await Region.create(req.body);

    res.status(201).json({
      success: true,
      message: "Region created successfully",
      data: region,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getRegions,
  getRegionById,
  createRegion,
};
