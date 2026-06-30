import React from "react";

function JourneyCard({ booking }) {
  return (
    <>
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
    </>
  );
}

export default JourneyCard;

