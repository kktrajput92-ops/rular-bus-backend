import React from "react";

function TicketActions({
  onDownload,
  onShare,
  onHome,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginTop: "30px",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={onDownload}
        style={{
          flex: 1,
          padding: "15px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        📄 Download PDF
      </button>

      <button
        onClick={onShare}
        style={{
          flex: 1,
          padding: "15px",
          background: "#16a34a",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        📤 Share Ticket
      </button>

      <button
        onClick={onHome}
        style={{
          width: "100%",
          padding: "15px",
          background: "#d62828",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        🏠 Back to Home
      </button>
    </div>
  );
}

export default TicketActions;
