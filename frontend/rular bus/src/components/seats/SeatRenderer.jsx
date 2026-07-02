import { generateLayout } from "../../layout-engine/generateLayout";
import SeatButton from "./SeatButton";
import Bed from "./Bed";
export default function SeatRenderer({
  totalSeats,
  layoutType,
  bookedSeats,
  selectedSeats,
  onSeatClick,
}) {
  const rows = generateLayout({
  totalSeats,
  layoutType,
});

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
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {row.map((seat, index) => {

            if (seat === null) {
              return (
                <div
                  key={index}
                  style={{
                   width: 60,
                  }}
                />
              );
            }

            return ( 

 seat.type === "upper" || seat.type === "lower" ? (
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
