const express = require("express");

const router = express.Router();

const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponCode.controller");

router.post("/", createCoupon);

router.get("/", getAllCoupons);

router.get("/:id", getCouponById);

router.put("/:id", updateCoupon);

router.delete("/:id", deleteCoupon);

module.exports = router;
