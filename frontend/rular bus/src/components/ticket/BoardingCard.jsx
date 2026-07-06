export default function BoardingCard({ booking }) {
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
        {booking.departure_time || "06:00 AM"}
      </p>

      <p>
        <b>Dropping Point :</b>{" "}
        {booking.destination || "Destination"}
      </p>

      <p>
        <b>Estimated Arrival :</b>{" "}
        {booking.arrival_time || "02:00 PM"}
      </p>
    </div>
  );
}
