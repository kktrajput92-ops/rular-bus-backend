import React from "react";

function TicketHeader() {
  return (
    <div
    style={{
  textAlign: "center",
  marginBottom: "30px",
  paddingBottom: "20px",
  borderBottom: "2px dashed #dbe4ee",
}}
    >
      <h1
        style={{
          color: "#0B3D91",
          marginBottom: "8px",
        }}
      >
        🚌 Rular Bus
      </h1>

      <h2
        style={{
          color: "#198754",
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
       Thank you for choosing Rular Bus
      </p>

     
    </div>
  );
}

export default TicketHeader;
