const express = require("express");

const router = express.Router();

const {
  createSavedTraveller,
  getSavedTravellers,
  updateSavedTraveller,
  deleteSavedTraveller,
} = require(
  "../controllers/customerSavedTraveller.controller"
);

const customerAuthMiddleware = require(
  "../middleware/customerAuth.middleware"
);

router.use(
  customerAuthMiddleware
);

router.post(
  "/",
  createSavedTraveller
);

router.get(
  "/",
  getSavedTravellers
);

router.put(
  "/:id",
  updateSavedTraveller
);

router.delete(
  "/:id",
  deleteSavedTraveller
);

module.exports = router;
