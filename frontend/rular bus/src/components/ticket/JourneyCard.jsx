import React from "react";

function JourneyCard({ booking }) {
const formatDateTime = (date) => {
  if (!date) return "--";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const getDuration = () => {
  if (!booking.departure_time || !booking.arrival_time) {
    return "--";
  }

  const start = new Date(booking.departure_time);
  const end = new Date(booking.arrival_time);

  const diff = end - start;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(
    (diff % (1000 * 60 * 60)) / (1000 * 60)
  );

  return `${hours}h ${minutes}m`;
};
  return (
  <div
    style={{
      background: "#F8FAFC",
      border: "1px solid #E5E7EB",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
    }}
  >
    <h3
      style={{
        marginTop: 0,
        marginBottom: "20px",
        color: "#0B3D91",
      }}
    >
      🛣 Journey Timeline
    </h3>

    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#16A34A",
          }}
        />

        <div
          style={{
            width: 3,
            height: 80,
            background: "#CBD5E1",
          }}
        />

        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#DC2626",
          }}
        />
      </div>

      <div style={{ marginLeft: 15, flex: 1 }}>
        <h4 style={{ margin: 0 }}>
          {booking.source || "Source"}
        </h4>

        <p style={{ color: "#6B7280" }}>
          Departure
          <br />
          {formatDateTime(booking.departure_time)}
        </p>

        <div style={{ height: 18 }} />
<p
  style={{
    color: "#0B3D91",
    fontWeight: "bold",
    margin: "0 0 18px",
  }}
>
  ⏱ Duration : {getDuration()}
</p>

        <h4 style={{ margin: 0 }}>
          {booking.destination || "Destination"}
        </h4>

        <p style={{ color: "#6B7280" }}>
          Arrival
          <br />
          {formatDateTime(booking.arrival_time)}
        </p>
<div
  style={{
    display: "inline-block",
    marginTop: "10px",
    background: "#EAF2FF",
    color: "#0B3D91",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "13px",
  }}
>
  🚌 AC Sleeper
</div>
      </div>
    </div>
  </div>
);
}

export default JourneyCard;

