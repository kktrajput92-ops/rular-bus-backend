export default function PopularRoutes() {
  const routes = [
    "Delhi → Lucknow",
    "Delhi → Kanpur",
    "Delhi → Gorakhpur",
    "Lucknow → Prayagraj",
  ];

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "30px auto",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#0B3D91",
          marginBottom: "20px",
        }}
      >
        ⭐ Popular Routes
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "15px",
        }}
      >
        {routes.map((route) => (
          <div
            key={route}
            style={{
              background: "#fff",
              padding: "18px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
              fontWeight: "600",
            }}
          >
            🚌 {route}
          </div>
        ))}
      </div>
    </div>
  );
}
