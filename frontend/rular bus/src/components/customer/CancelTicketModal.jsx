import {
  useEffect,
  useState,
} from "react";

import customerApi from "../../api/customerApi";

const REASONS = [
  ["CHANGE_OF_PLAN", "यात्रा की योजना बदल गई"],
  ["BOOKED_BY_MISTAKE", "गलती से टिकट बुक हुआ"],
  ["DUPLICATE_BOOKING", "Duplicate booking"],
  ["MEDICAL_REASON", "Medical reason"],
  ["TRAVEL_DATE_CHANGED", "Travel date बदल गई"],
  ["OTHER", "अन्य कारण"],
];

const formatMoney = (
  amount,
  currency = "INR"
) => {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
      }
    ).format(value);
  } catch {
    return `₹${value.toFixed(2)}`;
  }
};

function CancelTicketModal({
  ticket,
  onClose,
  onCancelled,
}) {
  const bookingId =
    ticket?.booking_id ||
    ticket?.id;

  const [preview, setPreview] =
    useState(null);

  const [reasonCode, setReasonCode] =
    useState("CHANGE_OF_PLAN");

  const [reasonText, setReasonText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await customerApi.get(
            `/customer-auth/bookings/${bookingId}/cancellation-preview`
          );

        if (active) {
          setPreview(
            response.data?.cancellation ||
              null
          );
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setPreview(
          requestError.response?.data
            ?.cancellation || null
        );

        setError(
          requestError.response?.data
            ?.message ||
            "Cancellation details load नहीं हुईं।"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (bookingId) {
      loadPreview();
    } else {
      setLoading(false);
      setError(
        "Valid booking ID उपलब्ध नहीं है।"
      );
    }

    return () => {
      active = false;
    };
  }, [bookingId]);

  const confirmCancellation =
    async () => {
      if (
        submitting ||
        !preview?.eligible
      ) {
        return;
      }

      if (
        reasonCode === "OTHER" &&
        reasonText.trim().length < 5
      ) {
        setError(
          "कृपया cancellation का कारण लिखें।"
        );

        return;
      }

      const confirmed =
        window.confirm(
          `क्या आप ticket ${
            ticket?.ticket_number ||
            bookingId
          } cancel करना चाहते हैं?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setSubmitting(true);
        setError("");

        const response =
          await customerApi.post(
            `/customer-auth/bookings/${bookingId}/cancel`,
            {
              reason_code: reasonCode,
              reason_text:
                reasonText.trim() ||
                null,
            }
          );

        await onCancelled?.();

        window.alert(
          response.data?.message ||
            "Ticket cancelled successfully."
        );
      } catch (requestError) {
        const responseData =
          requestError.response?.data;

        if (
          responseData?.cancellation
        ) {
          setPreview(
            responseData.cancellation
          );
        }

        setError(
          responseData?.message ||
            "Ticket cancel नहीं हुआ।"
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div
      style={styles.backdrop}
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        style={styles.modal}
      >
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              BOOKING CANCELLATION
            </p>

            <h2 style={styles.title}>
              Cancel Ticket
            </h2>

            <p style={styles.subtitle}>
              Ticket:{" "}
              {ticket?.ticket_number ||
                "Unavailable"}
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            style={styles.closeButton}
          >
            ✕
          </button>
        </header>

        {loading && (
          <div style={styles.loadingBox}>
            Cancellation policy calculate
            हो रही है…
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {!loading && preview && (
          <>
            <div
              style={{
                ...styles.eligibilityBox,
                ...(preview.eligible
                  ? styles.eligibleBox
                  : styles.ineligibleBox),
              }}
            >
              <strong>
                {preview.eligible
                  ? "✓ Cancellation available"
                  : "✕ Cancellation unavailable"}
              </strong>

              <span>
                {preview.message}
              </span>
            </div>

            <div style={styles.summaryGrid}>
              <Summary
                label="Booking amount"
                value={formatMoney(
                  preview.booking_amount,
                  preview.currency_code
                )}
              />

              <Summary
                label="Refund"
                value={`${Number(
                  preview.refund_percentage ||
                    0
                )}%`}
              />

              <Summary
                label="Cancellation charge"
                value={formatMoney(
                  preview.cancellation_charge,
                  preview.currency_code
                )}
              />

              <Summary
                label="Refund amount"
                value={formatMoney(
                  preview.refundable_amount,
                  preview.currency_code
                )}
              />
            </div>

            {preview.eligible && (
              <div style={styles.formSection}>
                <label style={styles.label}>
                  Cancellation reason
                </label>

                <select
                  value={reasonCode}
                  onChange={(event) => {
                    setReasonCode(
                      event.target.value
                    );

                    setError("");
                  }}
                  style={styles.select}
                >
                  {REASONS.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>

                {reasonCode === "OTHER" && (
                  <textarea
                    value={reasonText}
                    onChange={(event) => {
                      setReasonText(
                        event.target.value
                      );

                      setError("");
                    }}
                    rows={4}
                    maxLength={1000}
                    placeholder="Cancellation का कारण लिखें…"
                    style={styles.textarea}
                  />
                )}
              </div>
            )}
          </>
        )}

        <footer style={styles.actions}>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            style={styles.secondaryButton}
          >
            वापस जाएँ
          </button>

          {preview?.eligible && (
            <button
              type="button"
              disabled={submitting}
              onClick={
                confirmCancellation
              }
              style={{
                ...styles.dangerButton,
                opacity: submitting
                  ? 0.65
                  : 1,
              }}
            >
              {submitting
                ? "Cancel हो रहा है…"
                : "Confirm Cancellation"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function Summary({
  label,
  value,
}) {
  return (
    <div style={styles.summaryItem}>
      <span style={styles.summaryLabel}>
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    placeItems: "center",
    padding: "18px",
    overflowY: "auto",
    background:
      "rgba(15,23,42,0.72)",
    backdropFilter: "blur(6px)",
  },

  modal: {
    width: "min(620px, 100%)",
    maxHeight: "calc(100vh - 36px)",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "22px",
    borderRadius: "20px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-surface)",
    color: "var(--erp-text)",
    boxShadow:
      "0 30px 90px rgba(0,0,0,0.38)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    paddingBottom: "16px",
    borderBottom:
      "1px solid var(--erp-border)",
  },

  eyebrow: {
    margin: "0 0 5px",
    color: "#dc2626",
    fontSize: "11px",
    fontWeight: 900,
  },

  title: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: "26px",
  },

  subtitle: {
    margin: "7px 0 0",
    opacity: 0.7,
    wordBreak: "break-word",
  },

  closeButton: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    borderRadius: "999px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-input-bg)",
    color: "var(--erp-text)",
    cursor: "pointer",
    fontWeight: 900,
  },

  loadingBox: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    background:
      "var(--erp-input-bg)",
    fontWeight: 700,
  },

  errorBox: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "11px",
    border:
      "1px solid rgba(220,38,38,0.4)",
    background:
      "rgba(220,38,38,0.09)",
    color: "#dc2626",
  },

  eligibilityBox: {
    marginTop: "18px",
    padding: "15px",
    display: "grid",
    gap: "7px",
    borderRadius: "12px",
  },

  eligibleBox: {
    border:
      "1px solid rgba(22,163,74,0.4)",
    background:
      "rgba(22,163,74,0.09)",
    color: "#15803d",
  },

  ineligibleBox: {
    border:
      "1px solid rgba(220,38,38,0.4)",
    background:
      "rgba(220,38,38,0.09)",
    color: "#dc2626",
  },

  summaryGrid: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  summaryItem: {
    minWidth: 0,
    padding: "13px",
    display: "grid",
    gap: "5px",
    borderRadius: "11px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-input-bg)",
  },

  summaryLabel: {
    fontSize: "11px",
    opacity: 0.65,
  },

  formSection: {
    marginTop: "18px",
    display: "grid",
    gap: "9px",
  },

  label: {
    color: "var(--erp-heading)",
    fontWeight: 800,
  },

  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-input-bg)",
    color: "var(--erp-text)",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "10px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-input-bg)",
    color: "var(--erp-text)",
    resize: "vertical",
    fontFamily: "inherit",
  },

  actions: {
    marginTop: "22px",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  secondaryButton: {
    padding: "13px",
    borderRadius: "10px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-input-bg)",
    color: "var(--erp-text)",
    cursor: "pointer",
    fontWeight: 800,
  },

  dangerButton: {
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
};

export default CancelTicketModal;
