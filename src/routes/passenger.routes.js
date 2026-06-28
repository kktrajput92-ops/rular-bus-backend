const express = require("express");

const router = express.Router();

const {
  addPassenger,
  getAllPassengers,
  updatePassenger,
  deletePassenger,
} = require("../controllers/passenger.controller");

router.post("/", addPassenger);
router.get("/", getAllPassengers);
router.put("/:id", updatePassenger);
router.delete("/:id", deletePassenger);

module.exports = router;
