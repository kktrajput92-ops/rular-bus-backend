import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        padding: "10px 14px",
        borderRadius: "999px",
        border: "1px solid var(--erp-border)",
        cursor: "pointer",
        background: "var(--erp-surface)",
        color: "var(--erp-text)",
        fontWeight: 700,
        boxShadow: "var(--erp-shadow-md)",
        whiteSpace: "nowrap",
      }}
    >
      {isDark ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}
