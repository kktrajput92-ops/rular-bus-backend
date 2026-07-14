import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import { COLORS } from "../theme/colors";
import SearchBar from "../components/SearchBar";
export default function ConductorDashboard() {
  const [stats, setStats] = useState({
    totalPassengers: 0,
    boarded: 0,
    remaining: 0,
  });
const [passengers, setPassengers] = useState([]);
const [search, setSearch] = useState("");
const navigate = useNavigate();
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/tickets/conductor-dashboard"
    );

    setStats(res.data);
const passengerRes = await axios.get(
 "http://localhost:5000/api/conductor/passengers"
);

setPassengers(passengerRes.data.passengers);
  };

  return (
    <div
      style={{
        background: "#f5f7fb",
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        🚌 Rular Bus
      </h1>

      <h3 style={{ textAlign: "center", color: "#666" }}>
        Conductor Dashboard
      </h3>
<SearchBar
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="🔍 Search by Name, Seat or Ticket..."
/>

      <div
        style={{
          display: "grid",
          gap: 15,
          marginTop: 30,
        }}
      >
    <StatCard
  title="Total Passengers"
  value={stats.totalPassengers}
  color={COLORS.primary}
/>

<StatCard
  title="Boarded"
  value={stats.boarded}
  color={COLORS.success}
/>

<StatCard
  title="Remaining"
  value={stats.remaining}
  color={COLORS.danger}
/>
      </div>
<div
  style={{
    background: "#fff",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,.1)",
  }}
>
  <h2>🚌 Current Trip</h2>

  <p><b>Bus :</b> Rular Bus</p>
  <p><b>Bus No :</b> HR26CP5784</p>
  <p><b>Route :</b> Gurugram → Kannauj</p>
  <p><b>Departure :</b> 08:00 PM</p>

  <p>
    <b>Status :</b>
    <span style={{ color: "green", fontWeight: "bold" }}>
      Running
    </span>
  </p>

  <hr />

  <h3>Boarding Progress</h3>

  <progress
    value={stats.boarded}
    max={stats.totalPassengers}
    style={{
      width: "100%",
      height: 20,
    }}
  />

  <p>
    {stats.boarded} / {stats.totalPassengers} Boarded
  </p>
</div>
      <button
        onClick={loadDashboard}
        style={{
          width: "100%",
          marginTop: 25,
          padding: 15,
          fontSize: 18,
          background: "#111827",
          color: "#fff",
          border: "none",
          borderRadius: 12,
        }}
      >
        🔄 Refresh Dashboard
      </button>
<div
  style={{
    marginTop: 25,
    background: "#fff",
    borderRadius: 15,
    padding: 15,
    boxShadow: "0 2px 10px rgba(0,0,0,.1)",
  }}
>
  <h2>🪑 Passenger List</h2>

  {passengers
  .filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      String(p.seat_number).includes(search)
  )
  .map((p) => (
   <div
  key={p.ticket_number}
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f9fafb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "#2563eb",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: 20,
      }}
    >
      {p.full_name.charAt(0).toUpperCase()}
    </div>

    <div>
      <div style={{ fontWeight: "bold", fontSize: 16 }}>
        {p.full_name}
      </div>

      <div style={{ color: "#666", fontSize: 13 }}>
        🎫 {p.ticket_number}
      </div>

      <div style={{ color: "#2563eb", fontWeight: "bold" }}>
        💺 Seat {p.seat_number}
      </div>
    </div>

  </div>

  <div
    style={{
      background: p.boarded ? "#dcfce7" : "#fff7ed",
      color: p.boarded ? "#15803d" : "#ea580c",
      padding: "8px 12px",
      borderRadius: 30,
      fontWeight: "bold",
      fontSize: 13,
    }}
  >
    {p.boarded ? "Boarded" : "Pending"}
  </div>
</div>
  ))}
</div>
<button
  onClick={() => navigate("/qr-scanner")}
  style={{
    position: "fixed",
    right: 20,
    bottom: 20,
    width: 65,
    height: 65,
    borderRadius: "50%",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: 28,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
    zIndex: 999,
  }}
>
  📷
</button>
    </div>
  );
}
