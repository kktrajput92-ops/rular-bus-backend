import React from "react";

function PassengerCard({ booking }) {
  return (
    <>
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

      <hr />
    </>
  );
}

export default PassengerCard;
