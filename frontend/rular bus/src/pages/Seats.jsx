import { useEffect, useState } from "react";
import api from "../api/api";
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

  const [bookedSeats, setBookedSeats] = useState([]);

  const [selectedSeats, setSelectedSeats] = useState([]);
const [layout, setLayout] = useState([]);
  const farePerSeat = Number(bus.fare || bus.price || 550);
const loadSeats = async () => {
  if (!bus.schedule_id) return;

  try {
    const res = await api.get(`/seats/${bus.schedule_id}`);
    setBookedSeats(res.data.booked_seats || []);
  } catch (err) {
    console.error(err);
  }
};

const loadLayout = async () => {
  if (!bus.bus_id) return;

  try {
    const res = await api.get(`/seat-layouts/${bus.bus_id}`);
console.log("BUS ID =", bus.bus_id);
console.log("LAYOUT =", res.data.layout);  
  setLayout(res.data.layout || []);
  } catch (err) {
    console.error(err);
  }
};
useEffect(() => {
  loadSeats();
  loadLayout();

  const interval = setInterval(() => {
    loadSeats();
  }, 5000);

  return () => clearInterval(interval);
}, [bus.schedule_id, bus.bus_id]);

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

  const continueBooking = async () => {

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

     <div
  style={{
    background: "linear-gradient(135deg,#0f172a,#1e3a8a)",
    color: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,.18)",
  }}
>
  <h2 style={{ margin: 0, fontSize: 24 }}>
    🚌 {bus.bus_name || "Rular Bus"}
  </h2>

  <p style={{ marginTop: 8, opacity: .9 }}>
    {bus.source} ➜ {bus.destination}
  </p>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      marginTop: 18,
      gap: 10,
    }}
  >
    <div>📅 {bus.journey_date || "-"}</div>
    <div>🕒 {bus.departure_time || "-"}</div>
    <div>💰 ₹{farePerSeat}</div>
  </div>
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
  layout={layout}
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

