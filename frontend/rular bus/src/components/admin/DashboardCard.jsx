export default function DashboardCard({
  title,
  value,
  icon,
  color = "#0B3D91",
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 20,
        boxShadow: "0 10px 20px rgba(0,0,0,.08)",
        borderLeft: `6px solid ${color}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: "#666",
              fontSize: 15,
            }}
          >
            {title}
          </div>

          <h2
            style={{
              marginTop: 10,
              color: "#1F2937",
            }}
          >
            {value}
          </h2>
        </div>

        <div
          style={{
            fontSize: 40,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
