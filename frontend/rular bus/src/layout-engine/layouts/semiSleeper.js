import { createSeat } from "../helpers";

export default function semiSleeper(config = {}) {
  const rows = [];

  const upperBerths = config.upperBerths ?? 6;
  const lowerSeats = config.lowerSeats ?? 6;

  const total = Math.max(upperBerths, lowerSeats);

  let id = 1;

  for (let i = 0; i < total; i++) {
    const rowLetter = String.fromCharCode(65 + i);

    rows.push([
      i < upperBerths
        ? createSeat(id++, `${rowLetter}U`, "left", "window", "upper")
        : null,

      null,

      i < lowerSeats
        ? createSeat(id++, `${rowLetter}S`, "right", "window", "normal")
        : null,
    ]);
  }

  return rows;
}
