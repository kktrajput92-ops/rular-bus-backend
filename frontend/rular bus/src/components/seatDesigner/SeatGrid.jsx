import Seat from "./Seat";
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
          <Seat
  key={`${cell.row}-${cell.col}`}
  cell={cell}
  getSeatLabel={getSeatLabel}
  onClick={() => toggleCell(cell.row, cell.col)}
/>
          ))}
        </div>
      ))}
    </>
  );
}
