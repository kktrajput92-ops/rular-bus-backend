const express = require("express");
const router = express.Router();

const {
  getUsers,
  createUser,
  login,
  updateUser,
} = require("../controllers/user.controller");

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.post("/login", login);

module.exports = router;

