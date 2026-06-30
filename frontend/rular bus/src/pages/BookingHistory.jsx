import { useEffect, useState } from "react";
import api from "../api/api";

function BookingHistory() {

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {

    try {

      const res = await api.get("/tickets");

      setTickets(res.data.tickets);

    } catch (err) {

      console.error(err);

      alert("Failed to load bookings");

    } finally {

      setLoading(false);

    }

  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "100px",
          fontSize: "22px",
        }}
      >
        Loading Bookings...
      </div>
    );
  }

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "20px",
      }}
    >

      <h1
        style={{
          textAlign: "center",
          color: "#e63946",
        }}
      >
        📚 Booking History
      </h1>

      {tickets.length === 0 ? (

        <h3
          style={{
            textAlign: "center",
            marginTop: "60px",
          }}
        >
          No Booking Found
        </h3>

      ) : (

        tickets.map((ticket) => (

          <div
            key={ticket.id}
            style={{
              background: "#fff",
              padding: "18px",
              marginBottom: "20px",
              borderRadius: "12px",
              boxShadow: "0 6px 18px rgba(0,0,0,.12)",
            }}
          >

            <h3>{ticket.ticket_number}</h3>

            <p>
              <b>Passenger :</b> {ticket.full_name}
            </p>

            <p>
              <b>Phone :</b> {ticket.phone}
            </p>

            <p>
              <b>Route :</b>{" "}
              {ticket.source} → {ticket.destination}
            </p>

            <p>
              <b>Seat :</b> {ticket.seat_number}
            </p>

            <p>
              <b>Status :</b> {ticket.booking_status}
            </p>

            <p>
              <b>Departure :</b>{" "}
              {new Date(
                ticket.departure_time
              ).toLocaleString()}
            </p>

            <button
              onClick={() =>
                window.open(
                  api.defaults.baseURL +
                    "/tickets/pdf/" +
                    ticket.ticket_number,
                  "_blank"
                )
              }
              style={{
                width: "100%",
                marginTop: "15px",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              📄 Download Ticket
            </button>

          </div>

        ))

      )}

    </div>

  );

}

export default BookingHistory;
