export default function BusCard({ bus, onSelect }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 8px 20px rgba(0,0,0,.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: 0 }}>{bus.bus_name}</h3>

        <span
          style={{
            background: "#e8f5e9",
            color: "#2e7d32",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          ⭐ 4.8
        </span>
      </div>

      <p>📍 {bus.source} → {bus.destination}</p>

      <p>🚌 {bus.bus_number}</p>

      <p>💺 {bus.available_seats} Seats Available</p>

      <p>
        🕒 {new Date(bus.departure_time).toLocaleString()}
      </p>

      <button
        onClick={onSelect}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: "15px",
          background: "#0B3D91",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Select Seats →
      </button>
    </div>
  );
}
