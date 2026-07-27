import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getRefundRequestById,
} from "../api/adminRefundApi";

import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import RefundActionCenter from "../components/admin/refunds/RefundActionCenter";

import "./AdminRefunds.css";

const MONEY_FIELDS = new Set([
  "original_payment_amount",
  "refund_amount",
  "approved_refund_amount",
  "total_refunded_amount",
  "remaining_refund_amount",
  "booking_fare",
  "payment_amount",
  "refunded_amount",
  "requested_amount",
  "approved_amount",
  "expected_amount",
  "settled_amount",
]);

const DATE_FIELDS = new Set([
  "requested_at",
  "assigned_at",
  "due_at",
  "processing_started_at",
  "processing_locked_at",
  "processing_lock_expires_at",
  "approved_at",
  "completed_at",
  "failed_at",
  "refunded_at",
  "decided_at",
  "created_at",
  "updated_at",
  "last_activity_at",
  "sent_at",
  "scheduled_at",
]);

const PRIMARY_FIELDS = [
  ["refund_number", "Refund Number"],
  ["booking_id", "Booking ID"],
  ["payment_id", "Payment ID"],
  ["refund_status", "Refund Status"],
  ["approval_status", "Approval Status"],
  ["priority", "Priority"],
  ["refund_mode", "Refund Mode"],
  ["refund_method", "Refund Method"],
  ["approved_refund_amount", "Approved Amount"],
  ["total_refunded_amount", "Refunded Amount"],
  ["remaining_refund_amount", "Remaining Amount"],
  ["assigned_to_name", "Assigned Admin"],
  ["assigned_team", "Assigned Team"],
  ["sla_status", "SLA Status"],
  ["risk_level", "Risk Level"],
  ["risk_score", "Risk Score"],
  ["reconciliation_status", "Reconciliation"],
  ["dispute_status", "Dispute Status"],
  ["contact_phone", "Phone"],
  ["contact_email", "Email"],
  ["requested_at", "Requested At"],
  ["due_at", "Due At"],
  ["completed_at", "Completed At"],
];

const TABS = [
  ["transactions", "Transactions"],
  ["approvals", "Approvals"],
  ["activity", "Activity"],
  ["comments", "Comments"],
  ["disputes", "Disputes"],
  ["reconciliations", "Reconciliation"],
  ["attachments", "Attachments"],
];

function formatMoney(value, currency = "INR") {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-US");
}

function formatValue(
  field,
  value,
  currency = "INR"
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (MONEY_FIELDS.has(field)) {
    return formatMoney(value, currency);
  }

  if (
    DATE_FIELDS.has(field) ||
    field.endsWith("_at")
  ) {
    return formatDate(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function DetailRecord({
  record,
  currency,
}) {
  const entries = Object.entries(record || {});

  return (
    <article className="admin-refund-record-card">
      <dl>
        {entries.map(([field, value]) => (
          <div key={field}>
            <dt>
              {field
                .replaceAll("_", " ")
                .replace(/\b\w/g, (letter) =>
                  letter.toUpperCase()
                )}
            </dt>

            <dd>
              {formatValue(
                field,
                value,
                currency
              )}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function AdminRefundDetails() {
  const { refundId } = useParams();

  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] =
    useState("transactions");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getRefundRequestById(refundId);

      setDetail(response.data || null);
    } catch (requestError) {
      console.error(
        "Refund detail load failed:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Failed to load refund details."
      );
    } finally {
      setLoading(false);
    }
  }, [refundId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const refund = detail?.refund || {};

  const activeRecords = useMemo(
    () =>
      Array.isArray(detail?.[activeTab])
        ? detail[activeTab]
        : [],
    [detail, activeTab]
  );

  return (
    <div className="admin-refund-layout">
      <AdminSidebar />

      <main className="admin-refund-main">
        <AdminHeader />

        <div className="admin-refund-page">
          <div>
            <Link
              to="/admin/refunds"
              className="admin-refund-back"
            >
              ← Back to refunds
            </Link>
          </div>

          <div className="admin-refund-heading-row">
            <div>
              <h1>
                Refund Details
              </h1>

              <p>
                {refund.refund_number ||
                  `Refund request #${refundId}`}
              </p>
            </div>

            <button
              type="button"
              className="admin-refund-button"
              onClick={loadDetail}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {loading ? (
            <section className="admin-refund-panel">
              <div className="admin-refund-loading">
                Loading refund details...
              </div>
            </section>
          ) : error ? (
            <section className="admin-refund-panel">
              <div className="admin-refund-error">
                {error}
              </div>
            </section>
          ) : !detail ? (
            <section className="admin-refund-panel">
              <div className="admin-refund-empty">
                Refund details not found.
              </div>
            </section>
          ) : (
            <>
              <RefundActionCenter
                refund={refund}
                transactions={
                  detail.transactions || []
                }
                onCompleted={loadDetail}
              />

              <section className="admin-refund-panel admin-refund-section">
                <h2>Request Overview</h2>

                <div className="admin-refund-detail-grid">
                  {PRIMARY_FIELDS.map(
                    ([field, label]) => (
                      <article
                        key={field}
                        className="admin-refund-detail-card"
                      >
                        <span>{label}</span>

                        <strong>
                          {formatValue(
                            field,
                            refund[field],
                            refund.currency_code
                          )}
                        </strong>
                      </article>
                    )
                  )}
                </div>
              </section>

              <section className="admin-refund-panel">
                <div className="admin-refund-tabs">
                  {TABS.map(([key, label]) => {
                    const count = Array.isArray(
                      detail[key]
                    )
                      ? detail[key].length
                      : 0;

                    return (
                      <button
                        key={key}
                        type="button"
                        className={
                          activeTab === key
                            ? "admin-refund-tab admin-refund-tab--active"
                            : "admin-refund-tab"
                        }
                        onClick={() =>
                          setActiveTab(key)
                        }
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="admin-refund-section">
                  <h2>
                    {
                      TABS.find(
                        ([key]) =>
                          key === activeTab
                      )?.[1]
                    }
                  </h2>

                  {!activeRecords.length ? (
                    <div className="admin-refund-empty">
                      No records found.
                    </div>
                  ) : (
                    <div className="admin-refund-record-list">
                      {activeRecords.map(
                        (record, index) => (
                          <DetailRecord
                            key={
                              record.id ||
                              `${activeTab}-${index}`
                            }
                            record={record}
                            currency={
                              record.currency_code ||
                              refund.currency_code
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="admin-refund-panel admin-refund-section">
                <h2>Complete Request Record</h2>

                <DetailRecord
                  record={refund}
                  currency={refund.currency_code}
                />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
