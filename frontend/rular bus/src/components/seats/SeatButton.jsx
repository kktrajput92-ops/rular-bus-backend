export default function SeatButton({
  seat,
  bookedSeats,
  selectedSeats,
  onSeatClick,
}) {
  const isBooked = bookedSeats.includes(seat.id);
  const isSelected = selectedSeats.includes(seat.id);

  return (
    <button
      onClick={() => !isBooked && onSeatClick(seat.id)}
      style={{
        width: 64,
        height: 64,
        border: "none",
        borderRadius: 16,
        background: isBooked
          ? "#dc3545"
          : isSelected
          ? "#0d6efd"
          : "#22c55e",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "15px",
        cursor: isBooked ? "not-allowed" : "pointer",
        boxShadow: "0 8px 18px rgba(0,0,0,.15)",
        transition: "all .2s ease",
      }}
    >
      {seat.label}
    </button>
  );
}
