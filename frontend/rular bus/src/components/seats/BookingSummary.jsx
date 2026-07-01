export default function BookingSummary({
  selectedSeats,
  farePerSeat,
  onContinue,
}) {
  const totalFare = selectedSeats.length * farePerSeat;

  return (
    <div
      style={{
        marginTop: 30,
        background: "#f8f9fa",
        padding: 20,
        borderRadius: 16,
        boxShadow: "0 8px 20px rgba(0,0,0,.08)",
      }}
    >
      <h3>Booking Summary</h3>

      <p>
        <b>Seats:</b>{" "}
        {selectedSeats.length === 0
          ? "None"
          : selectedSeats.join(", ")}
      </p>

      <p>
        <b>Passengers:</b> {selectedSeats.length}
      </p>

      <h2>₹{totalFare}</h2>

      <button
        onClick={onContinue}
        style={{
          width: "100%",
          padding: 15,
          background: "#0B3D91",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Continue Booking
      </button>
    </div>
  );
}
