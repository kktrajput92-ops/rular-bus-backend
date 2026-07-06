import React from "react";

function PaymentCard({ payment }) {
  return (
    <div
      style={{
       background: "#F8FAFC",
border: "1px solid #E5E7EB",
borderRadius: "12px",
padding: "18px",
marginBottom: "20px",
      
      }}
    >
      <h3
        style={{
          marginTop: 0,
         color: "#0B3D91",
        }}
      >
        💳 Payment Details
      </h3>

      <p>
        <b>Payment ID :</b> {payment.id || "N/A"}
      </p>

      <p>
        <b>Method :</b> {payment.payment_method || "UPI"}
      </p>

      <p>
        <b>Amount :</b> ₹{payment.amount || 450}
      </p>

      <p>
        <b>Status :</b>{" "}
        <span
          style={{
            color: "#16a34a",
            fontWeight: "bold",
          }}
        >
          Payment Successful ✅
        </span>
      </p>
    </div>
  );
}

export default PaymentCard;
