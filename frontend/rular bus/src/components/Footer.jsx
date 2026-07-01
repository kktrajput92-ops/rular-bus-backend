export default function Footer() {
  return (
    <footer
      style={{
        background: "#0B3D91",
        color: "#fff",
        marginTop: "40px",
        padding: "30px 20px",
        textAlign: "center",
      }}
    >
      <h2 style={{ margin: 0 }}>🚌 Rular Bus</h2>

      <p style={{ marginTop: "10px", color: "#ddd" }}>
        Safe • Smart • Affordable Travel
      </p>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <span>About</span>
        <span>Contact</span>
        <span>Privacy Policy</span>
        <span>Terms</span>
      </div>

      <p
        style={{
          marginTop: "20px",
          fontSize: "14px",
          color: "#bbb",
        }}
      >
        © 2026 Rular Bus. All Rights Reserved.
      </p>
    </footer>
  );
}
