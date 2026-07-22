export default function BusContainer({ children }) {
  return (
  <div
    style={{
      position: "relative",
      maxWidth: "460px",
      margin: "24px auto",
      padding: "26px",
      background: "linear-gradient(180deg,#ffffff,#f8fbff)",
      borderRadius: "32px",
      border: "2px solid #dbeafe",
      boxShadow: "0 18px 40px rgba(15,23,42,.12)",
      overflow: "hidden",
    }}
  >
    {/* Left Bus Wall */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 8,
        background: "#2563eb",
      }}
    />

    {/* Right Bus Wall */}
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 8,
        background: "#2563eb",
      }}
    />

    {/* Window Strip */}
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 28,
        right: 28,
        height: 8,
        borderRadius: 20,
        background: "#bfdbfe",
      }}
    />

    {children}
  </div>
);
}
