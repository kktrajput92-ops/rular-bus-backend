import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import api from "../api/api";
import PaymentProcessing from "../components/PaymentProcessing";

function Payment() {

  const navigate = useNavigate();
  const location = useLocation();

  const { booking } = location.state || {};

  const [loading, setLoading] = useState(false);

  const [showProcessing, setShowProcessing] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState("UPI");

  const fare = {

    base: 450,

    platform: 20,

    insurance: 10,

    discount: -20,

    total: 450,

  };

  if (!booking) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "22px",
        }}
      >
        Booking Not Found
      </div>

    );

  }
  const makePayment = async () => {

    try {

      setLoading(true);

      setShowProcessing(true);

      const res = await api.post("/payments", {

        booking_id: booking.id,

        amount: fare.total,

        payment_method: paymentMethod,

      });

      setTimeout(() => {

        navigate("/ticket", {

          state: {

            booking,

            payment: res.data.payment,

          },

        });

      }, 5200);

    } catch (err) {

      console.error(err);

      setShowProcessing(false);

      alert(

        err.response?.data?.message ||

        "Payment Failed"

      );

    } finally {

      setLoading(false);

    }

  };

  if (showProcessing) {

    return (

      <PaymentProcessing

        onComplete={() => {}}

      />

    );

  }

  return (

    <div

      style={{

        minHeight: "100vh",

        background: "#eef3f8",

        padding: "25px",

      }}

    >
      <div
        style={{
          maxWidth: "650px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "20px",
          padding: "25px",
          boxShadow: "0 10px 30px rgba(0,0,0,.12)",
        }}
      >

        <h1
          style={{
            textAlign: "center",
            color: "#d62828",
            marginBottom: "5px",
          }}
        >
          💳 Secure Payment
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "25px",
          }}
        >
          Rular Bus Smart Journey Engine™
        </p>

        <hr />

        <h3>🚌 Journey Details</h3>

        <p>
          <b>Booking ID :</b> {booking.id}
        </p>

        <p>
          <b>Seat Number :</b> {booking.seat_number}
        </p>

        <p>
          <b>Payment Method :</b> {paymentMethod}
        </p>

        <hr />

        <h3>💰 Fare Details</h3>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "12px",
            padding: "18px",
          }}
        >

          <p>
            Base Fare
            <span style={{ float: "right" }}>
              ₹{fare.base}
            </span>
          </p>

          <p>
            Platform Fee
            <span style={{ float: "right" }}>
              ₹{fare.platform}
            </span>
          </p>

          <p>
            Insurance
            <span style={{ float: "right" }}>
              ₹{fare.insurance}
            </span>
          </p>

          <p style={{ color: "green" }}>
            Discount
            <span style={{ float: "right" }}>
              ₹{fare.discount}
            </span>
          </p>

          <hr />

          <h2 style={{ color: "#d62828" }}>
            Total
            <span style={{ float: "right" }}>
              ₹{fare.total}
            </span>
          </h2>

        </div>
        <h3 style={{ marginTop: "25px" }}>
          💳 Select Payment Method
        </h3>

        <select
          value={paymentMethod}
          onChange={(e) =>
            setPaymentMethod(e.target.value)
          }
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "10px",
            borderRadius: "10px",
            fontSize: "16px",
            border: "1px solid #d1d5db",
          }}
        >
          <option value="UPI">UPI</option>
          <option value="Debit Card">
            Debit Card
          </option>
          <option value="Credit Card">
            Credit Card
          </option>
          <option value="Net Banking">
            Net Banking
          </option>
          <option value="Wallet">
            Wallet
          </option>
        </select>

        <div
          style={{
            marginTop: "25px",
            background: "#ecfdf5",
            border: "1px solid #86efac",
            borderRadius: "12px",
            padding: "15px",
          }}
        >
          <h4
            style={{
              margin: 0,
              color: "#15803d",
            }}
          >
            🔒 100% Secure Payment
          </h4>

          <p
            style={{
              marginTop: "8px",
              color: "#444",
              fontSize: "14px",
            }}
          >
            Your payment is protected with encrypted
            communication and secure processing.
          </p>

        </div>

        <button
          onClick={makePayment}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "25px",
            padding: "16px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Processing..."
            : `Pay ₹${fare.total}`}
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "14px",
            background: "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>

    </div>

  );

}

export default Payment;
