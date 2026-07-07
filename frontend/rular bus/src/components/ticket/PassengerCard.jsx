import React from "react";

function PassengerCard({ booking }) {
const formatDate = (date) => {
  if (!date) return "--";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
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

       <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  }}
>
  <div>
    <h2
      style={{
        margin: 0,
        color: "#0B3D91",
      }}
    >
      {booking.full_name || "Passenger"}
    </h2>

    <p
      style={{
        marginTop: 6,
        color: "#6B7280",
      }}
    >
      Booking ID : #{booking.id}
    </p>
  </div>

  <div
    style={{
      background: "#16A34A",
      color: "#fff",
      padding: "8px 14px",
      borderRadius: "30px",
      fontWeight: "bold",
      fontSize: "13px",
      boxShadow: "0 6px 18px rgba(22,163,74,.25)",
    }}
  >
    ✔ VERIFIED
  </div>
</div>

<hr />

<p>
  <b>Seat Number :</b> {booking.seat_number}
</p>

<p>
  <b>Status :</b>{" "}
  <span
    style={{
      color: "#16A34A",
      fontWeight: "bold",
    }}
  >
    Confirmed ✅
  </span>
</p>
<hr />

<p>
  <b>Booking Date :</b> {formatDate(booking.created_at)}
</p>

<p>
  <b>Journey Date :</b> {formatDate(booking.departure_time)}
</p>
      
    </div>
  );
}

export default PassengerCard;
