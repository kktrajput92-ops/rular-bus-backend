const express = require("express");

const {
  addStop,
  getAllStops,
  getStopsByRoute,
  getPublicStopsByRoute,
  updateStop,
  deleteStop,
} = require("../controllers/stop.controller");

const router = express.Router();

router.get("/public/route/:route_id", getPublicStopsByRoute);
router.get("/route/:route_id", getStopsByRoute);

router.post("/", addStop);
router.get("/", getAllStops);

/*
 * Backward-compatible route.
 * Keep this after named routes to prevent path conflicts.
 */
router.get("/:route_id", getStopsByRoute);

router.put("/:id", updateStop);
router.delete("/:id", deleteStop);

module.exports = router;
