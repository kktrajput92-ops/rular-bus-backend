const express = require("express");
const router = express.Router();

const {
  getRolePermissions,
  assignPermission,
} = require("../controllers/rolePermission.controller");

router.get("/", getRolePermissions);
router.post("/", assignPermission);

module.exports = router;
