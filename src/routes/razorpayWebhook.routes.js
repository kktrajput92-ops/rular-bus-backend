const express = require("express");

const {
  receiveRazorpayWebhook,
} = require(
  "../controllers/razorpayWebhook.controller"
);

const router = express.Router();

router.post(
  "/razorpay",
  express.raw({
    type: "application/json",
    limit: "2mb",
  }),
  receiveRazorpayWebhook
);

module.exports = router;
