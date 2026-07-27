const express = require("express");

const {
  getPublicHomepageRoutes,
  getAllHomepageRoutes,
  createHomepageRoute,
  updateHomepageRoute,
  deleteHomepageRoute,
} = require("../controllers/homepageRouteShortcut.controller");

const router = express.Router();

router.get("/public", getPublicHomepageRoutes);
router.get("/", getAllHomepageRoutes);
router.post("/", createHomepageRoute);
router.put("/:id", updateHomepageRoute);
router.delete("/:id", deleteHomepageRoute);

module.exports = router;
