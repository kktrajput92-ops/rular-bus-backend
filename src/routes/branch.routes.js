const express = require("express");
const router = express.Router();

const {
  getBranches,
  getBranchById,
  createBranch,
} = require("../controllers/branch.controller");

router.get("/", getBranches);
router.get("/:id", getBranchById);
router.post("/", createBranch);

module.exports = router;
