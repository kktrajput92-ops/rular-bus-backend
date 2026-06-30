import React from "react";
import { QRCodeSVG } from "qrcode.react";

function QRSection({ booking, payment }) {
  return (
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
        🔳 Smart QR Ticket
      </h2>

      <div
        style={{
          background: "#fff",
          display: "inline-block",
          padding: "12px",
          borderRadius: "12px",
        }}
      >
        <QRCodeSVG
          value={`RB-${booking.id}-${payment.id}`}
          size={170}
          includeMargin={true}
        />
      </div>

      <p
        style={{
          marginTop: "15px",
          fontWeight: "bold",
          color: "#2563eb",
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
        RB-{booking.id}-{payment.id}
      </p>

      <p
        style={{
          color: "#6b7280",
          marginTop: "10px",
        }}
      >
        Scan this QR during boarding.
      </p>
    </div>
  );
}

export default QRSection;
