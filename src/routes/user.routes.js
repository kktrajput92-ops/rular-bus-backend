const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const hasPermission = require("../middleware/role.middleware");
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
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
router.delete(
  "/:id",
  auth,
  hasPermission("user.delete"),
  deleteUser
);


module.exports = router;


