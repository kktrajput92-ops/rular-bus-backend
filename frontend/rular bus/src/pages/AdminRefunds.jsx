import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import adminRefundApi from "../api/adminRefundApi";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";

import "./AdminRefunds.css";

const INITIAL_FILTERS = {
  search: "",
  status: "",
  priority: "",
  assigned_to: "",
};

const STATUS_OPTIONS = [
  "PENDING",
  "ASSIGNED",
  "APPROVAL_REQUIRED",
  "PROCESSING",
  "PARTIALLY_REFUNDED",
  "SUCCESS",
  "FAILED",
  "REJECTED",
  "RESOLVED",
];

const PRIORITY_OPTIONS = [
  "URGENT",
  "HIGH",
  "NORMAL",
  "LOW",
];

const SUMMARY_CARDS = [
  ["total_requests", "Total Requests", "number"],
  ["pending_count", "Pending", "number"],
  ["approval_required_count", "Approval Required", "number"],
  ["assigned_count", "Assigned", "number"],
  ["processing_count", "Processing", "number"],
  ["partially_refunded_count", "Partially Refunded", "number"],
  ["success_count", "Successful", "number"],
  ["failed_count", "Failed", "number"],
  ["active_disputes_count", "Active Disputes", "number"],
  ["overdue_count", "SLA Overdue", "number"],
  ["pending_refund_amount", "Pending Amount", "money"],
  ["total_refunded_amount", "Total Refunded", "money"],
  ["approved_refund_amount", "Approved Amount", "money"],
];

function formatMoney(value, currencyCode = "INR") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US");
}

function getStatusClass(value) {
  const status = String(value || "").toUpperCase();

  if (
    [
      "SUCCESS",
      "COMPLETED",
      "APPROVED",
      "RESOLVED",
      "PAID",
      "ACTIVE",
    ].includes(status)
  ) {
    return "admin-refund-status--success";
  }

  if (
    [
      "FAILED",
      "REJECTED",
      "CANCELLED",
      "OVERDUE",
      "INACTIVE",
    ].includes(status)
  ) {
    return "admin-refund-status--danger";
  }

  if (
    [
      "PENDING",
      "APPROVAL_REQUIRED",
      "PARTIALLY_REFUNDED",
      "UNDER_REVIEW",
      "URGENT",
      "HIGH",
    ].includes(status)
  ) {
    return "admin-refund-status--warning";
  }

  return "admin-refund-status--info";
}

function StatusBadge({ value }) {
  return (
    <span
      className={`admin-refund-status ${getStatusClass(
        value
      )}`}
    >
      {value || "—"}
    </span>
  );
}

function buildRequestParams(filters, page, limit) {
  const params = {
    page,
    limit,
  };

  Object.entries(filters).forEach(([key, value]) => {
    const normalizedValue = String(value || "").trim();

    if (normalizedValue) {
      params[key] = normalizedValue;
    }
  });

  return params;
}

export default function AdminRefunds() {
  const [summary, setSummary] = useState({});
  const [refunds, setRefunds] = useState([]);

  const [filters, setFilters] =
    useState(INITIAL_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState(INITIAL_FILTERS);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);

      const response =
        await adminRefundApi.getSummary();

      setSummary(response.data?.summary || {});
    } catch (requestError) {
      console.error(
        "Refund summary load failed:",
        requestError
      );
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadRefunds = useCallback(
    async (requestedPage = 1) => {
      try {
        setLoading(true);
        setError("");

        const params = buildRequestParams(
          appliedFilters,
          requestedPage,
          pagination.limit
        );

        const response =
          await adminRefundApi.getRefunds(params);

        setRefunds(
          Array.isArray(response.data?.refunds)
            ? response.data.refunds
            : []
        );

        setPagination((current) => ({
          ...current,
          ...(response.data?.pagination || {}),
        }));
      } catch (requestError) {
        console.error(
          "Refund list load failed:",
          requestError
        );

        setRefunds([]);

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Failed to load refund requests."
        );
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, pagination.limit]
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadRefunds(1);
  }, [loadRefunds]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const applyFilters = (event) => {
    event.preventDefault();

    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    setAppliedFilters({
      ...filters,
    });
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    setAppliedFilters(INITIAL_FILTERS);
  };

  const refreshPage = async () => {
    await Promise.all([
      loadSummary(),
      loadRefunds(Number(pagination.page) || 1),
    ]);
  };

  const currentPage =
    Number(pagination.page || 1);

  const totalPages =
    Number(pagination.total_pages || 0);

  return (
    <div className="admin-refund-layout">
      <AdminSidebar />

      <main className="admin-refund-main">
        <AdminHeader />

        <div className="admin-refund-page">
          <header className="admin-refund-header">
            <div>
              <h1 className="admin-refund-title">
                Refund Management
              </h1>

              <p className="admin-refund-subtitle">
                Monitor refund requests, approvals,
                assignment, SLA, risk, disputes and
                reconciliation.
              </p>
            </div>

            <button
              type="button"
              className="admin-refund-refresh"
              onClick={refreshPage}
              disabled={loading || summaryLoading}
            >
              {loading || summaryLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </header>

          <section className="admin-refund-summary-grid">
            {SUMMARY_CARDS.map(
              ([key, label, type]) => (
                <article
                  key={key}
                  className="admin-refund-summary-card"
                >
                  <span>{label}</span>

                  <strong>
                    {summaryLoading
                      ? "..."
                      : type === "money"
                      ? formatMoney(summary[key], "INR")
                      : Number(summary[key] || 0)}
                  </strong>
                </article>
              )
            )}
          </section>

          <section className="admin-refund-panel admin-refund-filter-panel">
            <form
              className="admin-refund-filters"
              onSubmit={applyFilters}
            >
              <label className="admin-refund-field">
                <span>Search</span>

                <input
                  type="search"
                  value={filters.search}
                  placeholder="Refund number, booking ID, phone or email"
                  onChange={(event) =>
                    updateFilter(
                      "search",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="admin-refund-field">
                <span>Status</span>

                <select
                  value={filters.status}
                  onChange={(event) =>
                    updateFilter(
                      "status",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All statuses
                  </option>

                  {STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-refund-field">
                <span>Priority</span>

                <select
                  value={filters.priority}
                  onChange={(event) =>
                    updateFilter(
                      "priority",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All priorities
                  </option>

                  {PRIORITY_OPTIONS.map((priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-refund-field">
                <span>Assigned Admin ID</span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={filters.assigned_to}
                  placeholder="User ID"
                  onChange={(event) =>
                    updateFilter(
                      "assigned_to",
                      event.target.value
                    )
                  }
                />
              </label>

              <div className="admin-refund-filter-actions">
                <button
                  type="submit"
                  className="admin-refund-primary-button"
                >
                  Apply
                </button>

                <button
                  type="button"
                  className="admin-refund-secondary-button"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          <section className="admin-refund-panel">
            {loading ? (
              <div className="admin-refund-loading">
                Loading refund requests...
              </div>
            ) : error ? (
              <div className="admin-refund-error">
                {error}
              </div>
            ) : refunds.length === 0 ? (
              <div className="admin-refund-empty">
                No refund requests found.
              </div>
            ) : (
              <div className="admin-refund-table-wrap">
                <table className="admin-refund-table">
                  <thead>
                    <tr>
                      <th>Refund</th>
                      <th>Booking</th>
                      <th>Customer</th>
                      <th>Amounts</th>
                      <th>Status</th>
                      <th>Approval</th>
                      <th>Priority</th>
                      <th>Assignment</th>
                      <th>SLA</th>
                      <th>Risk</th>
                      <th>Payment</th>
                      <th>Records</th>
                      <th>Requested</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {refunds.map((refund) => (
                      <tr key={refund.id}>
                        <td>
                          <span className="admin-refund-primary">
                            {refund.refund_number ||
                              `Refund #${refund.id}`}
                          </span>

                          <span className="admin-refund-secondary">
                            Request ID: {refund.id}
                          </span>

                          <span className="admin-refund-secondary">
                            Mode: {refund.refund_mode || "—"}
                          </span>
                        </td>

                        <td>
                          <span className="admin-refund-primary">
                            Booking #{refund.booking_id}
                          </span>

                          <span className="admin-refund-secondary">
                            {refund.booking_status || "—"}
                          </span>

                          <span className="admin-refund-secondary">
                            Passengers:{" "}
                            {refund.passenger_count ?? "—"}
                          </span>
                        </td>

                        <td>
                          <span className="admin-refund-primary">
                            {refund.contact_phone || "—"}
                          </span>

                          <span className="admin-refund-secondary">
                            {refund.contact_email || "—"}
                          </span>
                        </td>

                        <td>
                          <span className="admin-refund-primary">
                            Requested:{" "}
                            {formatMoney(
                              refund.refund_amount,
                              refund.currency_code
                            )}
                          </span>

                          <span className="admin-refund-secondary">
                            Approved:{" "}
                            {formatMoney(
                              refund.approved_refund_amount,
                              refund.currency_code
                            )}
                          </span>

                          <span className="admin-refund-secondary">
                            Refunded:{" "}
                            {formatMoney(
                              refund.total_refunded_amount,
                              refund.currency_code
                            )}
                          </span>

                          <span className="admin-refund-secondary">
                            Remaining:{" "}
                            {formatMoney(
                              refund.remaining_refund_amount,
                              refund.currency_code
                            )}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            value={refund.refund_status}
                          />
                        </td>

                        <td>
                          <StatusBadge
                            value={refund.approval_status}
                          />
                        </td>

                        <td>
                          <StatusBadge
                            value={refund.priority}
                          />
                        </td>

                        <td>
                          <span className="admin-refund-primary">
                            {refund.assigned_to_name ||
                              "Unassigned"}
                          </span>

                          <span className="admin-refund-secondary">
                            Team:{" "}
                            {refund.assigned_team || "—"}
                          </span>

                          <span className="admin-refund-secondary">
                            Assigned:{" "}
                            {formatDateTime(
                              refund.assigned_at
                            )}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            value={refund.sla_status}
                          />

                          <span className="admin-refund-secondary">
                            Due:{" "}
                            {formatDateTime(refund.due_at)}
                          </span>
                        </td>

                        <td>
                          <span className="admin-refund-primary">
                            {refund.risk_level || "—"}
                          </span>

                          <span className="admin-refund-secondary">
                            Score:{" "}
                            {refund.risk_score ?? "—"}
                          </span>
                        </td>

                        <td>
                          <span className="admin-refund-primary">
                            {refund.payment_method || "—"}
                          </span>

                          <span className="admin-refund-secondary">
                            Payment:{" "}
                            {refund.payment_status || "—"}
                          </span>

                          <span className="admin-refund-secondary">
                            Refund:{" "}
                            {refund.payment_refund_status ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <span className="admin-refund-primary">
                            Transactions:{" "}
                            {refund.transaction_count || 0}
                          </span>

                          <span className="admin-refund-secondary">
                            Comments:{" "}
                            {refund.comment_count || 0}
                          </span>

                          <span className="admin-refund-secondary">
                            Retries:{" "}
                            {refund.retry_count || 0}
                          </span>
                        </td>

                        <td>
                          {formatDateTime(
                            refund.requested_at
                          )}
                        </td>

                        <td>
                          <Link
                            className="admin-refund-link"
                            to={`/admin/refunds/${refund.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <footer className="admin-refund-pagination">
              <span className="admin-refund-pagination-summary">
                Page {currentPage} of {totalPages} ·{" "}
                {Number(pagination.total || 0)} total
                requests
              </span>

              <div className="admin-refund-pagination-controls">
                <button
                  type="button"
                  disabled={loading || currentPage <= 1}
                  onClick={() =>
                    loadRefunds(currentPage - 1)
                  }
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    loading ||
                    totalPages <= 0 ||
                    currentPage >= totalPages
                  }
                  onClick={() =>
                    loadRefunds(currentPage + 1)
                  }
                >
                  Next
                </button>
              </div>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
