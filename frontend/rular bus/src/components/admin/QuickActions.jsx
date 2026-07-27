import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  const buttons = [
    { title: "Add Bus", icon: "🚌", color: "#0B3D91", path: "/admin/buses" },
    { title: "Add Route", icon: "🛣️", color: "#D62828", path: "/admin/routes" },
    { title: "Add Schedule", icon: "⏰", color: "#198754", path: "/admin/schedules" },
    { title: "Booking History", icon: "📚", color: "#6f42c1", path: "/bookings" },
    { title: "Passengers", icon: "👥", color: "#fd7e14", path: "/admin/passengers" },
    { title: "Reports", icon: "📊", color: "#20c997", path: "/admin/reports" },
  ];

  return (
    <section
      style={{
        background: "var(--erp-surface)",
        border: "1px solid var(--erp-border)",
        borderRadius: "var(--erp-radius-lg)",
        padding: 20,
        boxShadow: "var(--erp-shadow-sm)",
      }}
    >
      <h3
        style={{
          margin: "0 0 20px",
          color: "var(--erp-heading)",
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
            type="button"
            onClick={() => navigate(btn.path)}
            style={{
              padding: 16,
              border: "none",
              borderRadius: 14,
              background: btn.color,
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
              transition: "transform var(--erp-transition-fast)",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 28 }}>{btn.icon}</div>
            <div style={{ marginTop: 10 }}>{btn.title}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
