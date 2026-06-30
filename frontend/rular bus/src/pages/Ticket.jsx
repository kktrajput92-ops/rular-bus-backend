import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
function Ticket() {

  const navigate = useNavigate();
  const location = useLocation();

  const { booking, payment } = location.state || {};

  if (!booking || !payment) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "22px",
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
        background: "#eef3f8",
        padding: "25px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 12px 35px rgba(0,0,0,.15)",
        }}
      >

        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >

          <h1
            style={{
              color: "#d62828",
              marginBottom: "8px",
            }}
          >
            🚌 Rular Bus
          </h1>

          <h2
            style={{
              color: "#16a34a",
              margin: 0,
            }}
          >
            Smart Digital Ticket
          </h2>

          <p
            style={{
              color: "#6b7280",
              marginTop: "10px",
            }}
          >
            Happy Journey ❤️
          </p>

        </div>

        <hr />

        <h3>👤 Passenger Information</h3>

        <p>
          <b>Name :</b> {booking.full_name || "Passenger"}
        </p>

        <p>
          <b>Booking ID :</b> {booking.id}
        </p>

        <p>
          <b>Seat Number :</b> {booking.seat_number}
        </p>

        <p>
          <b>Payment Status :</b>

          <span
            style={{
              color: "#16a34a",
              fontWeight: "bold",
            }}
          >
            {" "}Confirmed ✅
          </span>

        </p>

        <hr />

        <h3>🚌 Journey Details</h3>
        <p>
          <b>From :</b> {booking.source || "Gurugram"}
        </p>

        <p>
          <b>To :</b> {booking.destination || "Kannauj"}
        </p>

        <p>
          <b>Departure :</b>{" "}
          {booking.departure_time || "01 Jul 2026, 08:00 AM"}
        </p>

        <p>
          <b>Bus :</b>{" "}
          {booking.bus_name || "Rular Bus Service"}
        </p>

        <hr />

        <div
          style={{
            marginTop: "25px",
            padding: "20px",
            border: "2px dashed #16a34a",
            borderRadius: "15px",
            textAlign: "center",
            background: "#f0fdf4",
          }}
        >

          <h2
            style={{
              color: "#16a34a",
              marginBottom: "10px",
            }}
          >
            🔳 QR Ticket
          </h2>

         <div
  style={{
    background: "#ffffff",
    display: "inline-block",
    padding: "12px",
    borderRadius: "12px",
    border: "2px solid #d1d5db",
  }}
>
  <QRCodeSVG
    value={`RB-${booking.id}-${payment.id}`}
    size={170}
    level="H"
    includeMargin={true}
  />
</div>
<p
  style={{
    marginTop: "15px",
    fontSize: "15px",
    color: "#16a34a",
    fontWeight: "bold",
  }}
>
  Verification Code
</p>

<p
  style={{
    fontSize: "18px",
    fontWeight: "bold",
    letterSpacing: "2px",
    color: "#2563eb",
  }}
>
  RB-{booking.id}-{payment.id}
</p>

<p
  style={{
    marginTop: "12px",
    color: "#6b7280",
    fontSize: "14px",
  }}
>
  Scan this QR at boarding for quick verification.
</p>

          <p
            style={{
              marginTop: "12px",
              color: "#6b7280",
            }}
          >
            Scan this ticket during boarding.
          </p>

        </div>
        <hr />

        <div
          style={{
            marginTop: "25px",
            background: "#eff6ff",
            border: "1px solid #93c5fd",
            borderRadius: "12px",
            padding: "18px",
          }}
        >

          <h3
            style={{
              marginTop: 0,
              color: "#2563eb",
            }}
          >
            💳 Payment Details
          </h3>

          <p>
            <b>Payment ID :</b>{" "}
            {payment.id || "N/A"}
          </p>

          <p>
            <b>Method :</b>{" "}
            {payment.payment_method || "UPI"}
          </p>

          <p>
            <b>Amount :</b> ₹
            {payment.amount || 450}
          </p>

          <p>
            <b>Status :</b>

            <span
              style={{
                color: "#16a34a",
                fontWeight: "bold",
              }}
            >
              {" "}Paid ✅
            </span>

          </p>

        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "30px",
            flexWrap: "wrap",
          }}
        >

         <button
  onClick={() => alert("PDF Download Coming Soon 🚀")}
  style={{
    flex: 1,
    padding: "15px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    cursor: "pointer",
  }}
>
  📄 Download PDF
</button>

            <button
  onClick={() => alert("Share Feature Coming Soon 🚀")}
  style={{
    flex: 1,
    padding: "15px",
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    cursor: "pointer",
  }}
>
  📤 Share Ticket
</button>

          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%",
              padding: "15px",
              background: "#6b7280",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            🏠 Back to Home
          </button>

        </div>

      </div>

    </div>

  );

}

export default Ticket;
     
