export default function Bed({
  seat,
  selected = false,
  onClick,
}) {
  const disabled =
    seat.booked ||
    seat.locked ||
    !seat.private_available;

  const type = String(
    seat.seat_type || ""
  ).toUpperCase();

  const isUpper =
    type.includes("UPPER");

  const isDouble =
    type.includes("DOUBLE") ||
    Number(
      seat.sharing_capacity || 1
    ) > 1;

  const fare = Number(
    seat.private_fare ??
      seat.fare ??
      0
  );

  const background = seat.booked
    ? "#dc2626"
    : seat.locked
    ? "#d97706"
    : selected
    ? "#2563eb"
    : "#16a34a";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
      style={{
        width: isDouble ? 150 : 108,
        height: 64,
        borderRadius: 16,
        background,
        border: selected
          ? "3px solid #93c5fd"
          : "1px solid rgba(255,255,255,.3)",
        boxShadow: selected
          ? "0 0 24px rgba(59,130,246,.55)"
          : "0 10px 24px rgba(0,0,0,.22)",
        cursor: disabled
          ? "not-allowed"
          : "pointer",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        opacity:
          disabled &&
          !seat.booked &&
          !seat.locked
            ? 0.55
            : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          width: 30,
          height: 11,
          borderRadius: 8,
          background: "#f8fafc",
        }}
      />

      {(seat.booked ||
        seat.locked) && (
        <span
          style={{
            position: "absolute",
            right: 8,
            top: 6,
          }}
        >
          🔒
        </span>
      )}

      <div
        style={{
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        🛏 {seat.seat_no}
      </div>

      <div
        style={{
          fontSize: 9,
          marginTop: 5,
        }}
      >
        {isUpper
          ? "UPPER"
          : "LOWER"}
        {fare > 0
          ? ` • ₹${fare}`
          : ""}
      </div>
    </button>
  );
}
