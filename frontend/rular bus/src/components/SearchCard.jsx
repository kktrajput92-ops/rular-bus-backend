export default function SearchCard() {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "25px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        margin: "20px auto",
        maxWidth: "700px",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          color: "#0B3D91",
          marginBottom: "20px",
        }}
      >
        Search Your Journey
      </h3>

      <input
        type="text"
        placeholder="📍 From City"
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "12px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      />

      <input
        type="text"
        placeholder="📍 To City"
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "12px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      />

      <input
        type="date"
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      />

      <button
        style={{
          width: "100%",
          padding: "14px",
          background: "#0B3D91",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        🔍 Search Buses
      </button>
    </div>
  );
}

