import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/api";
function Admin() {

  const navigate = useNavigate();
const [stats, setStats] = useState({
  total_buses: 0,
  total_drivers: 0,
  total_routes: 0,
  total_schedules: 0,
  total_passengers: 0,
  total_bookings: 0,
  total_tickets: 0,
  total_revenue: 0,
});

useEffect(() => {
  loadDashboard();
}, []);

const loadDashboard = async () => {
  try {
    const res = await api.get("/dashboard");

    setStats(res.data.dashboard);

  } catch (err) {
    console.error("Dashboard Error:", err);
  }
};
  const cardStyle = {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 6px 15px rgba(0,0,0,.12)",
    cursor: "pointer",
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "bold",
  };

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "20px",
      }}
    >

      <h1
        style={{
          textAlign: "center",
          color: "#e63946",
          marginBottom: "30px",
        }}
      >
        🚍 Rular Bus Admin Dashboard
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px",
        }}
      >

        <div
          style={cardStyle}
          onClick={() => navigate("/admin/buses")}
        >
          🚌
          <br /><br />
          Bus Management
        </div>

        <div
          style={cardStyle}
          onClick={() => navigate("/admin/routes")}
        >
          🛣
          <br /><br />
          Route Management
        </div>

        <div
          style={cardStyle}
          onClick={() => navigate("/admin/schedules")}
        >
          ⏰
          <br /><br />
          Schedule Management
        </div>

        <div
          style={cardStyle}
          onClick={() => navigate("/bookings")}
        >
          📚
          <br /><br />
          Booking History
        </div>
        <div
          style={cardStyle}
          onClick={() => navigate("/admin/passengers")}
        >
          👥
          <br /><br />
          Passenger Management
        </div>

        <div
          style={cardStyle}
          onClick={() => navigate("/admin/tickets")}
        >
          🎫
          <br /><br />
          Ticket Management
        </div>

        <div
          style={cardStyle}
          onClick={() => navigate("/admin/reports")}
        >
          📊
          <br /><br />
          Reports & Analytics
        </div>

        <div
          style={cardStyle}
          onClick={() => navigate("/")}
        >
          🏠
          <br /><br />
          Back To Home
        </div>

      </div>

      <div
        style={{
          marginTop: "40px",
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 6px 15px rgba(0,0,0,.12)",
        }}
      >
        <h2>Dashboard Status</h2>

        <p>🚌 Bus Management : Ready</p>
        <p>🛣 Route Management : Ready</p>
        <p>⏰ Schedule Management : Ready</p>
        <p>👥 Passenger Management : Ready</p>
        <p>📖 Booking History : Ready</p>
        <p>🎫 Ticket Module : Ready</p>
        <p>💳 Payment Module : Ready</p>
        <p>📊 Reports : Coming Soon</p>
      </div>

    </div>

  );
}

export default Admin;
