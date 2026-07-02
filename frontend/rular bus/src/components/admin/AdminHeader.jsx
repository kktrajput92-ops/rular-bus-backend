export default function AdminHeader() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "18px 30px",
        borderRadius: "18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        marginBottom: 25,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: "#0B3D91",
          }}
        >
          👋 Welcome Admin
        </h2>

        <small
          style={{
            color: "#666",
          }}
        >
          {today}
        </small>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            background: "#F5F7FA",
            padding: 12,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 22,
          }}
        >
          🔔
        </div>

        <div
          style={{
            background: "#F5F7FA",
            padding: 12,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 22,
          }}
        >
          ⚙️
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#D62828",
              color: "#fff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            A
          </div>

          <div>
            <div
              style={{
                fontWeight: "bold",
                color: "#1F2937",
              }}
            >
              Administrator
            </div>

            <small
              style={{
                color: "#666",
              }}
            >
              Super Admin
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
