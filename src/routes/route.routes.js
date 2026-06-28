const express = require("express");

const router = express.Router();

const {
  addRoute,
  getAllRoutes,
  updateRoute,
  deleteRoute,
} = require("../controllers/route.controller");

router.post("/", addRoute);
router.get("/", getAllRoutes);
router.put("/:id", updateRoute);
router.delete("/:id", deleteRoute);

module.exports = router;
