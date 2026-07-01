export default function layout2x2(totalSeats) {
  const rows = [];

  let seatNumber = 1;
  let rowIndex = 0;

  while (seatNumber <= totalSeats) {
    const rowLetter = String.fromCharCode(65 + rowIndex);

    const row = [];

    // Left Window
    if (seatNumber <= totalSeats) {
      row.push({
        id: seatNumber,
        label: `${rowLetter}1`,
        side: "left",
        position: "window",
        status: "available",
        type: "normal",
      });
      seatNumber++;
    }

    // Left Aisle
    if (seatNumber <= totalSeats) {
      row.push({
        id: seatNumber,
        label: `${rowLetter}2`,
        side: "left",
        position: "aisle",
        status: "available",
        type: "normal",
      });
      seatNumber++;
    }

    // Walkway
    row.push(null);

    // Right Aisle
    if (seatNumber <= totalSeats) {
      row.push({
        id: seatNumber,
        label: `${rowLetter}3`,
        side: "right",
        position: "aisle",
        status: "available",
        type: "normal",
      });
      seatNumber++;
    }

    // Right Window
    if (seatNumber <= totalSeats) {
      row.push({
        id: seatNumber,
        label: `${rowLetter}4`,
        side: "right",
        position: "window",
        status: "available",
        type: "normal",
      });
      seatNumber++;
    }

    rows.push(row);
    rowIndex++;
  }

  return rows;
}
