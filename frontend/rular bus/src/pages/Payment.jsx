import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/api";

function Payment() {

  const navigate = useNavigate();
  const location = useLocation();

  const { booking } = location.state || {};

  const [loading, setLoading] = useState(false);

  if (!booking) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "100px",
          fontSize: "20px",
        }}
      >
        No Booking Found
      </div>
    );
  }

  const makePayment = async () => {

    try {

      setLoading(true);

      const res = await api.post("/payments", {
        booking_id: booking.id,
        amount: 500,
        payment_method: "UPI",
      });

      navigate("/ticket", {
        state: {
          payment: res.data.payment,
          booking,
        },
      });

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Payment Failed"
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
          borderRadius: "15px",
          padding: "25px",
          boxShadow: "0 10px 30px rgba(0,0,0,.15)",
        }}
      >

        <h2
          style={{
            textAlign: "center",
            color: "#e63946",
          }}
        >
          Payment
        </h2>

        <hr />

        <p>
          <b>Booking ID :</b> {booking.id}
        </p>

        <p>
          <b>Seat :</b> {booking.seat_number}
        </p>

        <p>
          <b>Total Fare :</b> ₹500
        </p>
        <button
          onClick={makePayment}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {loading ? "Processing Payment..." : "Pay ₹500"}
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "14px",
            background: "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Back
        </button>

      </div>

    </div>

  );
}

export default Payment;
