export default function DriverCabin() {
 return (
  <div
    style={{
      background: "linear-gradient(135deg,#0f172a,#1e40af)",
      borderRadius: "18px",
      padding: "16px 18px",
      marginBottom: "24px",
      boxShadow: "0 12px 30px rgba(0,0,0,.18)",
      color: "#fff",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 24 }}>🛞</span>

      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: ".5px",
        }}
      >
        🚌 DRIVER CABIN
      </div>

      <span style={{ fontSize: 24 }}>🛞</span>
    </div>

    <div
      style={{
        marginTop: 10,
        height: 4,
        background: "rgba(255,255,255,.25)",
        borderRadius: 10,
      }}
    />
  </div>
);
}
