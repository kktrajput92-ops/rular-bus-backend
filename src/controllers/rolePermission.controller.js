const RolePermission = require("../models/rolePermission.model");

// Get All Role Permissions
const getRolePermissions = async (req, res) => {
  try {
    const data = await RolePermission.getAll();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Assign Permission to Role
const assignPermission = async (req, res) => {
  try {
    const { role_id, permission_id } = req.body;

    const result = await RolePermission.create(
      role_id,
      permission_id
    );

    res.status(201).json({
      success: true,
      message: "Permission assigned successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getRolePermissions,
  assignPermission,
};
