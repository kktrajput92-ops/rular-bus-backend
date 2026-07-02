import { createSeat } from "../helpers";

export default function premiumSleeper(config = {}) {
  const rows = [];

  const doubleBerths = config.doubleBerths ?? 6;
  const singleBerths = config.singleBerths ?? 6;

  const total = Math.max(doubleBerths, singleBerths);

  let id = 1;

  for (let i = 0; i < total; i++) {
    const rowLetter = String.fromCharCode(65 + i);

    // ===== LOWER LEVEL =====
    rows.push([
      i < doubleBerths
        ? createSeat(
            id++,
            `${rowLetter}DL`,
            "left",
            "window",
            "double-lower"
          )
        : null,

      null,

      i < singleBerths
        ? createSeat(
            id++,
            `${rowLetter}SL`,
            "right",
            "window",
            "single-lower"
          )
        : null,
    ]);
    // ===== UPPER LEVEL =====
    rows.push([
      i < doubleBerths
        ? createSeat(
            id++,
            `${rowLetter}DU`,
            "left",
            "window",
            "double-upper"
          )
        : null,

      null,

      i < singleBerths
        ? createSeat(
            id++,
            `${rowLetter}SU`,
            "right",
            "window",
            "single-upper"
          )
        : null,
    ]);
  }

  return rows;
}
