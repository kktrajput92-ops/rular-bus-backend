import { generateLayout } from "../../layout-engine/generateLayout";
import SeatButton from "./SeatButton";
import Bed from "./Bed";
export default function SeatRenderer({
  layout,
  totalSeats,
  layoutType,
  bookedSeats,
  selectedSeats,
  onSeatClick,
}) {
  const rows =
  layout && layout.length
    ? (() => {
        const grid = [];

        layout.forEach((item) => {
          if (!grid[item.row_no]) {
            grid[item.row_no] = [];
          }

          grid[item.row_no][item.col_no] = {
            id: item.seat_no,
            label: item.seat_no,
            type: item.seat_type,
          };
        });

        return grid.map((row) =>
          row ? row.map((cell) => cell || null) : []
        );
      })()
    : generateLayout({
        totalSeats,
        layoutType,
      });
console.log("SeatRenderer rows:", rows);
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
            gap: "28px",
            marginBottom: "20px",
          }}
        >
          {row.map((seat, index) => {

            if (seat === null) {
              return (
                <div
                  key={index}
                  style={{
                   width: 110,
                  }}
                />
              );
            }
if (
  seat.type === "DOOR" ||
  seat.type === "AISLE" ||
  seat.type === "DRIVER"
) {
  return (
    <div
      key={seat.id}
      style={{
        width: 64,
        height: 64,
      }}
    />
  );
}
            return ( 

 seat.type?.includes("lower") || seat.type?.includes("upper") ? (
  <Bed
    key={seat.id}
    label={seat.label}
    type={seat.type}
    booked={bookedSeats.includes(seat.id)}
    selected={selectedSeats.includes(seat.id)}
    onClick={() => onSeatClick(seat.id)}
  />
) : (
  <SeatButton
    key={seat.id}
    seat={seat}
    bookedSeats={bookedSeats}
    selectedSeats={selectedSeats}
    onSeatClick={onSeatClick}
  />
)
);         

          })}
        </div>
      ))}
    </div>
  );
}
