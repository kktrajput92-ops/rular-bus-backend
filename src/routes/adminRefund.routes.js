const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/auth.middleware");

const hasPermission =
  require("../middleware/role.middleware");

const {
  getRefundSummary,
  getRefundRequests,
  getRefundRequestById,
  assignRefundRequest,
  addRefundComment,
} = require(
  "../controllers/adminRefund.controller"
);

const {
  requestRefundProcessing,
  rejectRefundTransaction,
  approveRefundTransaction,
  completeRefundTransaction,
  retryRefundTransaction,
  failRefundTransaction,
} = require(
  "../controllers/adminRefundProcessing.controller"
);

const {
  getRefundPolicySettings,
  updateRefundPolicySettings,
} = require(
  "../controllers/refundPolicySettings.controller"
);

router.use(authMiddleware);


router.get(
  "/settings",
  hasPermission("refund.view"),
  getRefundPolicySettings
);

router.put(
  "/settings",
  hasPermission(
    "refund.configure_auto"
  ),
  updateRefundPolicySettings
);

router.get(
  "/summary",
  hasPermission("refund.view"),
  getRefundSummary
);

router.get(
  "/",
  hasPermission("refund.view"),
  getRefundRequests
);

router.get(
  "/:id",
  hasPermission("refund.view"),
  getRefundRequestById
);

router.post(
  "/:id/assign",
  hasPermission("refund.assign"),
  assignRefundRequest
);

router.post(
  "/:id/comments",
  hasPermission("refund.comment"),
  addRefundComment
);

router.post(
  "/:id/process",
  hasPermission("refund.process"),
  requestRefundProcessing
);


router.post(
  "/:id/transactions/:transactionId/reject",
  hasPermission("refund.reject"),
  rejectRefundTransaction
);

router.post(
  "/:id/transactions/:transactionId/approve",
  hasPermission("refund.approve"),
  approveRefundTransaction
);

router.post(
  "/:id/transactions/:transactionId/complete",
  hasPermission("refund.process"),
  completeRefundTransaction
);


router.post(
  "/:id/transactions/:transactionId/retry",
  hasPermission("refund.retry"),
  retryRefundTransaction
);

router.post(
  "/:id/transactions/:transactionId/fail",
  hasPermission("refund.process"),
  failRefundTransaction
);


module.exports = router;
