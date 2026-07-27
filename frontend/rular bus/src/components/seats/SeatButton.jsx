export default function SeatButton({
  seat,
  selected = false,
  onSeatClick,
}) {
  const disabled =
    seat.booked ||
    seat.locked ||
    !seat.private_available;

  const background = seat.booked
    ? "linear-gradient(135deg,#ef4444,#b91c1c)"
    : seat.locked
    ? "linear-gradient(135deg,#f59e0b,#d97706)"
    : selected
    ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
    : "linear-gradient(135deg,#22c55e,#16a34a)";

  const fare = Number(
    seat.private_fare ??
      seat.fare ??
      0
  );

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onSeatClick(seat);
        }
      }}
      title={
        seat.booked
          ? "Booked"
          : seat.locked
          ? "Temporarily locked"
          : `Seat ${seat.seat_no}`
      }
      style={{
        minWidth: 62,
        height: 66,
        padding: "6px 8px",
        border: selected
          ? "3px solid #93c5fd"
          : "1px solid #dbeafe",
        borderRadius: 16,
        background,
        color: "#fff",
        fontWeight: 700,
        cursor: disabled
          ? "not-allowed"
          : "pointer",
        opacity:
          disabled &&
          !seat.booked &&
          !seat.locked
            ? 0.55
            : 1,
        boxShadow: selected
          ? "0 0 22px rgba(37,99,235,.45)"
          : "0 8px 18px rgba(15,23,42,.18)",
        transform: selected
          ? "scale(1.06)"
          : "scale(1)",
        transition: "all .2s ease",
        position: "relative",
      }}
    >
      {(seat.booked ||
        seat.locked) && (
        <span
          style={{
            position: "absolute",
            top: 3,
            right: 5,
            fontSize: 10,
          }}
        >
          🔒
        </span>
      )}

      <div>{seat.seat_no}</div>

      {fare > 0 && (
        <div
          style={{
            fontSize: 10,
            marginTop: 4,
            opacity: 0.9,
          }}
        >
          ₹{fare}
        </div>
      )}
    </button>
  );
}
