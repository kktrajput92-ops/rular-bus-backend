import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Seats() {

  const navigate = useNavigate();
  const location = useLocation();

  const bus = location.state || {};

  const bookedSeats = [3, 7, 12, 18, 24, 31, 40, 45];

  const [selectedSeats, setSelectedSeats] = useState([]);

  const farePerSeat = 550;

  const toggleSeat = (seat) => {

    if (bookedSeats.includes(seat)) {
      return;
    }

    if (selectedSeats.includes(seat)) {

      setSelectedSeats(
        selectedSeats.filter((s) => s !== seat)
      );

    } else {

      setSelectedSeats([
        ...selectedSeats,
        seat,
      ]);

    }

  };

  const continueBooking = () => {

    if (selectedSeats.length === 0) {

      alert("Please select at least one seat.");

      return;

    }

    navigate("/passenger", {
      state: {
        ...bus,
        seats: selectedSeats,
        totalFare:
          selectedSeats.length * farePerSeat,
      },
    });

  };

  const seatStyle = (seat) => {

    if (bookedSeats.includes(seat)) {

      return {
        background: "#dc3545",
        color: "#fff",
      };

    }

    if (selectedSeats.includes(seat)) {

      return {
        background: "#0d6efd",
        color: "#fff",
      };

    }

    return {
      background: "#28a745",
      color: "#fff",
    };

  };

  return (

    <div
      style={{
        padding: 20,
        maxWidth: 520,
        margin: "auto",
        fontFamily: "Arial",
      }}
    >

      <h2
        style={{
          textAlign: "center",
        }}
      >
        🚌 Select Your Seats
      </h2>

      <div
        style={{
          background: "#f8f9fa",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >

        <h3>
          {bus.bus_name}
        </h3>

        <p>

          {bus.source} ➜ {bus.destination}

        </p>

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
          fontWeight: "bold",
        }}
      >

        <span>🟢 Available</span>

        <span>🔵 Selected</span>

        <span>🔴 Booked</span>

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 20,
          fontSize: 22,
        }}
      >

        👨‍✈️ Driver

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5,60px)",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {Array.from({ length: 52 }, (_, index) => {

          const seat = index + 1;

          return (

            <button
              key={seat}
              onClick={() => toggleSeat(seat)}
              style={{
                width: 60,
                height: 60,
                border: "none",
                borderRadius: 10,
                cursor: bookedSeats.includes(seat)
                  ? "not-allowed"
                  : "pointer",
                fontWeight: "bold",
                ...seatStyle(seat),
              }}
            >
              {seat}
            </button>

          );

        })}

      </div>

      <div
        style={{
          marginTop: 30,
          background: "#f8f9fa",
          padding: 15,
          borderRadius: 10,
        }}
      >

        <h3>Selected Seats</h3>

        <p>
          {selectedSeats.length === 0
            ? "No Seat Selected"
            : selectedSeats.join(", ")}
        </p>

        <h3>
          Total Fare : ₹
          {selectedSeats.length * farePerSeat}
        </h3>

        <button
          onClick={continueBooking}
          style={{
            width: "100%",
            padding: 15,
            background: "#198754",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 18,
            marginTop: 15,
          }}
        >
          Continue Booking
        </button>

      </div>

    </div>

  );

}

export default Seats;

