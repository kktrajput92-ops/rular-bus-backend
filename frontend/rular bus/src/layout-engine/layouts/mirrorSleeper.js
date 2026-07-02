import { createSeat } from "../helpers";

export default function mirrorSleeper(config = {}) {
  const rows = [];

  const doubleBerths = config.doubleBerths ?? 6;
  const singleBerths = config.singleBerths ?? 6;

  const total = Math.max(doubleBerths, singleBerths);

  let id = 1;

  for (let i = 0; i < total; i++) {
    const rowLetter = String.fromCharCode(65 + i);

    rows.push([
      i < singleBerths
        ? createSeat(id++, `${rowLetter}SL`, "left", "window", "single-lower")
        : null,

      null,

      i < doubleBerths
        ? createSeat(id++, `${rowLetter}DL`, "right", "window", "double-lower")
        : null,
    ]);

    rows.push([
      i < singleBerths
        ? createSeat(id++, `${rowLetter}SU`, "left", "window", "single-upper")
        : null,

      null,

      i < doubleBerths
        ? createSeat(id++, `${rowLetter}DU`, "right", "window", "double-upper")
        : null,
    ]);
  }

  return rows;
}
