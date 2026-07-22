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
  width: isSleeper ? 98 : 62,
  height: isSleeper ? 56 : 62,
  border: isSelected
    ? "2px solid #2563eb"
    : "1px solid #dbeafe",
  borderRadius: isSleeper ? 14 : 16,
  background: isBooked
    ? "linear-gradient(135deg,#ef4444,#b91c1c)"
    : isSelected
    ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
    : "linear-gradient(135deg,#22c55e,#16a34a)",
  color: "#fff",
  fontWeight: 700,
  fontSize: isSleeper ? 14 : 15,
  cursor: isBooked ? "not-allowed" : "pointer",
  boxShadow: isBooked
    ? "0 8px 18px rgba(239,68,68,.35)"
    : isSelected
    ? "0 0 22px rgba(37,99,235,.45)"
    : "0 10px 20px rgba(34,197,94,.28)",
  transition: "all .25s ease",
  transform: isSelected ? "scale(1.08)" : "scale(1)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
}}
    >
      <>
  {isBooked && (
    <span
      style={{
        position: "absolute",
        top: 3,
        right: 5,
        fontSize: 11,
      }}
    >
      🔒
    </span>
  )}

  <span>
    {isSleeper ? "🛏 " : ""}
    {seat.label}
  </span>
</>
    </button>
  );
}
