import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";

function Ticket() {

  const navigate = useNavigate();
  const location = useLocation();

  const { booking } = location.state || {};

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    createTicket();

  }, []);

  const createTicket = async () => {

    try {

      const res = await api.post("/tickets", {
        booking_id: booking.id,
      });

      setTicket(res.data.ticket);

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Ticket Generation Failed"
      );

    } finally {

      setLoading(false);

    }

  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "120px",
          fontSize: "22px",
        }}
      >
        Generating Ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "120px",
        }}
      >
        Ticket Not Found
      </div>
    );
  }

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >

      <div
        style={{
          width: "95%",
          maxWidth: "550px",
          background: "#fff",
          borderRadius: "15px",
          padding: "25px",
          boxShadow: "0 10px 30px rgba(0,0,0,.15)",
        }}
      >

        <h1
          style={{
            textAlign: "center",
            color: "#16a34a",
          }}
        >
          🎫 Rular Bus E-Ticket
        </h1>

        <hr />

        <p>
          <b>Ticket Number :</b> {ticket.ticket_number}
        </p>

        <p>
          <b>Booking ID :</b> {booking.id}
        </p>

        <p>
          <b>Seat :</b> {booking.seat_number}
        </p>
        <p>
          <b>Payment Status :</b> Paid
        </p>

        <hr />

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          <h3>QR Code</h3>

          <img
            src={ticket.qr_code}
            alt="QR Code"
            style={{
              width: "180px",
              height: "180px",
              border: "1px solid #ddd",
              borderRadius: "10px",
            }}
          />
        </div>

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
            marginTop: "25px",
            padding: "14px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          📄 Download PDF Ticket
        </button>

        <button
          onClick={() => window.print()}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "14px",
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          🖨 Print Ticket
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "14px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          🏠 Back to Home
        </button>

      </div>

    </div>

  );
}

export default Ticket;

