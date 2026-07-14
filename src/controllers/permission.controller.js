const Permission = require("../models/permission.model");

// Get All Permissions
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.getAll();

    res.json({
      success: true,
      data: permissions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Permission By ID
const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.getById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    res.json({
      success: true,
      data: permission,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Permission
const createPermission = async (req, res) => {
  try {
    const permission = await Permission.create(req.body);

    res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: permission,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
};
