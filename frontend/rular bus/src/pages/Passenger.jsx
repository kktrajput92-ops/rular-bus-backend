import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";

function Passenger() {

  const navigate = useNavigate();
  const location = useLocation();

  const { schedule_id, seat_number } = location.state || {};

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
      !form.gender ||
      !form.age
    ) {

      alert("Please fill all required fields");
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
        seat_number,

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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
      }}
    >

      <div
        style={{
          width: "90%",
          maxWidth: "500px",
          background: "#fff",
          padding: "25px",
          borderRadius: "15px",
        }}
      >

        <h2 style={{ textAlign: "center" }}>
          Passenger Details
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          <br /><br />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
          />

          <br /><br />

          <input
            type="email"
            name="email"
            placeholder="Email (Optional)"
            value={form.email}
            onChange={handleChange}
          />

          <br /><br />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <br /><br />

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            required
          />

                   <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {loading ? "Please Wait..." : "Continue To Payment"}
          </button>

        </form>

      </div>

    </div>

  );

}

export default Passenger;
