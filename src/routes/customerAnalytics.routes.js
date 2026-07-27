const express = require("express");

const {
  logLocationConsent,
  linkSearchToBooking,
  getCustomerIntelligenceOverview,
  getPlatformAnalytics,
  getLocationAnalytics,
  getRouteAnalytics,
  getNoBusDemandAnalytics,
  getLocationConsentAnalytics,
} = require(
  "../controllers/customerAnalytics.controller"
);

const router = express.Router();

router.post(
  "/location-consent",
  logLocationConsent
);

router.post(
  "/convert-search",
  linkSearchToBooking
);

router.get(
  "/overview",
  getCustomerIntelligenceOverview
);

router.get(
  "/platforms",
  getPlatformAnalytics
);

router.get(
  "/locations",
  getLocationAnalytics
);

router.get(
  "/routes",
  getRouteAnalytics
);

router.get(
  "/no-bus-demand",
  getNoBusDemandAnalytics
);

router.get(
  "/location-consent-summary",
  getLocationConsentAnalytics
);

module.exports = router;
