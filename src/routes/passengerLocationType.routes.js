const express = require("express");

const {
  getPublicLocationTypes,
  getAllLocationTypes,
  createLocationType,
  updateLocationType,
  deleteLocationType,
} = require("../controllers/passengerLocationType.controller");

const router = express.Router();

router.get("/public", getPublicLocationTypes);
router.get("/", getAllLocationTypes);
router.post("/", createLocationType);
router.put("/:id", updateLocationType);
router.delete("/:id", deleteLocationType);

module.exports = router;
