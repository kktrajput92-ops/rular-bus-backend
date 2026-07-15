export default function Unauthorized() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "#f5f5f5",
      }}
    >
      <h1 style={{ fontSize: 70, color: "#dc3545" }}>403</h1>

      <h2>Access Denied</h2>

      <p>
        You don't have permission to access this page.
      </p>
    </div>
  );
}

