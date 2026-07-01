export default function BusCard({ bus, onSelect }) {
const departure = new Date(bus.departure_time);
const arrival = new Date(bus.arrival_time);

const durationMs = arrival - departure;

const hours = Math.floor(durationMs / (1000 * 60 * 60));
const minutes = Math.floor(
  (durationMs % (1000 * 60 * 60)) / (1000 * 60)
);
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

   <p
  style={{
    fontSize: "17px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "8px 0",
  }}
>
  📍 {bus.source} ➜ {bus.destination}
</p>

      <p>🚌 {bus.bus_number}</p>

     <p
  style={{
    display: "inline-block",
    background: "#e8f5e9",
    color: "#2e7d32",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
    margin: "8px 0",
  }}
>
  💺 {bus.available_seats} Seats Left
</p>
<div
  style={{
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  }}
>
  <span
    style={{
      background: "#e3f2fd",
      color: "#1565c0",
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "bold",
    }}
  >
    ❄️ AC
  </span>

  <span
    style={{
      background: "#e8f5e9",
      color: "#2e7d32",
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "bold",
    }}
  >
    📶 WiFi
  </span>

  <span
    style={{
      background: "#fff3e0",
      color: "#ef6c00",
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "bold",
    }}
  >
    🔌 Charging
  </span>
</div>
      <p>
  🕒{" "}
  {new Date(bus.departure_time).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}

  {" ➜ "}

  {new Date(bus.arrival_time).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}

  {" • "}

  📅{" "}
  {new Date(bus.departure_time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}
</p>
      <p
  style={{
    color: "#666",
    fontWeight: "600",
    margin: "8px 0",
  }}
>
  ⏱️ {hours}h {minutes}m
</p>

      <button
        onClick={onSelect}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: "15px",
         background: "linear-gradient(90deg,#0B3D91,#1565C0)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
       🎟️ Select Seats
      </button>
    </div>
  );
}
