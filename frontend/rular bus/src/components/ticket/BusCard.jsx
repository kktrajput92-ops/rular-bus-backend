export default function BusCard({ booking }) {

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
        🚌 Bus Details
      </h3>

      <p><b>Bus Name :</b> {booking.bus_name || "Rular Express"}</p>

      <p><b>Bus Number :</b> {booking.bus_number || "RB-001"}</p>

      <p><b>Seat :</b> {booking.seat_number}</p>

      <p><b>Bus Type :</b> AC Sleeper</p>
    </div>
  );
}
