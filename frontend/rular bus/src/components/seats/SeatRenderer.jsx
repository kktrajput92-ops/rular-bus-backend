import { generateLayout } from "../../layout-engine/generateLayout";

export default function SeatRenderer() {
  const rows = generateLayout(12, "2x2");

  return (
    <div
      style={{
        margin: "20px 0",
      }}
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          {row.map((seat, index) => {

            if (seat === null) {
              return (
                <div
                  key={index}
                  style={{
                    width: 40,
                  }}
                />
              );
            }

            return (
              <button
                key={seat.id}
                style={{
                  width: 64,
                  height: 64,
                  border: "none",
                  borderRadius: 16,
                  background: "#22c55e",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "15px",
                  boxShadow: "0 8px 18px rgba(0,0,0,.15)",
                }}
              >
                {seat.label}
              </button>
            );

          })}
        </div>
      ))}
    </div>
  );
}
