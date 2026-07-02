export default function BusContainer({ children }) {
  return (
    <div
      style={{
        maxWidth: "430px",
        margin: "20px auto",
        padding: "24px",
        background: "#ffffff",
        borderRadius: "24px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        border: "1px solid #e5e7eb",
      }}
    >
      {children}
    </div>
  );
}
