export default function Bed({
  label,
  type,
  booked = false,
  selected = false,
  onClick,
}) {
  const background = booked
    ? "#dc3545"
    : selected
    ? "#2563eb"
    : "rgba(31,41,55,.75)";

  return (
    <div
      onClick={!booked ? onClick : undefined}
      style={{
        width:
  type === "double-lower" || type === "double-upper"
    ? 220
    : 140,
        height: 74,
        borderRadius: 18,
        background,
        border: selected
          ? "2px solid #60a5fa"
          : "1px solid rgba(255,255,255,.12)",
        boxShadow: selected
          ? "0 0 24px rgba(59,130,246,.65)"
          : "0 12px 28px rgba(0,0,0,.28)",
        cursor: booked ? "not-allowed" : "pointer",
        position: "relative",
        transition: ".25s ease",
        overflow: "hidden",
      }}
    >
      {/* Window Strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 8,
          height: "100%",
          background: "rgba(255,255,255,.18)",
        }}
      />

      {/* Pillow */}
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 10,
          width: 36,
          height: 12,
          borderRadius: 8,
          background: "#f8fafc",
        }}
      />
      {/* Seat Label */}
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        {label}
      </div>

      {/* Upper / Lower Badge */}
      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 8,
          fontSize: 10,
          fontWeight: 700,
          color: "#fff",
          opacity: 0.85,
        }}
      >
        {type === "upper" ? "UPPER" : "LOWER"}
      </div>
    </div>
  );
}
