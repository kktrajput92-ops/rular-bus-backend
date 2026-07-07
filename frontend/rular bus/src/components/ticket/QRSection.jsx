import React from "react";
import { QRCodeSVG } from "qrcode.react";

function QRSection({ booking, payment }) {
  return (
    <div
      style={{
        marginTop: "25px",
marginTop: "20px",
padding: "20px",
border: "1px solid #E5E7EB",
borderRadius: "12px",
textAlign: "center",
background: "#F8FAFC",
      }}
    >
      <h2
        style={{
          color: "#0B3D91",
          marginBottom: "10px",
        }}
      >
        🔳 Smart QR Ticket
      </h2>

      <div
        style={{
          background: "#FFFFFF",
border: "1px solid #E5E7EB",
          display: "inline-block",
          padding: "12px",
          borderRadius: "12px",
        }}
      >
        <QRCodeSVG
  value={JSON.stringify({
    ticket_number: booking.ticket_number,
    booking_id: booking.id,
  })}
  size={170}
  includeMargin={true}
/>
      </div>

      <p
        style={{
          marginTop: "15px",
          fontWeight: "bold",
          color: "#0B3D91",
        }}
      >
        Verification Code
      </p>

      <p
        style={{
          fontSize: "18px",
          letterSpacing: "2px",
          fontWeight: "bold",
        }}
      >
        {booking.ticket_number}
      </p>

      <p
        style={{
          color: "#6b7280",
          marginTop: "10px",
        }}
      >
        Scan this QR Code while boarding the bus.
      </p>
    </div>
  );
}

export default QRSection;
