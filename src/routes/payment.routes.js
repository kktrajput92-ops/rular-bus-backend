const express = require("express");

const router = express.Router();

const {
  addPayment,
  getAllPayments,
  updatePaymentStatus,
  deletePayment,
} = require("../controllers/payment.controller");

// Add Payment
router.post("/", addPayment);

// Get All Payments
router.get("/", getAllPayments);

// Update Payment Status
router.put("/:id", updatePaymentStatus);

// Delete Payment
router.delete("/:id", deletePayment);

module.exports = router;
