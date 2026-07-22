const COLORS = {
  SEAT: "#4f8ef7",
  LOWER_BERTH: "#14b8a6",
  UPPER_BERTH: "#8b5cf6",
  DOOR: "#22c55e",
  DRIVER: "#f97316",
  AISLE: "#9ca3af",
  EXTRA: "#a855f7",
  EMPTY: "#fafafa",
};

export default function Seat({
  cell,
  getSeatLabel,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
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
        userSelect: "none",
        color: cell.type === "EMPTY" ? "#000" : "#fff",
        background: COLORS[cell.type] || "#fafafa",
        transition: "0.15s ease",
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
  );
}
