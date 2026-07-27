export default function BusCanvas({
  children,
  deck = "LOWER",
}) {
  const isUpper =
    String(deck).toUpperCase() ===
    "UPPER";

  return (
    <div>
      <div
        style={{
          background: "#fff",
          border: "3px solid #1f2937",
          borderRadius: 28,
          padding: 20,
          width: "fit-content",
          boxShadow:
            "0 10px 25px rgba(0,0,0,.15)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr auto 1fr",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            fontWeight: "bold",
            fontSize: 12,
          }}
        >
          <span
            style={{
              textAlign: "left",
              color: "#15803d",
            }}
          >
            {isUpper
              ? "LEFT / CONDUCTOR SIDE"
              : "🚪 DOOR / CONDUCTOR"}
          </span>

          <span
            style={{
              color: "#64748b",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            FRONT
          </span>

          <span
            style={{
              textAlign: "right",
              color: "#c2410c",
            }}
          >
            {isUpper
              ? "RIGHT / DRIVER SIDE"
              : "DRIVER 🛞"}
          </span>
        </div>

        {children}

        <div
          style={{
            textAlign: "center",
            marginTop: 12,
            fontSize: 11,
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: 1,
          }}
        >
          REAR
        </div>
      </div>
    </div>
  );
}
