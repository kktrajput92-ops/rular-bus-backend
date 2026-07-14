const Role = require("../models/role.model");

// Get All Roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.getAll();

    res.json({
      success: true,
      data: roles,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Role By ID
const getRoleById = async (req, res) => {
  try {
    const role = await Role.getById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Role
const createRole = async (req, res) => {
  try {
    const role = await Role.create(req.body);

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
};
