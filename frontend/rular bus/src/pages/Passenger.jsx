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

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    gender: "Male",
    age: "",
  });

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (
      !form.full_name ||
      !form.phone ||
      !form.age
    ) {

      alert("Please fill all required fields.");

      return;

    }

    try {

      setLoading(true);

      const passengerRes = await api.post("/passengers", {

        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
        age: Number(form.age),

      });

      const passenger = passengerRes.data.passenger;

      const bookingRes = await api.post("/bookings", {

        passenger_id: passenger.id,
        schedule_id,
        seat_number: seats[0],

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
          maxWidth: 520,
          margin: "auto",
          background: "#fff",
          borderRadius: 15,
          padding: 25,
        }}
      >

        <h2
          style={{
            textAlign: "center",
          }}
        >
          Passenger Details
        </h2>
        <div
          style={{
            background: "#eef6ff",
            padding: 15,
            borderRadius: 10,
            marginTop: 20,
            marginBottom: 20,
          }}
        >

          <h3>{bus_name}</h3>

          <p>
            📍 {source} → {destination}
          </p>

          <p>
            💺 Selected Seat(s):{" "}
            {seats.length ? seats.join(", ") : "-"}
          </p>

          <p>
            💰 Total Fare: ₹{totalFare}
          </p>

        </div>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
            }}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
            }}
          />

          <input
            type="email"
            name="email"
            placeholder="Email (Optional)"
            value={form.email}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
            }}
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
            }}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 20,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            {loading
              ? "Please Wait..."
              : "Continue To Payment"}
          </button>

        </form>

      </div>

    </div>

  );

}
export default Passenger;
