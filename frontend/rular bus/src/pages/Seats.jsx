import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Seats() {
  const navigate = useNavigate();

  const totalSeats = 52;
  const [selectedSeat, setSelectedSeat] = useState(null);

  const continueBooking = () => {
    if (!selectedSeat) {
      alert("Please select a seat");
      return;
    }

    navigate("/passenger", {
      state: {
        seat_number: selectedSeat,
      },
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        🚌 Select Your Seat
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,60px)",
          gap: "12px",
          justifyContent: "center",
          marginTop: "30px",
        }}
      >
        {Array.from({ length: totalSeats }, (_, i) => {
          const seat = i + 1;

          return (
            <button
              key={seat}
              onClick={() => setSelectedSeat(seat)}
              style={{
                height: "60px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                background:
                  selectedSeat === seat
                    ? "#2196f3"
                    : "#22c55e",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {seat}
            </button>
          );
        })}
      </div>

      {selectedSeat && (
        <div
          style={{
            textAlign: "center",
            marginTop: "30px",
          }}
        >
          <h2>
            Selected Seat : {selectedSeat}
          </h2>

          <button
            onClick={continueBooking}
            style={{
              padding: "14px 25px",
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Continue Booking
          </button>
        </div>
      )}
    </div>
  );
}

export default Seats;
