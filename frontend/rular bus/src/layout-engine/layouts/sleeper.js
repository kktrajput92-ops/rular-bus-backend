import { createSeat } from "../helpers";

export default function sleeper(totalSeats) {
  const rows = [];

  let seatNumber = 1;
  let rowIndex = 0;

  while (seatNumber <= totalSeats) {
    const rowLetter = String.fromCharCode(65 + rowIndex);

    const row = [];

    // Left Lower Berth
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(
          seatNumber,
          `${rowLetter}L1`,
          "left",
          "window",
          "lower"
        )
      );
      seatNumber++;
    }

    // Left Upper Berth
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(
          seatNumber,
          `${rowLetter}U1`,
          "left",
          "window",
          "upper"
        )
      );
      seatNumber++;
    }

    // Walkway
    row.push(null);

    // Right Lower Berth
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(
          seatNumber,
          `${rowLetter}L2`,
          "right",
          "window",
          "lower"
        )
      );
      seatNumber++;
    }

    // Right Upper Berth
    if (seatNumber <= totalSeats) {
      row.push(
        createSeat(
          seatNumber,
          `${rowLetter}U2`,
          "right",
          "window",
          "upper"
        )
      );
      seatNumber++;
    }

    rows.push(row);
    rowIndex++;
  }

  return rows;
}
