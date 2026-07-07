export default function BoardingCard({ booking }) {
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
  return (
    <div
      style={{
        marginTop: 20,
        background: "#ffffff",
        borderRadius: 18,
        padding: 20,
        boxShadow: "0 8px 20px rgba(0,0,0,.08)",
      }}
    >
      <h3 style={{ color: "#0B3D91", marginBottom: 15 }}>
        📍 Boarding Details
      </h3>

      <p>
        <b>Boarding Point :</b>{" "}
        {booking.source || "Main Bus Stand"}
      </p>

      <p>
        <b>Reporting Time :</b> 30 Minutes Before Departure
      </p>

      <p>
        <b>Departure :</b>{" "}
        {formatDateTime(booking.departure_time)}
      </p>

      <p>
        <b>Dropping Point :</b>{" "}
        {booking.destination || "Destination"}
      </p>

      <p>
        <b>Estimated Arrival :</b>{" "}
        {formatDateTime(booking.arrival_time)}
      </p>
    </div>
  );
}
