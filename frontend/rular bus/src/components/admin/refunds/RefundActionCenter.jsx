import {
  useMemo,
  useState,
} from "react";

import {
  addRefundComment,
  approveRefundTransaction,
  assignRefundRequest,
  completeRefundTransaction,
  failRefundTransaction,
  processRefundRequest,
  rejectRefundTransaction,
  retryRefundTransaction,
} from "../../../api/adminRefundApi";

import {
  usePermission,
} from "../../../context/PermissionContext";

const TERMINAL_STATUSES = new Set([
  "SUCCESS",
  "REJECTED",
  "RESOLVED",
]);

const PROCESSABLE_STATUSES = new Set([
  "PENDING",
  "ASSIGNED",
  "FAILED",
  "PARTIALLY_REFUNDED",
]);

const PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

function createIdempotencyKey(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function toAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? Math.round(
        (amount + Number.EPSILON) * 100
      ) / 100
    : 0;
}

function formatMoney(
  value,
  currencyCode = "INR"
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "INR",
    maximumFractionDigits: 2,
  }).format(toAmount(value));
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Refund action failed."
  );
}

function findTransaction(
  transactions,
  allowedStatuses
) {
  return [...transactions]
    .sort(
      (left, right) =>
        Number(right.id) -
        Number(left.id)
    )
    .find((transaction) =>
      allowedStatuses.includes(
        String(
          transaction.transaction_status || ""
        ).toUpperCase()
      )
    );
}

export default function RefundActionCenter({
  refund,
  transactions = [],
  onCompleted,
}) {
  const { hasPermission } =
    usePermission();

  const refundId = refund?.id;

  const refundStatus = String(
    refund?.refund_status || ""
  ).toUpperCase();

  const currencyCode =
    refund?.currency_code || "INR";

  const remainingAmount = toAmount(
    refund?.remaining_refund_amount
  );

  const approvalTransaction = useMemo(
    () =>
      findTransaction(
        transactions,
        ["APPROVAL_REQUIRED"]
      ),
    [transactions]
  );

  const processingTransaction = useMemo(
    () =>
      findTransaction(
        transactions,
        ["PROCESSING"]
      ),
    [transactions]
  );

  const failedTransaction = useMemo(
    () =>
      findTransaction(
        transactions,
        ["FAILED"]
      ),
    [transactions]
  );

  const [activeAction, setActiveAction] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [processForm, setProcessForm] =
    useState({
      refund_mode: "FULL",
      percentage: "",
      custom_amount: "",
      processing_mode: "MANUAL",
      refund_method: "",
      gateway_name: "",
      gateway_payment_id: "",
      gateway_refund_id: "",
      bank_reference: "",
      admin_note: "",
    });

  const [decisionNote, setDecisionNote] =
    useState("");

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [completionForm, setCompletionForm] =
    useState({
      gateway_refund_id: "",
      bank_reference: "",
    });

  const [failureForm, setFailureForm] =
    useState({
      failure_reason: "",
      failure_code: "",
    });

  const [retryForm, setRetryForm] =
    useState({
      processing_mode: "MANUAL",
      refund_method: "",
      gateway_name: "",
      gateway_refund_id: "",
      bank_reference: "",
      admin_note: "",
    });

  const [assignmentForm, setAssignmentForm] =
    useState({
      assigned_to_user_id: "",
      assigned_team: "",
      priority:
        refund?.priority || "NORMAL",
      due_at: "",
    });

  const [commentForm, setCommentForm] =
    useState({
      comment_type: "INTERNAL",
      comment_text: "",
    });

  const calculatedAmount = useMemo(() => {
    if (
      processForm.refund_mode === "FULL"
    ) {
      return remainingAmount;
    }

    if (
      processForm.refund_mode ===
      "PARTIAL_PERCENTAGE"
    ) {
      return toAmount(
        remainingAmount *
          (toAmount(
            processForm.percentage
          ) /
            100)
      );
    }

    return toAmount(
      processForm.custom_amount
    );
  }, [
    processForm.refund_mode,
    processForm.percentage,
    processForm.custom_amount,
    remainingAmount,
  ]);

  const closeAction = () => {
    if (submitting) {
      return;
    }

    setActiveAction("");
    setError("");
    setMessage("");
  };

  const execute = async (
    confirmationText,
    request
  ) => {
    if (
      confirmationText &&
      !window.confirm(confirmationText)
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await request();

      setMessage(
        response.data?.message ||
          "Refund action completed."
      );

      setActiveAction("");

      await onCompleted?.();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitProcess = async (event) => {
    event.preventDefault();

    if (calculatedAmount <= 0) {
      setError(
        "Refund amount must be greater than zero."
      );
      return;
    }

    if (
      calculatedAmount >
      remainingAmount
    ) {
      setError(
        "Refund amount cannot exceed the remaining refundable balance."
      );
      return;
    }

    if (
      processForm.refund_mode ===
        "PARTIAL_PERCENTAGE" &&
      !hasPermission("refund.partial")
    ) {
      setError(
        "You do not have permission to process partial refunds."
      );
      return;
    }

    if (
      processForm.refund_mode ===
        "CUSTOM_AMOUNT" &&
      !hasPermission("refund.custom")
    ) {
      setError(
        "You do not have permission to process custom refund amounts."
      );
      return;
    }

    const idempotencyKey =
      createIdempotencyKey(
        `refund-${refundId}`
      );

    const payload = {
      refund_mode:
        processForm.refund_mode,
      processing_mode:
        processForm.processing_mode,
      refund_method:
        processForm.refund_method ||
        null,
      gateway_name:
        processForm.gateway_name ||
        null,
      gateway_payment_id:
        processForm.gateway_payment_id ||
        null,
      gateway_refund_id:
        processForm.gateway_refund_id ||
        null,
      bank_reference:
        processForm.bank_reference ||
        null,
      admin_note:
        processForm.admin_note ||
        null,
      idempotency_key:
        idempotencyKey,
    };

    if (
      processForm.refund_mode ===
      "PARTIAL_PERCENTAGE"
    ) {
      payload.percentage =
        toAmount(
          processForm.percentage
        );
    }

    if (
      processForm.refund_mode ===
      "CUSTOM_AMOUNT"
    ) {
      payload.custom_amount =
        toAmount(
          processForm.custom_amount
        );
    }

    await execute(
      `Process refund of ${formatMoney(
        calculatedAmount,
        currencyCode
      )}?`,
      () =>
        processRefundRequest(
          refundId,
          payload,
          idempotencyKey
        )
    );
  };

  const submitApproval = async (
    event
  ) => {
    event.preventDefault();

    if (!approvalTransaction) {
      setError(
        "Approval-required transaction not found."
      );
      return;
    }

    await execute(
      "Approve this refund transaction?",
      () =>
        approveRefundTransaction(
          refundId,
          approvalTransaction.id,
          {
            decision_note:
              decisionNote.trim() ||
              null,
          }
        )
    );
  };

  const submitRejection = async (
    event
  ) => {
    event.preventDefault();

    if (!approvalTransaction) {
      setError(
        "Approval-required transaction not found."
      );
      return;
    }

    const reason =
      rejectionReason.trim();

    if (!reason) {
      setError(
        "Rejection reason is required."
      );
      return;
    }

    await execute(
      "Reject this refund transaction?",
      () =>
        rejectRefundTransaction(
          refundId,
          approvalTransaction.id,
          {
            rejection_reason: reason,
            decision_note: reason,
          }
        )
    );
  };

  const submitCompletion = async (
    event
  ) => {
    event.preventDefault();

    if (!processingTransaction) {
      setError(
        "Processing transaction not found."
      );
      return;
    }

    await execute(
      "Mark this refund transaction as completed?",
      () =>
        completeRefundTransaction(
          refundId,
          processingTransaction.id,
          {
            gateway_refund_id:
              completionForm.gateway_refund_id ||
              null,
            bank_reference:
              completionForm.bank_reference ||
              null,
            gateway_response: {},
          }
        )
    );
  };

  const submitFailure = async (
    event
  ) => {
    event.preventDefault();

    if (!processingTransaction) {
      setError(
        "Active processing transaction not found."
      );
      return;
    }

    const reason =
      failureForm.failure_reason.trim();

    if (!reason) {
      setError(
        "Failure reason is required."
      );
      return;
    }

    await execute(
      "Mark this refund transaction as failed?",
      () =>
        failRefundTransaction(
          refundId,
          processingTransaction.id,
          {
            failure_reason: reason,
            failure_code:
              failureForm.failure_code ||
              null,
          }
        )
    );
  };

  const submitRetry = async (
    event
  ) => {
    event.preventDefault();

    if (!failedTransaction) {
      setError(
        "Failed refund transaction not found."
      );
      return;
    }

    const idempotencyKey =
      createIdempotencyKey(
        `refund-retry-${refundId}`
      );

    await execute(
      "Retry this failed refund transaction?",
      () =>
        retryRefundTransaction(
          refundId,
          failedTransaction.id,
          {
            ...retryForm,
            idempotency_key:
              idempotencyKey,
          },
          idempotencyKey
        )
    );
  };

  const submitAssignment = async (
    event
  ) => {
    event.preventDefault();

    const assignedUserId = Number(
      assignmentForm.assigned_to_user_id
    );

    if (
      !Number.isInteger(assignedUserId) ||
      assignedUserId <= 0
    ) {
      setError(
        "Valid assigned admin ID is required."
      );
      return;
    }

    await execute(
      "Assign this refund request?",
      () =>
        assignRefundRequest(
          refundId,
          {
            assigned_to_user_id:
              assignedUserId,
            assigned_team:
              assignmentForm.assigned_team ||
              null,
            priority:
              assignmentForm.priority,
            due_at:
              assignmentForm.due_at ||
              null,
          }
        )
    );
  };

  const submitComment = async (
    event
  ) => {
    event.preventDefault();

    const commentText =
      commentForm.comment_text.trim();

    if (!commentText) {
      setError(
        "Comment text is required."
      );
      return;
    }

    await execute(
      "",
      () =>
        addRefundComment(
          refundId,
          {
            comment_type:
              commentForm.comment_type,
            comment_text:
              commentText,
          }
        )
    );

    setCommentForm((current) => ({
      ...current,
      comment_text: "",
    }));
  };

  const canProcess =
    hasPermission("refund.process") &&
    PROCESSABLE_STATUSES.has(
      refundStatus
    ) &&
    remainingAmount > 0;

  const canApprove =
    hasPermission("refund.approve") &&
    Boolean(approvalTransaction);

  const canReject =
    hasPermission("refund.reject") &&
    Boolean(approvalTransaction);

  const canComplete =
    hasPermission("refund.process") &&
    Boolean(processingTransaction);

  const canFail =
    hasPermission("refund.process") &&
    Boolean(processingTransaction);

  const canRetry =
    hasPermission("refund.retry") &&
    Boolean(failedTransaction);

  const canAssign =
    hasPermission("refund.assign") &&
    !TERMINAL_STATUSES.has(
      refundStatus
    );

  const canComment =
    hasPermission("refund.comment");

  const visibleActions = [
    canProcess,
    canApprove,
    canReject,
    canComplete,
    canFail,
    canRetry,
    canAssign,
    canComment,
  ].filter(Boolean).length;

  return (
    <section className="admin-refund-panel admin-refund-action-center">
      <div className="admin-refund-action-header">
        <div>
          <h2>Refund Action Center</h2>

          <p>
            Available actions are controlled by
            refund permissions and current
            workflow status.
          </p>
        </div>

        <div className="admin-refund-action-balance">
          <span>Remaining refundable balance</span>

          <strong>
            {formatMoney(
              remainingAmount,
              currencyCode
            )}
          </strong>
        </div>
      </div>

      {message && (
        <div className="admin-refund-action-success">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-refund-action-error">
          {error}
        </div>
      )}

      {visibleActions === 0 ? (
        <div className="admin-refund-action-empty">
          No financial action is currently
          available for your permissions and
          this refund status.
        </div>
      ) : (
        <div className="admin-refund-action-buttons">
          {canProcess && (
            <button
              type="button"
              onClick={() =>
                setActiveAction("PROCESS")
              }
            >
              Process Refund
            </button>
          )}

          {canApprove && (
            <button
              type="button"
              onClick={() =>
                setActiveAction("APPROVE")
              }
            >
              Approve Refund
            </button>
          )}

          {canReject && (
            <button
              type="button"
              className="danger"
              onClick={() =>
                setActiveAction("REJECT")
              }
            >
              Reject Refund
            </button>
          )}

          {canComplete && (
            <button
              type="button"
              onClick={() =>
                setActiveAction("COMPLETE")
              }
            >
              Complete Refund
            </button>
          )}

          {canFail && (
            <button
              type="button"
              className="danger"
              onClick={() =>
                setActiveAction("FAIL")
              }
            >
              Mark Failed
            </button>
          )}

          {canRetry && (
            <button
              type="button"
              onClick={() =>
                setActiveAction("RETRY")
              }
            >
              Retry Refund
            </button>
          )}

          {canAssign && (
            <button
              type="button"
              onClick={() =>
                setActiveAction("ASSIGN")
              }
            >
              Assign Refund
            </button>
          )}

          {canComment && (
            <button
              type="button"
              onClick={() =>
                setActiveAction("COMMENT")
              }
            >
              Add Comment
            </button>
          )}
        </div>
      )}

      {activeAction && (
        <div
          className="admin-refund-action-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="admin-refund-action-dialog">
            <div className="admin-refund-action-dialog-header">
              <h3>
                {activeAction.replaceAll(
                  "_",
                  " "
                )}
              </h3>

              <button
                type="button"
                onClick={closeAction}
                disabled={submitting}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {activeAction === "PROCESS" && (
              <form
                className="admin-refund-action-form"
                onSubmit={submitProcess}
              >
                <label>
                  <span>Refund Type</span>

                  <select
                    value={
                      processForm.refund_mode
                    }
                    onChange={(event) =>
                      setProcessForm(
                        (current) => ({
                          ...current,
                          refund_mode:
                            event.target.value,
                        })
                      )
                    }
                  >
                    <option value="FULL">
                      Full Refund
                    </option>

                    {hasPermission(
                      "refund.partial"
                    ) && (
                      <option value="PARTIAL_PERCENTAGE">
                        Partial Percentage
                      </option>
                    )}

                    {hasPermission(
                      "refund.custom"
                    ) && (
                      <option value="CUSTOM_AMOUNT">
                        Custom Amount
                      </option>
                    )}
                  </select>
                </label>

                {processForm.refund_mode ===
                  "PARTIAL_PERCENTAGE" && (
                  <label>
                    <span>Percentage</span>

                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      required
                      value={
                        processForm.percentage
                      }
                      onChange={(event) =>
                        setProcessForm(
                          (current) => ({
                            ...current,
                            percentage:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>
                )}

                {processForm.refund_mode ===
                  "CUSTOM_AMOUNT" && (
                  <label>
                    <span>Custom Amount</span>

                    <input
                      type="number"
                      min="0.01"
                      max={remainingAmount}
                      step="0.01"
                      required
                      value={
                        processForm.custom_amount
                      }
                      onChange={(event) =>
                        setProcessForm(
                          (current) => ({
                            ...current,
                            custom_amount:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>
                )}

                <div className="admin-refund-action-preview">
                  Refund amount:{" "}
                  <strong>
                    {formatMoney(
                      calculatedAmount,
                      currencyCode
                    )}
                  </strong>
                </div>

                <label>
                  <span>Processing Mode</span>

                  <select
                    value={
                      processForm.processing_mode
                    }
                    onChange={(event) =>
                      setProcessForm(
                        (current) => ({
                          ...current,
                          processing_mode:
                            event.target.value,
                        })
                      )
                    }
                  >
                    <option value="MANUAL">
                      Manual
                    </option>
                    <option value="AUTOMATIC">
                      Automatic
                    </option>
                  </select>
                </label>

                <label>
                  <span>Refund Method</span>
                  <input
                    value={
                      processForm.refund_method
                    }
                    onChange={(event) =>
                      setProcessForm(
                        (current) => ({
                          ...current,
                          refund_method:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Gateway Name</span>
                  <input
                    value={
                      processForm.gateway_name
                    }
                    onChange={(event) =>
                      setProcessForm(
                        (current) => ({
                          ...current,
                          gateway_name:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Gateway Payment ID</span>
                  <input
                    value={
                      processForm.gateway_payment_id
                    }
                    onChange={(event) =>
                      setProcessForm(
                        (current) => ({
                          ...current,
                          gateway_payment_id:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Gateway Refund ID</span>
                  <input
                    value={
                      processForm.gateway_refund_id
                    }
                    onChange={(event) =>
                      setProcessForm(
                        (current) => ({
                          ...current,
                          gateway_refund_id:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Bank Reference / UTR</span>
                  <input
                    value={
                      processForm.bank_reference
                    }
                    onChange={(event) =>
                      setProcessForm(
                        (current) => ({
                          ...current,
                          bank_reference:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label className="wide">
                  <span>Admin Note</span>
                  <textarea
                    rows="3"
                    value={
                      processForm.admin_note
                    }
                    onChange={(event) =>
                      setProcessForm(
                        (current) => ({
                          ...current,
                          admin_note:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <div className="admin-refund-action-form-buttons wide">
                  <button
                    type="button"
                    onClick={closeAction}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Processing..."
                      : "Submit Refund"}
                  </button>
                </div>
              </form>
            )}

            {activeAction === "APPROVE" && (
              <form
                className="admin-refund-action-form"
                onSubmit={submitApproval}
              >
                <label className="wide">
                  <span>Decision Note</span>
                  <textarea
                    rows="4"
                    value={decisionNote}
                    onChange={(event) =>
                      setDecisionNote(
                        event.target.value
                      )
                    }
                  />
                </label>

                <div className="admin-refund-action-form-buttons wide">
                  <button
                    type="button"
                    onClick={closeAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                  >
                    Approve Refund
                  </button>
                </div>
              </form>
            )}

            {activeAction === "REJECT" && (
              <form
                className="admin-refund-action-form"
                onSubmit={submitRejection}
              >
                <label className="wide">
                  <span>Rejection Reason</span>
                  <textarea
                    rows="4"
                    required
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(
                        event.target.value
                      )
                    }
                  />
                </label>

                <div className="admin-refund-action-form-buttons wide">
                  <button
                    type="button"
                    onClick={closeAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="danger"
                    disabled={submitting}
                  >
                    Reject Refund
                  </button>
                </div>
              </form>
            )}

            {activeAction === "COMPLETE" && (
              <form
                className="admin-refund-action-form"
                onSubmit={submitCompletion}
              >
                <label>
                  <span>Gateway Refund ID</span>
                  <input
                    value={
                      completionForm.gateway_refund_id
                    }
                    onChange={(event) =>
                      setCompletionForm(
                        (current) => ({
                          ...current,
                          gateway_refund_id:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Bank Reference / UTR</span>
                  <input
                    value={
                      completionForm.bank_reference
                    }
                    onChange={(event) =>
                      setCompletionForm(
                        (current) => ({
                          ...current,
                          bank_reference:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <div className="admin-refund-action-form-buttons wide">
                  <button
                    type="button"
                    onClick={closeAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                  >
                    Complete Refund
                  </button>
                </div>
              </form>
            )}

            {activeAction === "FAIL" && (
              <form
                className="admin-refund-action-form"
                onSubmit={submitFailure}
              >
                <label>
                  <span>Failure Code</span>
                  <input
                    value={
                      failureForm.failure_code
                    }
                    onChange={(event) =>
                      setFailureForm(
                        (current) => ({
                          ...current,
                          failure_code:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label className="wide">
                  <span>Failure Reason</span>
                  <textarea
                    rows="4"
                    required
                    value={
                      failureForm.failure_reason
                    }
                    onChange={(event) =>
                      setFailureForm(
                        (current) => ({
                          ...current,
                          failure_reason:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <div className="admin-refund-action-form-buttons wide">
                  <button
                    type="button"
                    onClick={closeAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="danger"
                    disabled={submitting}
                  >
                    Mark Failed
                  </button>
                </div>
              </form>
            )}

            {activeAction === "RETRY" && (
              <form
                className="admin-refund-action-form"
                onSubmit={submitRetry}
              >
                <label>
                  <span>Processing Mode</span>
                  <select
                    value={
                      retryForm.processing_mode
                    }
                    onChange={(event) =>
                      setRetryForm(
                        (current) => ({
                          ...current,
                          processing_mode:
                            event.target.value,
                        })
                      )
                    }
                  >
                    <option value="MANUAL">
                      Manual
                    </option>
                    <option value="AUTOMATIC">
                      Automatic
                    </option>
                  </select>
                </label>

                <label>
                  <span>Refund Method</span>
                  <input
                    value={
                      retryForm.refund_method
                    }
                    onChange={(event) =>
                      setRetryForm(
                        (current) => ({
                          ...current,
                          refund_method:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Gateway Name</span>
                  <input
                    value={
                      retryForm.gateway_name
                    }
                    onChange={(event) =>
                      setRetryForm(
                        (current) => ({
                          ...current,
                          gateway_name:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Gateway Refund ID</span>
                  <input
                    value={
                      retryForm.gateway_refund_id
                    }
                    onChange={(event) =>
                      setRetryForm(
                        (current) => ({
                          ...current,
                          gateway_refund_id:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Bank Reference / UTR</span>
                  <input
                    value={
                      retryForm.bank_reference
                    }
                    onChange={(event) =>
                      setRetryForm(
                        (current) => ({
                          ...current,
                          bank_reference:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label className="wide">
                  <span>Admin Note</span>
                  <textarea
                    rows="3"
                    value={
                      retryForm.admin_note
                    }
                    onChange={(event) =>
                      setRetryForm(
                        (current) => ({
                          ...current,
                          admin_note:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <div className="admin-refund-action-form-buttons wide">
                  <button
                    type="button"
                    onClick={closeAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                  >
                    Retry Refund
                  </button>
                </div>
              </form>
            )}

            {activeAction === "ASSIGN" && (
              <form
                className="admin-refund-action-form"
                onSubmit={submitAssignment}
              >
                <label>
                  <span>Assigned Admin ID</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={
                      assignmentForm.assigned_to_user_id
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          assigned_to_user_id:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Assigned Team</span>
                  <input
                    value={
                      assignmentForm.assigned_team
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          assigned_team:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>Priority</span>
                  <select
                    value={
                      assignmentForm.priority
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          priority:
                            event.target.value,
                        })
                      )
                    }
                  >
                    {PRIORITIES.map(
                      (priority) => (
                        <option
                          key={priority}
                          value={priority}
                        >
                          {priority}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>Due Date-Time</span>
                  <input
                    type="datetime-local"
                    value={
                      assignmentForm.due_at
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          due_at:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <div className="admin-refund-action-form-buttons wide">
                  <button
                    type="button"
                    onClick={closeAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                  >
                    Assign Refund
                  </button>
                </div>
              </form>
            )}

            {activeAction === "COMMENT" && (
              <form
                className="admin-refund-action-form"
                onSubmit={submitComment}
              >
                <label>
                  <span>Comment Type</span>
                  <select
                    value={
                      commentForm.comment_type
                    }
                    onChange={(event) =>
                      setCommentForm(
                        (current) => ({
                          ...current,
                          comment_type:
                            event.target.value,
                        })
                      )
                    }
                  >
                    <option value="INTERNAL">
                      Internal
                    </option>
                    <option value="CUSTOMER_VISIBLE">
                      Customer Visible
                    </option>
                  </select>
                </label>

                <label className="wide">
                  <span>Comment</span>
                  <textarea
                    rows="5"
                    maxLength="5000"
                    required
                    value={
                      commentForm.comment_text
                    }
                    onChange={(event) =>
                      setCommentForm(
                        (current) => ({
                          ...current,
                          comment_text:
                            event.target.value,
                        })
                      )
                    }
                  />
                </label>

                <div className="admin-refund-action-form-buttons wide">
                  <button
                    type="button"
                    onClick={closeAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                  >
                    Add Comment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
