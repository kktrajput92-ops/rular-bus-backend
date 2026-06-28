const express = require("express");

const router = express.Router();

const {
  addDriver,
  getAllDrivers,
  updateDriver,
  deleteDriver,
} = require("../controllers/driver.controller");

router.post("/", addDriver);
router.get("/", getAllDrivers);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);

module.exports = router;
