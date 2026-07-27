export default function DashboardCard({
  title,
  value,
  icon,
  color = "var(--erp-primary)",
}) {
  return (
    <article
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "142px",
        padding: "20px",
        border: "1px solid var(--erp-border)",
        borderRadius: "var(--erp-radius-lg)",
        background:
          "linear-gradient(145deg, var(--erp-surface), var(--erp-surface-muted))",
        boxShadow: "var(--erp-shadow-sm)",
        transition:
          "transform var(--erp-transition-fast), box-shadow var(--erp-transition-fast), border-color var(--erp-transition-fast)",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px)";
        event.currentTarget.style.boxShadow = "var(--erp-shadow-md)";
        event.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "var(--erp-shadow-sm)";
        event.currentTarget.style.borderColor = "var(--erp-border)";
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: "5px",
          background: color,
          borderRadius: "var(--erp-radius-lg) 0 0 var(--erp-radius-lg)",
        }}
      />

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-34px",
          right: "-34px",
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          background: color,
          opacity: 0.08,
          filter: "blur(4px)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "18px",
          height: "100%",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              color: "var(--erp-text-secondary)",
              fontSize: "14px",
              fontWeight: 650,
              letterSpacing: "0.01em",
            }}
          >
            {title}
          </p>

          <h2
            style={{
              margin: "12px 0 0",
              color: "var(--erp-heading)",
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 800,
              lineHeight: 1.1,
              overflowWrap: "anywhere",
            }}
          >
            {value}
          </h2>
        </div>

        <div
          aria-hidden="true"
          style={{
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            width: "58px",
            height: "58px",
            border: `1px solid ${color}`,
            borderRadius: "16px",
            background: "var(--erp-surface)",
            color,
            fontSize: "30px",
            boxShadow: "var(--erp-shadow-xs)",
          }}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}
