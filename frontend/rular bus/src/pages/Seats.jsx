import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DriverCabin from "../components/seats/DriverCabin";
import SeatGrid from "../components/seats/SeatGrid";
import BookingSummary from "../components/seats/BookingSummary";
import SeatRenderer from "../components/seats/SeatRenderer";
import BusContainer from "../components/seats/BusContainer";
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

       <div
  style={{
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "16px",
    marginBottom: "24px",
    boxShadow: "0 6px 18px rgba(0,0,0,.08)",
    fontWeight: "600",
    flexWrap: "wrap",
    gap: "12px",
  }}
>
  <span>🟢 Available</span>

  <span>🔵 Selected</span>

  <span>🔴 Booked</span>

  <span>⭐ Premium</span>
</div>

      </div>
<BusContainer>
<DriverCabin />
   
<SeatRenderer
  totalSeats={52}
  layoutType="sleeper"
  bookedSeats={bookedSeats}
  selectedSeats={selectedSeats}
  onSeatClick={toggleSeat}
/>
</BusContainer>

       <BookingSummary
  selectedSeats={selectedSeats}
  farePerSeat={farePerSeat}
  onContinue={continueBooking}
/>

    </div>

  );

}

export default Seats;

