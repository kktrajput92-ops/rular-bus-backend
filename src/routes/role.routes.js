const express = require("express");
const router = express.Router();

const {
  getRoles,
  getRoleById,
  createRole,
} = require("../controllers/role.controller");

router.get("/", getRoles);
router.get("/:id", getRoleById);
router.post("/", createRole);

module.exports = router;

