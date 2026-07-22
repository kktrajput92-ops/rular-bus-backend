import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";

function Passenger() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    schedule_id,
    seats = [],
    totalFare = 0,
    bus_name = "",
    source = "",
    destination = "",
  } = location.state || {};

  const createPassenger = (seatNumber) => ({
    seat_number: seatNumber,
    full_name: "",
    phone: "",
    email: "",
    gender: "Male",
    age: "",
  });

  const [loading, setLoading] = useState(false);

  const [passengers, setPassengers] = useState(
    seats.map((seat) => createPassenger(seat))
  );

  const handleChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const passenger of passengers) {
      if (
        !passenger.full_name.trim() ||
        !passenger.phone.trim() ||
        !passenger.age
      ) {
        alert(
          `Please complete details for Seat ${passenger.seat_number}`
        );
        return;
      }
    }

    try {
      setLoading(true);

      const passengerIds = [];

      for (const passenger of passengers) {
        const passengerRes = await api.post("/passengers", {
          full_name: passenger.full_name,
          phone: passenger.phone,
          email: passenger.email,
          gender: passenger.gender,
          age: Number(passenger.age),
        });

        passengerIds.push({
          passenger_id: passengerRes.data.passenger.id,
          seat_number: passenger.seat_number,
        });
      }

      const bookingRes = await api.post("/bookings", {
        schedule_id,
        passengers: passengerIds,
      });

      navigate("/payment", {
        state: {
          booking: bookingRes.data.booking,
        },
      });
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: 20,
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "auto",
          background: "#fff",
          borderRadius: 20,
          padding: 30,
          boxShadow: "0 10px 25px rgba(0,0,0,.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0B3D91",
            marginBottom: 20,
          }}
        >
          Passenger Details
        </h2>

        <div
          style={{
            background: "#EEF6FF",
            padding: 18,
            borderRadius: 12,
            marginBottom: 25,
            border: "1px solid #D6E8FF",
          }}
        >
          <h3>{bus_name}</h3>

          <p>
            📍 {source} → {destination}
          </p>

          <p>💺 Seats: {seats.join(", ")}</p>

          <p>💰 Total Fare: ₹{totalFare}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {passengers.map((passenger, index) => (
            <div
              key={passenger.seat_number}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3 style={{ color: "#0B3D91" }}>
                Passenger {index + 1} — Seat {passenger.seat_number}
              </h3>
              <input
                type="text"
                placeholder="Full Name"
                value={passenger.full_name}
                onChange={(e) =>
                  handleChange(index, "full_name", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 12,
                  marginTop: 15,
                  marginBottom: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={passenger.phone}
                onChange={(e) =>
                  handleChange(index, "phone", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 12,
                  marginBottom: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <input
                type="email"
                placeholder="Email (Optional)"
                value={passenger.email}
                onChange={(e) =>
                  handleChange(index, "email", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 12,
                  marginBottom: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <select
                value={passenger.gender}
                onChange={(e) =>
                  handleChange(index, "gender", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 12,
                  marginBottom: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="number"
                placeholder="Age"
                value={passenger.age}
                onChange={(e) =>
                  handleChange(index, "age", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 15,
              background: "#0B3D91",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: "bold",
              marginTop: 10,
            }}
          >
            {loading
              ? "Please Wait..."
              : `Continue To Payment (${passengers.length} Passenger${
                  passengers.length > 1 ? "s" : ""
                })`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Passenger;

