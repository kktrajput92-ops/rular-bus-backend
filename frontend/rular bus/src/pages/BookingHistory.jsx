import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import customerApi from "../api/customerApi";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import ThemeToggle from "../theme/ThemeToggle";
import CancelTicketModal from "../components/customer/CancelTicketModal";

function BookingHistory() {
  const navigate = useNavigate();

  const {
    customer,
    logout,
  } = useCustomerAuth();

  const [tickets, setTickets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    cancelTicket,
    setCancelTicket,
  ] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customerApi.get(
        "/customer-auth/bookings"
      );

      setTickets(
        Array.isArray(response.data?.tickets)
          ? response.data.tickets
          : []
      );
    } catch (requestError) {
      if (
        requestError.response?.status === 401
      ) {
        await logout();

        navigate(
          "/customer/login",
          {
            replace: true,
            state: {
              from: "/bookings",
            },
          }
        );

        return;
      }

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "बुकिंग लोड नहीं हो पाई"
      );
    } finally {
      setLoading(false);
    }
  };

  const openPremiumTicket = (ticket) => {
    const paymentFromApi =
      ticket?.payment &&
      typeof ticket.payment === "object"
        ? ticket.payment
        : {};

    const booking = {
      ...ticket,

      id:
        ticket.booking_id ||
        ticket.id,

      booking_id:
        ticket.booking_id,

      ticket_number:
        ticket.ticket_number,

      full_name:
        ticket.full_name ||
        customer?.full_name ||
        "Passenger",

      phone:
        ticket.phone ||
        ticket.contact_phone ||
        customer?.phone ||
        null,

      email:
        ticket.email ||
        ticket.contact_email ||
        customer?.email ||
        null,

      source:
        ticket.source ||
        ticket.boarding_stop_name ||
        "Source",

      destination:
        ticket.destination ||
        ticket.dropping_stop_name ||
        "Destination",

      seat_number:
        ticket.seat_number,

      booking_status:
        ticket.booking_status,

      created_at:
        ticket.booking_created_at ||
        ticket.issued_at,

      departure_time:
        ticket.departure_time,

      arrival_time:
        ticket.arrival_time,

      fare_amount:
        ticket.fare_amount,

      amount:
        ticket.fare_amount,

      currency_code:
        ticket.currency_code ||
        "INR",

      passengers: [
        {
          id:
            ticket.passenger_id ||
            null,

          full_name:
            ticket.full_name ||
            customer?.full_name ||
            "Passenger",

          phone:
            ticket.phone ||
            ticket.contact_phone ||
            customer?.phone ||
            null,

          email:
            ticket.email ||
            ticket.contact_email ||
            customer?.email ||
            null,

          gender:
            ticket.gender ||
            null,

          age:
            ticket.age ||
            null,

          passenger_category:
            ticket.passenger_category ||
            null,

          seat_number:
            ticket.seat_number,

          fare_amount:
            ticket.fare_amount,
        },
      ],
    };

    const payment = {
      ...paymentFromApi,

      id:
        paymentFromApi.id ||
        paymentFromApi.payment_id ||
        null,

      booking_id:
        ticket.booking_id,

      amount:
        paymentFromApi.amount ??
        paymentFromApi.payment_amount ??
        ticket.fare_amount ??
        0,

      payment_method:
        paymentFromApi.payment_method ||
        paymentFromApi.method ||
        "ONLINE",

      payment_status:
        paymentFromApi.payment_status ||
        paymentFromApi.status ||
        "SUCCESS",

      status:
        paymentFromApi.status ||
        paymentFromApi.payment_status ||
        "SUCCESS",

      transaction_id:
        paymentFromApi.transaction_id ||
        paymentFromApi.reference_number ||
        null,
    };

    navigate(
      "/ticket",
      {
        state: {
          booking,
          payment,
          from: "/bookings",
        },
      }
    );
  };

  const formatDate = (value) => {
    if (!value) {
      return "उपलब्ध नहीं";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString(
      "hi-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const formatFare = (
    amount,
    currency = "INR"
  ) => {
    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(numericAmount)
    ) {
      return "उपलब्ध नहीं";
    }

    try {
      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency:
            currency || "INR",
        }
      ).format(numericAmount);
    } catch {
      return `₹${numericAmount.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <div style={styles.centerPage}>
        <ThemeToggle />

        <div style={styles.loadingCard}>
          <div style={styles.spinner}>
            🚌
          </div>

          <h2 style={styles.loadingTitle}>
            आपकी बुकिंग लोड हो रही हैं...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={styles.backButton}
        >
          ← होम
        </button>

        <div style={styles.headerCopy}>
          <p style={styles.eyebrow}>
            यात्री अकाउंट
          </p>

          <h1 style={styles.title}>
            🎫 मेरी बुकिंग
          </h1>

          <p style={styles.subtitle}>
            {customer?.full_name
              ? `${customer.full_name}, आपकी सभी टिकट यहाँ दिखाई देंगी।`
              : "आपकी सभी टिकट यहाँ दिखाई देंगी।"}
          </p>
        </div>

        <ThemeToggle />
      </header>

      {error && (
        <div style={styles.error}>
          <span>{error}</span>

          <button
            type="button"
            onClick={loadBookings}
            style={styles.retryButton}
          >
            दोबारा कोशिश करें
          </button>
        </div>
      )}

      {!error &&
        tickets.length === 0 && (
          <section style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              🎟️
            </div>

            <h2 style={styles.emptyTitle}>
              अभी कोई बुकिंग नहीं मिली
            </h2>

            <p style={styles.emptyText}>
              इसी अकाउंट के मोबाइल नंबर से की गई
              बुकिंग यहाँ दिखाई देगी।
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              style={styles.primaryButton}
            >
              नई यात्रा खोजें
            </button>
          </section>
        )}

      <main style={styles.grid}>
        {tickets.map((ticket) => {

          const isCancelled =
              String(
                ticket.booking_status ||
                  ""
              ).toLowerCase() ===
                "cancelled" ||
              String(
                ticket.ticket_status ||
                  ""
              ).toUpperCase() ===
                "CANCELLED";

            return (
            <article
              key={
                ticket.id ||
                ticket.ticket_number
              }
              style={styles.ticketCard}
            >
              <div style={styles.ticketTop}>
                <div>
                  <p style={styles.ticketLabel}>
                    टिकट नंबर
                  </p>

                  <h2 style={styles.ticketNumber}>
                    {ticket.ticket_number}
                  </h2>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    ...(isCancelled
                      ? styles.cancelledBadge
                      : String(
                          ticket.booking_status
                        ).toLowerCase() ===
                        "confirmed"
                      ? styles.confirmedBadge
                      : {}),
                  }}
                >
                  {ticket.booking_status ||
                    "बुक किया गया"}
                </span>
              </div>

              <div style={styles.routeBox}>
                <div style={styles.routePlace}>
                  <span style={styles.routeIcon}>
                    📍
                  </span>

                  <div>
                    <p style={styles.smallLabel}>
                      कहाँ से
                    </p>

                    <strong>
                      {ticket.source ||
                        ticket.boarding_stop_name ||
                        "उपलब्ध नहीं"}
                    </strong>
                  </div>
                </div>

                <div style={styles.routeArrow}>
                  ─────→
                </div>

                <div style={styles.routePlace}>
                  <span style={styles.routeIcon}>
                    🏠
                  </span>

                  <div>
                    <p style={styles.smallLabel}>
                      कहाँ तक
                    </p>

                    <strong>
                      {ticket.destination ||
                        ticket.dropping_stop_name ||
                        "उपलब्ध नहीं"}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={styles.detailsGrid}>
                <Detail
                  label="यात्री"
                  value={
                    ticket.full_name ||
                    customer?.full_name
                  }
                />

                <Detail
                  label="मोबाइल"
                  value={
                    ticket.phone ||
                    ticket.contact_phone ||
                    customer?.phone
                  }
                />

                <Detail
                  label="सीट"
                  value={
                    ticket.seat_number ||
                    "उपलब्ध नहीं"
                  }
                />

                <Detail
                  label="प्रस्थान"
                  value={formatDate(
                    ticket.departure_time
                  )}
                />

                <Detail
                  label="किराया"
                  value={formatFare(
                    ticket.fare_amount,
                    ticket.currency_code
                  )}
                />

                <Detail
                  label="बुकिंग तारीख"
                  value={formatDate(
                    ticket.booking_created_at
                  )}
                />
              </div>

              {isCancelled && (
                <section style={styles.cancellationBox}>
                  <div style={styles.cancellationHeader}>
                    <div>
                      <p style={styles.cancellationEyebrow}>
                        CANCELLATION & REFUND
                      </p>

                      <h3 style={styles.cancellationTitle}>
                        Ticket cancelled
                      </h3>
                    </div>

                    <span style={styles.refundStatusBadge}>
                      {ticket.refund_status ||
                        "NOT REQUIRED"}
                    </span>
                  </div>

                  <div style={styles.cancellationGrid}>
                    <Detail
                      label="Cancellation ID"
                      value={
                        ticket.cancellation_number ||
                        "उपलब्ध नहीं"
                      }
                    />

                    <Detail
                      label="Refund ID"
                      value={
                        ticket.refund_number ||
                        "उपलब्ध नहीं"
                      }
                    />

                    <Detail
                      label="Refund amount"
                      value={formatFare(
                        ticket.refund_amount ??
                          ticket.refundable_amount ??
                          0,
                        ticket.refund_currency_code ||
                          ticket.currency_code ||
                          "INR"
                      )}
                    />

                    <Detail
                      label="Cancellation charge"
                      value={formatFare(
                        ticket.cancellation_charge ?? 0,
                        ticket.cancellation_currency_code ||
                          ticket.currency_code ||
                          "INR"
                      )}
                    />

                    <Detail
                      label="Refund percentage"
                      value={`${Number(
                        ticket.refund_percentage || 0
                      )}%`}
                    />

                    <Detail
                      label="Cancelled on"
                      value={formatDate(
                        ticket.booking_cancelled_at ||
                          ticket.ticket_cancelled_at ||
                          ticket.cancellation_created_at
                      )}
                    />
                  </div>

                  {ticket.reason_text && (
                    <p style={styles.cancellationReason}>
                      <strong>Reason:</strong>{" "}
                      {ticket.reason_text}
                    </p>
                  )}
                </section>
              )}

              <div
                style={styles.actionGroup}
              >
                  <button
                    type="button"
                    disabled={isCancelled}
                    onClick={() =>
                      openPremiumTicket(ticket)
                    }
                    style={{
                      ...styles.downloadButton,
                      marginTop: 0,
                      opacity: isCancelled
                        ? 0.55
                        : 1,
                      cursor: isCancelled
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {isCancelled
                      ? "🚫 Ticket cancelled"
                      : "🎫 Premium टिकट खोलें"}
                  </button>

                  {!isCancelled && (
                    <button
                      type="button"
                      onClick={() =>
                        setCancelTicket(ticket)
                      }
                      style={
                        styles.cancelTicketButton
                      }
                    >
                      ✕ Cancel Ticket
                    </button>
                  )}
                </div>
            </article>
          );
        })}
      </main>

        {cancelTicket && (
          <CancelTicketModal
            ticket={cancelTicket}
            onClose={() =>
              setCancelTicket(null)
            }
            onCancelled={async () => {
              setCancelTicket(null);
              await loadBookings();
            }}
          />
        )}
    </div>
  );
}

function Detail({
  label,
  value,
}) {
  return (
    <div style={styles.detailItem}>
      <p style={styles.smallLabel}>
        {label}
      </p>

      <strong style={styles.detailValue}>
        {value || "उपलब्ध नहीं"}
      </strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    boxSizing: "border-box",
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
  },

  centerPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    boxSizing: "border-box",
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
  },

  loadingCard: {
    width: "min(420px, 100%)",
    padding: "30px",
    textAlign: "center",
    borderRadius: "18px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-surface)",
    boxShadow:
      "var(--erp-shadow-lg)",
  },

  spinner: {
    fontSize: "42px",
  },

  loadingTitle: {
    marginBottom: 0,
    color: "var(--erp-heading)",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns:
      "auto 1fr auto",
    gap: "16px",
    alignItems: "start",
    padding: "18px",
    borderRadius: "16px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-surface)",
    boxShadow:
      "var(--erp-shadow)",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "var(--erp-text)",
    cursor: "pointer",
    fontWeight: 800,
    padding: "8px",
  },

  headerCopy: {
    minWidth: 0,
  },

  eyebrow: {
    margin: "0 0 4px",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 800,
  },

  title: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: "clamp(25px, 5vw, 38px)",
  },

  subtitle: {
    margin: "8px 0 0",
    lineHeight: 1.6,
    opacity: 0.72,
  },

  error: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    padding: "14px",
    display: "flex",
    gap: "12px",
    justifyContent:
      "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    borderRadius: "12px",
    border: "1px solid #dc2626",
    color: "#dc2626",
    background:
      "rgba(220,38,38,0.08)",
  },

  retryButton: {
    padding: "9px 14px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  emptyCard: {
    maxWidth: "560px",
    margin: "60px auto",
    padding: "36px 24px",
    textAlign: "center",
    borderRadius: "20px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-surface)",
    boxShadow:
      "var(--erp-shadow-lg)",
  },

  emptyIcon: {
    fontSize: "50px",
  },

  emptyTitle: {
    color: "var(--erp-heading)",
  },

  emptyText: {
    lineHeight: 1.7,
    opacity: 0.72,
  },

  primaryButton: {
    padding: "13px 20px",
    marginTop: "10px",
    border: "none",
    borderRadius: "10px",
    background: "#0B5ED7",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  grid: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
    gap: "20px",
  },

  ticketCard: {
    padding: "20px",
    borderRadius: "18px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-surface)",
    boxShadow:
      "var(--erp-shadow-lg)",
  },

  ticketTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "12px",
    borderBottom:
      "1px dashed var(--erp-border)",
    paddingBottom: "16px",
  },

  ticketLabel: {
    margin: 0,
    fontSize: "12px",
    opacity: 0.65,
  },

  ticketNumber: {
    margin: "4px 0 0",
    color: "var(--erp-heading)",
    fontSize: "20px",
    wordBreak: "break-word",
  },

  statusBadge: {
    padding: "7px 10px",
    borderRadius: "999px",
    background:
      "rgba(37,99,235,0.1)",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "capitalize",
  },

  confirmedBadge: {
    background:
      "rgba(22,163,74,0.12)",
    color: "#15803d",
  },

  cancelledBadge: {
    background:
      "rgba(220,38,38,0.12)",
    color: "#dc2626",
  },

  routeBox: {
    margin: "18px 0",
    padding: "15px",
    display: "grid",
    gridTemplateColumns:
      "1fr auto 1fr",
    gap: "10px",
    alignItems: "center",
    borderRadius: "14px",
    background:
      "var(--erp-input-bg)",
  },

  routePlace: {
    minWidth: 0,
    display: "flex",
    gap: "9px",
    alignItems: "center",
  },

  routeIcon: {
    fontSize: "20px",
  },

  routeArrow: {
    color: "#2563eb",
    fontWeight: 800,
  },

  smallLabel: {
    margin: "0 0 4px",
    fontSize: "11px",
    opacity: 0.62,
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  detailItem: {
    padding: "12px",
    borderRadius: "12px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-input-bg)",
    minWidth: 0,
  },

  detailValue: {
    display: "block",
    wordBreak: "break-word",
    fontSize: "14px",
  },

  downloadButton: {
    width: "100%",
    marginTop: "18px",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #2563eb, #0b5ed7)",
    color: "#fff",
    fontWeight: 800,
  },

  cancellationBox: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "14px",
    border:
      "1px solid rgba(220,38,38,0.3)",
    background:
      "rgba(220,38,38,0.06)",
  },

  cancellationHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
  },

  cancellationEyebrow: {
    margin: "0 0 4px",
    color: "#dc2626",
    fontSize: "11px",
    fontWeight: 900,
  },

  cancellationTitle: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: "18px",
  },

  refundStatusBadge: {
    padding: "7px 10px",
    borderRadius: "999px",
    background:
      "rgba(245,158,11,0.14)",
    color: "#b45309",
    fontSize: "11px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  cancellationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  cancellationReason: {
    margin: "12px 0 0",
    paddingTop: "12px",
    borderTop:
      "1px dashed rgba(220,38,38,0.3)",
    lineHeight: 1.6,
    fontSize: "13px",
  },

  actionGroup: {
    marginTop: "18px",
    display: "grid",
    gap: "10px",
  },

    cancelTicketButton: {
      width: "100%",
      padding: "13px",
      borderRadius: "10px",
      border:
        "1px solid rgba(220,38,38,0.55)",
      background:
        "rgba(220,38,38,0.08)",
      color: "#dc2626",
      fontWeight: 800,
      cursor: "pointer",
    },
};

export default BookingHistory;
