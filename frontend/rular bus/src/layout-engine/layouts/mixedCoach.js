import { createSeat } from "../helpers";

export default function mixedCoach(config = {}) {
  const rows = [];

  const seatRows = config.seatRows ?? 4;
  const sleeperRows = config.sleeperRows ?? 4;

  let id = 1;

  // Front Seater
  for (let i = 0; i < seatRows; i++) {
    const rowLetter = String.fromCharCode(65 + i);

    rows.push([
      createSeat(id++, `${rowLetter}1`, "left", "window"),
      createSeat(id++, `${rowLetter}2`, "left", "aisle"),
      null,
      createSeat(id++, `${rowLetter}3`, "right", "aisle"),
      createSeat(id++, `${rowLetter}4`, "right", "window"),
    ]);
  }

  // Rear Sleeper
  for (let i = 0; i < sleeperRows; i++) {
    const rowLetter = String.fromCharCode(65 + seatRows + i);

    rows.push([
      createSeat(id++, `${rowLetter}DL`, "left", "window", "double-lower"),
      null,
      createSeat(id++, `${rowLetter}SL`, "right", "window", "single-lower"),
    ]);

    rows.push([
      createSeat(id++, `${rowLetter}DU`, "left", "window", "double-upper"),
      null,
      createSeat(id++, `${rowLetter}SU`, "right", "window", "single-upper"),
    ]);
  }

  return rows;
}
