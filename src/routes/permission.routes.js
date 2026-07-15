const express = require("express");
const router = express.Router();

const {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
} = require("../controllers/permission.controller");

router.get("/", getPermissions);
router.get("/:id", getPermissionById);
router.post("/", createPermission);
router.put("/:id", updatePermission);

module.exports = router;
