import logo from "../assets/logo/rular-logo.png";
import { useNavigate } from "react-router-dom";
export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav
      style={{
        background: "#ffffff",
        padding: "12px 24px",
        borderRadius: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <img
          src={logo}
          alt="Rular Bus"
          style={{
            width: "60px",
            height: "60px",
            objectFit: "contain",
          }}
        />

        <div>
          <h2
            style={{
              margin: 0,
              color: "#0B3D91",
              fontSize: "22px",
            }}
          >
            Rular Bus
          </h2>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "13px",
            }}
          >
            India's Smart Bus Booking Platform
          </p>
        </div>
      </div>

      <button
  onClick={() => navigate("/login")}
  style={{
          background: "#0B3D91",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          padding: "10px 18px",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        Login
      </button>
    </nav>
  );
}
