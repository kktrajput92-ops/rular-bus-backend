const express = require("express");
const router = express.Router();

const {
  getRolePermissions,
  assignPermission,
  removePermission,
} = require("../controllers/rolePermission.controller");

router.get("/", getRolePermissions);
router.post("/", assignPermission);
router.delete("/:id", removePermission);
module.exports = router;
