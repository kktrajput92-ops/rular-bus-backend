const Staff = require("../models/staff.model");
const Audit = require("../models/audit.model");
// Get All Staff
const getStaff = async (req, res) => {
  try {

    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
    } = req.query;

    const staff = await Staff.getAll({
      page,
      limit,
      search,
      status,
    });

    res.json({
      success: true,
      data: staff,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Staff By ID
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.getById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Staff
const createStaff = async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
console.log("REQ USER =", req.user);

await Audit.create({
  company_id: req.user.company_id,
  user_id: req.user.id,
  module_name: "Staff",
  action: "CREATE",
  record_id: staff.id,
  ip_address: req.ip,
  user_agent: req.headers["user-agent"],
});
    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Update Staff
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.update(req.params.id, req.body);

    res.json({
      success: true,
      message: "Staff updated successfully",
      data: staff,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Upload Staff Photo
const uploadStaffPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo is required",
      });
    }

    const photo = "/uploads/staff/" + req.file.filename;

    const staff = await Staff.updatePhoto(
  req.params.id,
  photo
);

    res.json({
      success: true,
      message: "Staff photo uploaded successfully",
      data: staff,
    });

    } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteStaff = async (req, res) => {
  try {
    await Staff.delete(req.params.id);

    res.json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  uploadStaffPhoto,
};
