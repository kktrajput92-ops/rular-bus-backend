import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../api/api";

export default function QRScanner() {
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
        rememberLastUsedCamera: true,
      },
      false
    );
    scanner.render(

      async (decodedText) => {

        try {

          scanner.clear();

          const data = JSON.parse(decodedText);

          const res = await api.get(
            `/tickets/verify/${data.ticket_number}`
          );

          setTicket(res.data.ticket);

        } catch (err) {

          alert(
            err.response?.data?.message ||
            err.message
          );

        }

      },

      (error) => {
        // Ignore scan errors
      }

    );

    return () => {
      scanner.clear().catch(() => {});
    };

  }, []);

  const boardPassenger = async () => {
    try {

      const res = await api.post(
        `/tickets/board/${ticket.ticket_number}`
      );

      setMessage(res.data.message);

    } catch (err) {

      setMessage(
        err.response?.data?.message ||
        "Boarding Failed"
      );

    }

  };
  return (
    <div style={{ padding: 20 }}>

      <h2>🚌 Conductor QR Scanner</h2>

      <div
        id="reader"
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "20px auto",
        }}
      />

      {ticket && (

        <div
          style={{
            marginTop: 20,
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 15,
          }}
        >

          <h3>{ticket.full_name}</h3>

          <p>
            <b>Ticket:</b> {ticket.ticket_number}
          </p>

          <p>
            <b>Route:</b> {ticket.source} → {ticket.destination}
          </p>

          <p>
            <b>Seat:</b> {ticket.seat_number}
          </p>

          <button
            onClick={boardPassenger}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ✅ Board Passenger
          </button>

        </div>

      )}

      {message && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 8,
            background: "#f3f4f6",
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      )}

    </div>
  );
}


