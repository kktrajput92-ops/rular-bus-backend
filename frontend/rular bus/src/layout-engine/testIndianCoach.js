import {
  generateIndianFullSleeper,
  generateIndianMixedCoach,
  generateIndianSeater,
  LAYOUT_PRESETS,
} from "./indianCoachGenerator.js";

const countCells = (
  grid,
  acceptedTypes
) =>
  grid.reduce(
    (total, row) =>
      total +
      row.filter((cell) =>
        acceptedTypes.includes(
          cell.type
        )
      ).length,
    0
  );

const fullSleeper =
  generateIndianFullSleeper({
    driverLowerCapacity: 12,
    driverUpperCapacity: 12,
    conductorLowerCapacity: 6,
    conductorUpperCapacity: 6,
    sharingCapacity: 4,
  });

const mixedCoach =
  generateIndianMixedCoach({
    driverLowerSeatingCapacity: 10,
    driverLowerSleeperCapacity: 4,
    driverUpperSleeperCapacity: 12,
    conductorLowerCapacity: 6,
    conductorUpperCapacity: 6,
    sharingCapacity: 4,
  });

const seater2x2 =
  generateIndianSeater({
    layoutPreset:
      LAYOUT_PRESETS.SEATER_2X2,
    totalSeats: 40,
  });

const seater3x2 =
  generateIndianSeater({
    layoutPreset:
      LAYOUT_PRESETS.SEATER_3X2,
    totalSeats: 50,
  });

console.log(
  "FULL SLEEPER SUMMARY:",
  fullSleeper.summary
);

console.log(
  "FULL LOWER SELLABLE:",
  countCells(
    fullSleeper.lowerGrid,
    [
      "LOWER_BERTH",
      "UPPER_BERTH",
      "SEAT",
    ]
  )
);

console.log(
  "FULL UPPER SELLABLE:",
  countCells(
    fullSleeper.upperGrid,
    [
      "LOWER_BERTH",
      "UPPER_BERTH",
      "SEAT",
    ]
  )
);

console.log(
  "MIXED SUMMARY:",
  mixedCoach.summary
);

console.log(
  "2X2 SUMMARY:",
  seater2x2.summary
);

console.log(
  "3X2 SUMMARY:",
  seater3x2.summary
);

console.log(
  "FULL ORIENTATION:",
  fullSleeper.orientation
);

console.log(
  "UPPER HAS DRIVER:",
  fullSleeper.upperGrid.some(
    (row) =>
      row.some(
        (cell) =>
          cell.type === "DRIVER"
      )
  )
);

console.log(
  "UPPER HAS DOOR:",
  fullSleeper.upperGrid.some(
    (row) =>
      row.some(
        (cell) =>
          cell.type === "DOOR"
      )
  )
);
