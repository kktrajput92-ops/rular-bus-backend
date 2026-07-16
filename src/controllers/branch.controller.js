const Branch = require("../models/branch.model");

// Get All Branches
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.getAll(req.query.region_id);
    res.json({
      success: true,
      data: branches,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Branch By ID
const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.getById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.json({
      success: true,
      data: branch,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Branch
const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getBranches,
  getBranchById,
  createBranch,
};
