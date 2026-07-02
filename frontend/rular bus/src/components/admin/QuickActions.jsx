import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  const buttons = [
    {
      title: "Add Bus",
      icon: "🚌",
      color: "#0B3D91",
      path: "/admin/buses",
    },
    {
      title: "Add Route",
      icon: "🛣️",
      color: "#D62828",
      path: "/admin/routes",
    },
    {
      title: "Add Schedule",
      icon: "⏰",
      color: "#198754",
      path: "/admin/schedules",
    },
    {
      title: "Booking History",
      icon: "📚",
      color: "#6f42c1",
      path: "/bookings",
    },
    {
      title: "Passengers",
      icon: "👥",
      color: "#fd7e14",
      path: "/admin/passengers",
    },
    {
      title: "Reports",
      icon: "📊",
      color: "#20c997",
      path: "/admin/reports",
    },
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 20,
        boxShadow: "0 10px 20px rgba(0,0,0,.08)",
      }}
    >
      <h3
        style={{
          marginBottom: 20,
          color: "#1F2937",
        }}
      >
        ⚡ Quick Actions
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: 15,
        }}
      >
        {buttons.map((btn) => (
          <button
            key={btn.title}
            onClick={() => navigate(btn.path)}
            style={{
              padding: "16px",
              border: "none",
              borderRadius: 14,
              background: btn.color,
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: "bold",
              transition: ".2s",
            }}
          >
            <div style={{ fontSize: 28 }}>
              {btn.icon}
            </div>

            <div
              style={{
                marginTop: 10,
              }}
            >
              {btn.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
