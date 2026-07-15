const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const hasPermission = require("../middleware/role.middleware");
const {
  getUsers,
  createUser,
  login,
  updateUser,
} = require("../controllers/user.controller");

router.get(
  "/",
  auth,
  hasPermission("user.view"),
  getUsers
);

router.post(
  "/",
  auth,
  hasPermission("user.create"),
  createUser
);

router.put(
  "/:id",
  auth,
  hasPermission("user.update"),
  updateUser
);
router.post("/login", login);
module.exports = router;

