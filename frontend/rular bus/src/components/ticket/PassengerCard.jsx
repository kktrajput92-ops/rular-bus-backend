import React from "react";

function PassengerCard({ booking }) {
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
  👤 Passenger Information
</h3>

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
        <b>Payment Status :</b>{" "}
        <span
          style={{
            color: "#16a34a",
            fontWeight: "bold",
          }}
        >
          Confirmed ✅
        </span>
      </p>

      
    </div>
  );
}

export default PassengerCard;
