import { createSeat } from "../helpers";

export default function layout3x2(totalSeats) {
  const rows = [];

  let seatNumber = 1;
  let rowIndex = 0;

  while (seatNumber <= totalSeats) {
    const rowLetter = String.fromCharCode(65 + rowIndex);

    const row = [];

    // Left Window
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(seatNumber, `${rowLetter}1`, "left", "window")
      );
      seatNumber++;
    }

    // Left Middle
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(seatNumber, `${rowLetter}2`, "left", "middle")
      );
      seatNumber++;
    }

    // Left Aisle
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(seatNumber, `${rowLetter}3`, "left", "aisle")
      );
      seatNumber++;
    }

    // Walkway
    row.push(null);

    // Right Aisle
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(seatNumber, `${rowLetter}4`, "right", "aisle")
      );
      seatNumber++;
    }

    // Right Window
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(seatNumber, `${rowLetter}5`, "right", "window")
      );
      seatNumber++;
    }

    rows.push(row);
    rowIndex++;
  }

  return rows;
}
