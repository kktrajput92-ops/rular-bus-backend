import React from "react";
import logo from "../../assets/logo/rular-logo.png";
function TicketHeader() {
  return (
    <div
  style={{
    background:
      "linear-gradient(135deg,#0B3D91,#1565C0)",
    color: "#fff",
    borderRadius: "22px",
    padding: "28px",
    textAlign: "center",
    marginBottom: "30px",
    boxShadow: "0 18px 40px rgba(11,61,145,.25)",
    position: "relative",
    overflow: "hidden",
  }}
>
  <div
    style={{
      position: "absolute",
      top: "-35px",
      right: "-35px",
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      background: "rgba(255,255,255,.08)",
    }}
  />

  <div
    style={{
      display: "inline-block",
      padding: "6px 14px",
      borderRadius: "30px",
      background: "#F4B400",
      color: "#1F2937",
      fontWeight: "bold",
      fontSize: "13px",
      marginBottom: "15px",
    }}
  >
    PREMIUM DIGITAL TICKET
  </div>

    <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
  }}
>
  <img
    src={logo}
    alt="Rular Bus"
    style={{
      width: "52px",
      height: "52px",
      background: "#fff",
      borderRadius: "50%",
      padding: "6px",
      objectFit: "contain",
    }}
  />

  <h1
    style={{
      margin: 0,
      fontSize: "34px",
      fontWeight: "800",
    }}
  >
    Rular Bus
  </h1>
</div>

  <h3
    style={{
      marginTop: "12px",
      fontWeight: "500",
      color: "#EAF2FF",
    }}
  >
    Travel Beyond Expectations
  </h3>

  <p
    style={{
      marginTop: "18px",
      opacity: ".95",
      fontSize: "15px",
    }}
  >
    Your journey has been successfully confirmed.
  </p>
</div>
         
  );
}

export default TicketHeader;
