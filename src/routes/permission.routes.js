const express = require("express");
const router = express.Router();

const {
  getPermissions,
  getPermissionById,
  createPermission,
} = require("../controllers/permission.controller");

router.get("/", getPermissions);
router.get("/:id", getPermissionById);
router.post("/", createPermission);

module.exports = router;
