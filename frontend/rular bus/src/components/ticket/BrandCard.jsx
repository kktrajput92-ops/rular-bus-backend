export default function BrandCard() {
  return (
    <div
      style={{
        marginTop: 30,
        padding: 28,
        borderRadius: 20,
        background: "linear-gradient(135deg,#0B3D91,#1565C0)",
        color: "#fff",
        textAlign: "center",
        boxShadow: "0 18px 40px rgba(11,61,145,.30)",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "30px",
          fontWeight: "800",
        }}
      >
        🚌 Rular Bus
      </h2>

      <p
        style={{
          marginTop: 10,
          fontSize: 17,
          opacity: 0.95,
        }}
      >
        Travel Beyond Expectations
      </p>

      <hr
        style={{
          margin: "20px 0",
          borderColor: "rgba(255,255,255,.25)",
        }}
      />

      <p>🛡 Official Digital Ticket</p>

      <p>📞 24×7 Customer Support</p>

      <p>📧 support@rularbus.in</p>

      <p>🌐 www.rularbus.in</p>

      <p>🚍 Safe • Secure • Comfortable Journey</p>

      <hr
        style={{
          margin: "20px 0",
          borderColor: "rgba(255,255,255,.25)",
        }}
      />

      <p
        style={{
          fontSize: 13,
          opacity: 0.9,
          marginBottom: 0,
        }}
      >
        Powered by
      </p>

      <h3
        style={{
          margin: "8px 0 0",
        }}
      >
        Rular Bus Smart Journey Engine™
      </h3>

      <p
        style={{
          fontSize: 12,
          opacity: 0.8,
          marginTop: 8,
        }}
      >
        Version 2.0 • Premium Digital Ticket
      </p>
    </div>
  );
}
