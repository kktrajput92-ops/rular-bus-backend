import api from "./api";

export const getRefundSummary = () =>
  api.get("/admin-refunds/summary");

export const getRefundRequests = (params = {}) =>
  api.get("/admin-refunds", {
    params,
  });

export const getRefundRequestById = (refundId) =>
  api.get(`/admin-refunds/${refundId}`);

export const assignRefundRequest = (
  refundId,
  payload
) =>
  api.post(
    `/admin-refunds/${refundId}/assign`,
    payload
  );

export const addRefundComment = (
  refundId,
  payload
) =>
  api.post(
    `/admin-refunds/${refundId}/comments`,
    payload
  );

export const processRefundRequest = (
  refundId,
  payload,
  idempotencyKey
) =>
  api.post(
    `/admin-refunds/${refundId}/process`,
    payload,
    {
      headers: idempotencyKey
        ? {
            "Idempotency-Key":
              idempotencyKey,
          }
        : {},
    }
  );

export const approveRefundTransaction = (
  refundId,
  transactionId,
  payload
) =>
  api.post(
    `/admin-refunds/${refundId}/transactions/${transactionId}/approve`,
    payload
  );

export const rejectRefundTransaction = (
  refundId,
  transactionId,
  payload
) =>
  api.post(
    `/admin-refunds/${refundId}/transactions/${transactionId}/reject`,
    payload
  );

export const completeRefundTransaction = (
  refundId,
  transactionId,
  payload
) =>
  api.post(
    `/admin-refunds/${refundId}/transactions/${transactionId}/complete`,
    payload
  );

export const failRefundTransaction = (
  refundId,
  transactionId,
  payload
) =>
  api.post(
    `/admin-refunds/${refundId}/transactions/${transactionId}/fail`,
    payload
  );

export const retryRefundTransaction = (
  refundId,
  transactionId,
  payload,
  idempotencyKey
) =>
  api.post(
    `/admin-refunds/${refundId}/transactions/${transactionId}/retry`,
    payload,
    {
      headers: idempotencyKey
        ? {
            "Idempotency-Key":
              idempotencyKey,
          }
        : {},
    }
  );

const adminRefundApi = {
  getSummary: getRefundSummary,
  getRefunds: getRefundRequests,
  getRefundById: getRefundRequestById,
  assign: assignRefundRequest,
  comment: addRefundComment,
  process: processRefundRequest,
  approve: approveRefundTransaction,
  reject: rejectRefundTransaction,
  complete: completeRefundTransaction,
  fail: failRefundTransaction,
  retry: retryRefundTransaction,
};

export default adminRefundApi;
