export default function SeatGrid({
  grid,
  getSeatLabel,
  toggleCell,
}) {
  return (
    <>
      {grid.map((row, r) => (
        <div
          key={r}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {row.map((cell) => (
            <div
              key={`${cell.row}-${cell.col}`}
              onClick={() => toggleCell(cell.row, cell.col)}
              style={{
                width: 50,
                height: 50,
                border: "1px solid #999",
                borderRadius: 6,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                fontWeight: "bold",
                color: cell.type === "EMPTY" ? "#000" : "#fff",
                background:
                  cell.type === "SEAT"
                    ? "#4f8ef7"
                    : cell.type === "LOWER_BERTH"
                    ? "#14b8a6"
                    : cell.type === "UPPER_BERTH"
                    ? "#8b5cf6"
                    : cell.type === "DOOR"
                    ? "#22c55e"
                    : cell.type === "DRIVER"
                    ? "#f97316"
                    : cell.type === "AISLE"
                    ? "#9ca3af"
                    : cell.type === "EXTRA"
                    ? "#a855f7"
                    : "#fafafa",
              }}
            >
              {cell.type === "EMPTY"
                ? `${cell.row + 1}-${cell.col + 1}`
                : cell.type === "SEAT" ||
                  cell.type === "LOWER_BERTH" ||
                  cell.type === "UPPER_BERTH"
                ? getSeatLabel(cell.row, cell.col)
                : cell.type}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
