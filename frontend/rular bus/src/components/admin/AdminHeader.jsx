import { useNavigate } from "react-router-dom";
import { useTheme } from "../../theme/ThemeProvider";

export default function AdminHeader() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      style={{
        background: "var(--erp-surface)",
        border: "1px solid var(--erp-border)",
        borderRadius: "18px",
        padding: "18px 24px",
        marginBottom: 24,
        boxShadow: "var(--erp-shadow-sm)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: "var(--erp-heading)",
          }}
        >
          👋 Welcome Admin
        </h2>

        <div
          style={{
            marginTop: 6,
            color: "var(--erp-text-secondary)",
            fontSize: 14,
          }}
        >
          {today}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            border: "1px solid var(--erp-border)",
            background: "var(--erp-surface-muted)",
            color: "var(--erp-text)",
            borderRadius: 12,
            padding: "10px 14px",
            cursor: "pointer",
          }}
        >
          {theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>

        <button
          style={{
            border: "1px solid var(--erp-border)",
            background: "var(--erp-surface-muted)",
            borderRadius: 12,
            padding: "10px 14px",
            cursor: "pointer",
          }}
        >
          🔔
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 10px",
            border: "1px solid var(--erp-border)",
            borderRadius: 14,
            background: "var(--erp-surface-muted)",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "var(--erp-primary)",
              color: "#fff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: 700,
            }}
          >
            A
          </div>

          <div>
            <div
              style={{
                fontWeight: 700,
                color: "var(--erp-heading)",
              }}
            >
              Administrator
            </div>

            <div
              style={{
                fontSize: 13,
                color: "var(--erp-text-secondary)",
              }}
            >
              Super Admin
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            background: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
