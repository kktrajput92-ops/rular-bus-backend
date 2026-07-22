export default function BusCanvas({ children }) {
  return (
    <div>
      <div
        style={{
          background: "#fff",
          border: "3px solid #1f2937",
          borderRadius: 28,
          padding: 20,
          width: "fit-content",
          boxShadow: "0 10px 25px rgba(0,0,0,.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
            fontWeight: "bold",
          }}
        >
          <span>👨 DRIVER</span>
          <span>🚪 DOOR</span>
        </div>

        {children}
      </div>
    </div>
  );
}
