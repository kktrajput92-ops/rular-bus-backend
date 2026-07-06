import React from "react";

function JourneyCard({ booking }) {
  return (
    <div
  style={{
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "20px",
  }}
>
      <h3
  style={{
    marginTop: 0,
    color: "#0B3D91",
  }}
>
  🚌 Journey Details
</h3>

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

      
  </div>
  );
}

export default JourneyCard;

