export default function SeatButton({
  seat,
  bookedSeats,
  selectedSeats,
  onSeatClick,
}) {
  const isBooked = bookedSeats.includes(seat.id);
  const isSelected = selectedSeats.includes(seat.id);

  const isSleeper =
    seat.type === "upper" || seat.type === "lower";

  return (
    <button
      onClick={() => !isBooked && onSeatClick(seat.id)}
      style={{
        width: isSleeper ? 96 : 64,
        height: isSleeper ? 54 : 64,
        border: "2px solid rgba(255,255,255,.25)",
        borderRadius: isSleeper ? 12 : 18,
        background: isBooked
          ? "#dc3545"
          : isSelected
          ? "#0d6efd"
          : "#22c55e",
        color: "#fff",
        fontWeight: "bold",
        fontSize: isSleeper ? "14px" : "16px",
        cursor: isBooked ? "not-allowed" : "pointer",
        boxShadow: isSelected
          ? "0 0 18px rgba(13,110,253,.55)"
          : "0 10px 22px rgba(0,0,0,.18)",
        transition: "all .25s ease",
        transform: isSelected ? "scale(1.06)" : "scale(1)",
      }}
    >
      {isSleeper ? "🛏️ " : ""}
      {seat.label}
    </button>
  );
}
