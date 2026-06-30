import React from "react";

function TicketHeader() {
  return (
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

      <hr />
    </div>
  );
}

export default TicketHeader;
