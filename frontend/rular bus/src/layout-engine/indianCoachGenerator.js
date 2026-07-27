export const DECKS = {
  LOWER: "LOWER",
  UPPER: "UPPER",
};

export const TYPES = {
  SEAT: "SEAT",
  LOWER_BERTH: "LOWER_BERTH",
  UPPER_BERTH: "UPPER_BERTH",
  AISLE: "AISLE",
  DOOR: "DOOR",
  DRIVER: "DRIVER",
  EXTRA: "EXTRA",
  EMPTY: "EMPTY",
};

export const LAYOUT_MODES = {
  FULL_SEATER: "FULL_SEATER",
  FULL_SLEEPER: "FULL_SLEEPER",
  MIXED_SEATER_SLEEPER:
    "MIXED_SEATER_SLEEPER",
  SEMI_SLEEPER: "SEMI_SLEEPER",
  CUSTOM: "CUSTOM",
};

export const LAYOUT_PRESETS = {
  SEATER_2X2: "SEATER_2X2",
  SEATER_3X2: "SEATER_3X2",
  SEATER_2X1: "SEATER_2X1",
  SEATER_1X1: "SEATER_1X1",
  FULL_SLEEPER: "FULL_SLEEPER",
  MIXED_COACH: "MIXED_COACH",
};

const toInteger = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isInteger(number)
    ? number
    : fallback;
};

const toMoney = (
  value,
  fallback = 0
) => {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? amount
    : fallback;
};

const assertCapacity = (
  label,
  value
) => {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative whole number.`
    );
  }
};

const assertEvenCapacity = (
  label,
  value
) => {
  assertCapacity(label, value);

  if (value % 2 !== 0) {
    throw new Error(
      `${label} must be even.`
    );
  }
};

const assertFare = (
  label,
  value
) => {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be zero or greater.`
    );
  }
};

const createCell = ({
  row,
  col,
  type,
  deck,
  seatNumber = "",
  fare = 0,
  side = null,
  positionKind = null,
  berthGroup = null,
  privateEnabled = false,
  sharingEnabled = false,
  sharingCapacity = 1,
  privateFare = null,
  sharingFare = null,
}) => ({
  row,
  col,
  type,
  deck,
  seat_number: seatNumber,
  fare: Number(fare || 0),
  side,
  position_kind: positionKind,
  berth_group: berthGroup,

  private_booking_enabled:
    Boolean(privateEnabled),

  sharing_booking_enabled:
    Boolean(sharingEnabled),

  sharing_capacity:
    Number(sharingCapacity || 1),

  private_fare:
    privateFare === null
      ? null
      : Number(privateFare),

  sharing_fare:
    sharingFare === null
      ? null
      : Number(sharingFare),
});

const createEmptyCell = (
  row,
  col,
  deck
) =>
  createCell({
    row,
    col,
    type: TYPES.EMPTY,
    deck,
  });

const createGrid = (
  rows,
  columns,
  deck
) =>
  Array.from(
    { length: rows },
    (_, row) =>
      Array.from(
        { length: columns },
        (_, col) =>
          createEmptyCell(
            row,
            col,
            deck
          )
      )
  );

const createAisle = (
  row,
  col,
  deck
) =>
  createCell({
    row,
    col,
    type: TYPES.AISLE,
    deck,
    seatNumber:
      `AISLE_${deck}_${row}_${col}`,
    side: "CENTER",
    positionKind: "AISLE",
  });

const addLowerFrontRow = (
  grid,
  columnCount
) => {
  if (!grid[0]) {
    return;
  }

  grid[0][0] = createCell({
    row: 0,
    col: 0,
    type: TYPES.DOOR,
    deck: DECKS.LOWER,
    seatNumber: "DOOR",
    side: "CONDUCTOR_LEFT",
    positionKind: "ENTRY_DOOR",
  });

  const driverColumn =
    columnCount - 1;

  grid[0][driverColumn] =
    createCell({
      row: 0,
      col: driverColumn,
      type: TYPES.DRIVER,
      deck: DECKS.LOWER,
      seatNumber: "DRIVER",
      side: "DRIVER_RIGHT",
      positionKind: "DRIVER",
    });

  for (
    let col = 1;
    col < driverColumn;
    col += 1
  ) {
    grid[0][col] = createAisle(
      0,
      col,
      DECKS.LOWER
    );
  }
};

const privateOnlyMode = (fare) => ({
  privateEnabled: true,
  sharingEnabled: false,
  sharingCapacity: 1,
  privateFare: fare,
  sharingFare: null,
});

const privateAndSharingMode = ({
  privateFare,
  sharingFare,
  sharingCapacity,
}) => ({
  privateEnabled: true,
  sharingEnabled: true,
  sharingCapacity,
  privateFare,
  sharingFare,
});

const getSeaterPattern = (
  preset
) => {
  switch (preset) {
    case LAYOUT_PRESETS.SEATER_3X2:
      return {
        leftSeats: 2,
        rightSeats: 3,
      };

    case LAYOUT_PRESETS.SEATER_2X1:
      return {
        leftSeats: 1,
        rightSeats: 2,
      };

    case LAYOUT_PRESETS.SEATER_1X1:
      return {
        leftSeats: 1,
        rightSeats: 1,
      };

    case LAYOUT_PRESETS.SEATER_2X2:
    default:
      return {
        leftSeats: 2,
        rightSeats: 2,
      };
  }
};

export const generateIndianSeater =
  (config = {}) => {
    const preset =
      config.layoutPreset ||
      LAYOUT_PRESETS.SEATER_2X2;

    const totalSeats = toInteger(
      config.totalSeats,
      40
    );

    const fare = toMoney(
      config.seatFare,
      450
    );

    assertCapacity(
      "Total seats",
      totalSeats
    );

    assertFare(
      "Seat fare",
      fare
    );

    if (totalSeats === 0) {
      throw new Error(
        "Total seats must be greater than zero."
      );
    }

    const {
      leftSeats,
      rightSeats,
    } = getSeaterPattern(preset);

    const seatsPerRow =
      leftSeats + rightSeats;

    const passengerRows = Math.ceil(
      totalSeats / seatsPerRow
    );

    const aisleColumn = leftSeats;

    const columnCount =
      leftSeats + 1 + rightSeats;

    const grid = createGrid(
      passengerRows + 1,
      columnCount,
      DECKS.LOWER
    );

    addLowerFrontRow(
      grid,
      columnCount
    );

    let seatCounter = 1;

    for (
      let row = 1;
      row <= passengerRows;
      row += 1
    ) {
      grid[row][aisleColumn] =
        createAisle(
          row,
          aisleColumn,
          DECKS.LOWER
        );

      for (
        let col = 0;
        col < leftSeats;
        col += 1
      ) {
        if (
          seatCounter > totalSeats
        ) {
          break;
        }

        grid[row][col] =
          createCell({
            row,
            col,
            type: TYPES.SEAT,
            deck: DECKS.LOWER,
            seatNumber:
              String(seatCounter),
            fare,
            side:
              "CONDUCTOR_LEFT",
            positionKind:
              col === 0
                ? "WINDOW"
                : "SEATER",
            ...privateOnlyMode(
              fare
            ),
          });

        seatCounter += 1;
      }

      for (
        let rightIndex = 0;
        rightIndex < rightSeats;
        rightIndex += 1
      ) {
        if (
          seatCounter > totalSeats
        ) {
          break;
        }

        const col =
          aisleColumn +
          1 +
          rightIndex;

        grid[row][col] =
          createCell({
            row,
            col,
            type: TYPES.SEAT,
            deck: DECKS.LOWER,
            seatNumber:
              String(seatCounter),
            fare,
            side:
              "DRIVER_RIGHT",
            positionKind:
              rightIndex ===
              rightSeats - 1
                ? "WINDOW"
                : "SEATER",
            ...privateOnlyMode(
              fare
            ),
          });

        seatCounter += 1;
      }
    }

    return {
      mode:
        LAYOUT_MODES.FULL_SEATER,

      preset,

      orientation: {
        steering:
          "RIGHT_HAND_DRIVE",
        conductor_side: "LEFT",
        driver_side: "RIGHT",
      },

      lowerGrid: grid,
      upperGrid: [],

      summary: {
        lowerCapacity: totalSeats,
        upperCapacity: 0,
        totalCapacity: totalSeats,
        seatingCapacity:
          totalSeats,
        sleeperCapacity: 0,
      },
    };
  };

export const generateIndianFullSleeper =
  (config = {}) => {
    const conductorLowerCapacity =
      toInteger(
        config.conductorLowerCapacity,
        6
      );

    const conductorUpperCapacity =
      toInteger(
        config.conductorUpperCapacity,
        6
      );

    const driverLowerCapacity =
      toInteger(
        config.driverLowerCapacity,
        12
      );

    const driverUpperCapacity =
      toInteger(
        config.driverUpperCapacity,
        12
      );

    const singleLowerFare =
      toMoney(
        config.singleLowerFare,
        600
      );

    const singleUpperFare =
      toMoney(
        config.singleUpperFare,
        600
      );

    const doubleLowerPrivateFare =
      toMoney(
        config.doubleLowerPrivateFare,
        1800
      );

    const doubleLowerSharingFare =
      toMoney(
        config.doubleLowerSharingFare,
        550
      );

    const doubleUpperPrivateFare =
      toMoney(
        config.doubleUpperPrivateFare,
        1800
      );

    const doubleUpperSharingFare =
      toMoney(
        config.doubleUpperSharingFare,
        550
      );

    const sharingCapacity =
      toInteger(
        config.sharingCapacity,
        4
      );

    assertCapacity(
      "Conductor lower capacity",
      conductorLowerCapacity
    );

    assertCapacity(
      "Conductor upper capacity",
      conductorUpperCapacity
    );

    assertEvenCapacity(
      "Driver lower capacity",
      driverLowerCapacity
    );

    assertEvenCapacity(
      "Driver upper capacity",
      driverUpperCapacity
    );

    [
      [
        "Single lower fare",
        singleLowerFare,
      ],
      [
        "Single upper fare",
        singleUpperFare,
      ],
      [
        "Double lower private fare",
        doubleLowerPrivateFare,
      ],
      [
        "Double lower sharing fare",
        doubleLowerSharingFare,
      ],
      [
        "Double upper private fare",
        doubleUpperPrivateFare,
      ],
      [
        "Double upper sharing fare",
        doubleUpperSharingFare,
      ],
    ].forEach(
      ([label, value]) =>
        assertFare(label, value)
    );

    if (
      sharingCapacity < 2 ||
      sharingCapacity > 10
    ) {
      throw new Error(
        "Sharing capacity must be between 2 and 10."
      );
    }

    const lowerRows = Math.max(
      conductorLowerCapacity,
      driverLowerCapacity / 2
    );

    const upperRows = Math.max(
      conductorUpperCapacity,
      driverUpperCapacity / 2
    );

    const lowerGrid = createGrid(
      lowerRows + 1,
      4,
      DECKS.LOWER
    );

    const upperGrid = createGrid(
      upperRows,
      4,
      DECKS.UPPER
    );

    addLowerFrontRow(
      lowerGrid,
      4
    );

    let singleLower = 1;
    let doubleLowerPosition = 1;

    for (
      let row = 1;
      row <= lowerRows;
      row += 1
    ) {
      lowerGrid[row][1] =
        createAisle(
          row,
          1,
          DECKS.LOWER
        );

      if (
        singleLower <=
        conductorLowerCapacity
      ) {
        lowerGrid[row][0] =
          createCell({
            row,
            col: 0,
            type:
              TYPES.LOWER_BERTH,
            deck: DECKS.LOWER,
            seatNumber:
              `SL${singleLower}`,
            fare:
              singleLowerFare,
            side:
              "CONDUCTOR_LEFT",
            positionKind:
              "SINGLE_LOWER",
            ...privateOnlyMode(
              singleLowerFare
            ),
          });

        singleLower += 1;
      }

      const berthGroup =
        `DLB${row}`;

      for (
        let position = 0;
        position < 2;
        position += 1
      ) {
        if (
          doubleLowerPosition >
          driverLowerCapacity
        ) {
          break;
        }

        lowerGrid[row][
          2 + position
        ] = createCell({
          row,
          col: 2 + position,
          type:
            TYPES.LOWER_BERTH,
          deck: DECKS.LOWER,
          seatNumber:
            `DL${doubleLowerPosition}`,
          fare:
            doubleLowerSharingFare,
          side: "DRIVER_RIGHT",
          positionKind:
            "DOUBLE_LOWER",
          berthGroup,
          ...privateAndSharingMode({
            privateFare:
              doubleLowerPrivateFare,
            sharingFare:
              doubleLowerSharingFare,
            sharingCapacity,
          }),
        });

        doubleLowerPosition += 1;
      }
    }

    let singleUpper = 1;
    let doubleUpperPosition = 1;

    for (
      let row = 0;
      row < upperRows;
      row += 1
    ) {
      upperGrid[row][1] =
        createAisle(
          row,
          1,
          DECKS.UPPER
        );

      if (
        singleUpper <=
        conductorUpperCapacity
      ) {
        upperGrid[row][0] =
          createCell({
            row,
            col: 0,
            type:
              TYPES.UPPER_BERTH,
            deck: DECKS.UPPER,
            seatNumber:
              `SU${singleUpper}`,
            fare:
              singleUpperFare,
            side:
              "CONDUCTOR_LEFT",
            positionKind:
              "SINGLE_UPPER",
            ...privateOnlyMode(
              singleUpperFare
            ),
          });

        singleUpper += 1;
      }

      const berthGroup =
        `DUB${row + 1}`;

      for (
        let position = 0;
        position < 2;
        position += 1
      ) {
        if (
          doubleUpperPosition >
          driverUpperCapacity
        ) {
          break;
        }

        upperGrid[row][
          2 + position
        ] = createCell({
          row,
          col: 2 + position,
          type:
            TYPES.UPPER_BERTH,
          deck: DECKS.UPPER,
          seatNumber:
            `DU${doubleUpperPosition}`,
          fare:
            doubleUpperSharingFare,
          side: "DRIVER_RIGHT",
          positionKind:
            "DOUBLE_UPPER",
          berthGroup,
          ...privateAndSharingMode({
            privateFare:
              doubleUpperPrivateFare,
            sharingFare:
              doubleUpperSharingFare,
            sharingCapacity,
          }),
        });

        doubleUpperPosition += 1;
      }
    }

    const lowerCapacity =
      conductorLowerCapacity +
      driverLowerCapacity;

    const upperCapacity =
      conductorUpperCapacity +
      driverUpperCapacity;

    return {
      mode:
        LAYOUT_MODES.FULL_SLEEPER,

      preset:
        LAYOUT_PRESETS.FULL_SLEEPER,

      orientation: {
        steering:
          "RIGHT_HAND_DRIVE",
        conductor_side: "LEFT",
        driver_side: "RIGHT",
      },

      lowerGrid,
      upperGrid,

      summary: {
        lowerCapacity,
        upperCapacity,
        totalCapacity:
          lowerCapacity +
          upperCapacity,
        seatingCapacity: 0,
        sleeperCapacity:
          lowerCapacity +
          upperCapacity,
      },
    };
  };

export const generateIndianMixedCoach =
  (config = {}) => {
    const driverLowerSeatingCapacity =
      toInteger(
        config.driverLowerSeatingCapacity,
        10
      );

    const driverLowerSleeperCapacity =
      toInteger(
        config.driverLowerSleeperCapacity,
        4
      );

    const driverUpperSleeperCapacity =
      toInteger(
        config.driverUpperSleeperCapacity,
        12
      );

    const conductorLowerCapacity =
      toInteger(
        config.conductorLowerCapacity,
        6
      );

    const conductorUpperCapacity =
      toInteger(
        config.conductorUpperCapacity,
        6
      );

    const sittingFare =
      toMoney(
        config.sittingFare,
        450
      );

    const singleLowerFare =
      toMoney(
        config.singleLowerFare,
        600
      );

    const singleUpperFare =
      toMoney(
        config.singleUpperFare,
        600
      );

    const doubleLowerPrivateFare =
      toMoney(
        config.doubleLowerPrivateFare,
        1800
      );

    const doubleLowerSharingFare =
      toMoney(
        config.doubleLowerSharingFare,
        550
      );

    const doubleUpperPrivateFare =
      toMoney(
        config.doubleUpperPrivateFare,
        1800
      );

    const doubleUpperSharingFare =
      toMoney(
        config.doubleUpperSharingFare,
        550
      );

    const sharingCapacity =
      toInteger(
        config.sharingCapacity,
        4
      );

    assertEvenCapacity(
      "Driver lower seating capacity",
      driverLowerSeatingCapacity
    );

    assertEvenCapacity(
      "Driver lower sleeper capacity",
      driverLowerSleeperCapacity
    );

    assertEvenCapacity(
      "Driver upper sleeper capacity",
      driverUpperSleeperCapacity
    );

    assertCapacity(
      "Conductor lower capacity",
      conductorLowerCapacity
    );

    assertCapacity(
      "Conductor upper capacity",
      conductorUpperCapacity
    );

    [
      ["Sitting fare", sittingFare],
      [
        "Single lower fare",
        singleLowerFare,
      ],
      [
        "Single upper fare",
        singleUpperFare,
      ],
      [
        "Double lower private fare",
        doubleLowerPrivateFare,
      ],
      [
        "Double lower sharing fare",
        doubleLowerSharingFare,
      ],
      [
        "Double upper private fare",
        doubleUpperPrivateFare,
      ],
      [
        "Double upper sharing fare",
        doubleUpperSharingFare,
      ],
    ].forEach(
      ([label, value]) =>
        assertFare(label, value)
    );

    if (
      sharingCapacity < 2 ||
      sharingCapacity > 10
    ) {
      throw new Error(
        "Sharing capacity must be between 2 and 10."
      );
    }

    const seatingRows =
      driverLowerSeatingCapacity / 2;

    const lowerSleeperRows =
      driverLowerSleeperCapacity / 2;

    const driverLowerRows =
      seatingRows +
      lowerSleeperRows;

    const lowerRows = Math.max(
      conductorLowerCapacity,
      driverLowerRows
    );

    const upperRows = Math.max(
      conductorUpperCapacity,
      driverUpperSleeperCapacity /
        2
    );

    const lowerGrid = createGrid(
      lowerRows + 1,
      4,
      DECKS.LOWER
    );

    const upperGrid = createGrid(
      upperRows,
      4,
      DECKS.UPPER
    );

    addLowerFrontRow(
      lowerGrid,
      4
    );

    let conductorLower = 1;
    let seaterNumber = 1;
    let lowerSleeperPosition = 1;

    for (
      let row = 1;
      row <= lowerRows;
      row += 1
    ) {
      lowerGrid[row][1] =
        createAisle(
          row,
          1,
          DECKS.LOWER
        );

      if (
        conductorLower <=
        conductorLowerCapacity
      ) {
        lowerGrid[row][0] =
          createCell({
            row,
            col: 0,
            type:
              TYPES.LOWER_BERTH,
            deck: DECKS.LOWER,
            seatNumber:
              `SL${conductorLower}`,
            fare:
              singleLowerFare,
            side:
              "CONDUCTOR_LEFT",
            positionKind:
              "SINGLE_LOWER",
            ...privateOnlyMode(
              singleLowerFare
            ),
          });

        conductorLower += 1;
      }

      if (row <= seatingRows) {
        for (
          let position = 0;
          position < 2;
          position += 1
        ) {
          lowerGrid[row][
            2 + position
          ] = createCell({
            row,
            col: 2 + position,
            type: TYPES.SEAT,
            deck: DECKS.LOWER,
            seatNumber:
              `S${seaterNumber}`,
            fare: sittingFare,
            side:
              "DRIVER_RIGHT",
            positionKind:
              "NORMAL_SEATER",
            ...privateOnlyMode(
              sittingFare
            ),
          });

          seaterNumber += 1;
        }
      } else if (
        row <=
        seatingRows +
          lowerSleeperRows
      ) {
        const groupNumber =
          row - seatingRows;

        const berthGroup =
          `DLB${groupNumber}`;

        for (
          let position = 0;
          position < 2;
          position += 1
        ) {
          lowerGrid[row][
            2 + position
          ] = createCell({
            row,
            col: 2 + position,
            type:
              TYPES.LOWER_BERTH,
            deck: DECKS.LOWER,
            seatNumber:
              `DL${lowerSleeperPosition}`,
            fare:
              doubleLowerSharingFare,
            side:
              "DRIVER_RIGHT",
            positionKind:
              "DOUBLE_LOWER",
            berthGroup,
            ...privateAndSharingMode({
              privateFare:
                doubleLowerPrivateFare,
              sharingFare:
                doubleLowerSharingFare,
              sharingCapacity,
            }),
          });

          lowerSleeperPosition += 1;
        }
      }
    }

    let conductorUpper = 1;
    let upperSleeperPosition = 1;

    for (
      let row = 0;
      row < upperRows;
      row += 1
    ) {
      upperGrid[row][1] =
        createAisle(
          row,
          1,
          DECKS.UPPER
        );

      if (
        conductorUpper <=
        conductorUpperCapacity
      ) {
        upperGrid[row][0] =
          createCell({
            row,
            col: 0,
            type:
              TYPES.UPPER_BERTH,
            deck: DECKS.UPPER,
            seatNumber:
              `SU${conductorUpper}`,
            fare:
              singleUpperFare,
            side:
              "CONDUCTOR_LEFT",
            positionKind:
              "SINGLE_UPPER",
            ...privateOnlyMode(
              singleUpperFare
            ),
          });

        conductorUpper += 1;
      }

      const berthGroup =
        `DUB${row + 1}`;

      for (
        let position = 0;
        position < 2;
        position += 1
      ) {
        if (
          upperSleeperPosition >
          driverUpperSleeperCapacity
        ) {
          break;
        }

        upperGrid[row][
          2 + position
        ] = createCell({
          row,
          col: 2 + position,
          type:
            TYPES.UPPER_BERTH,
          deck: DECKS.UPPER,
          seatNumber:
            `DU${upperSleeperPosition}`,
          fare:
            doubleUpperSharingFare,
          side: "DRIVER_RIGHT",
          positionKind:
            "DOUBLE_UPPER",
          berthGroup,
          ...privateAndSharingMode({
            privateFare:
              doubleUpperPrivateFare,
            sharingFare:
              doubleUpperSharingFare,
            sharingCapacity,
          }),
        });

        upperSleeperPosition += 1;
      }
    }

    const lowerSleeperCapacity =
      conductorLowerCapacity +
      driverLowerSleeperCapacity;

    const upperSleeperCapacity =
      conductorUpperCapacity +
      driverUpperSleeperCapacity;

    return {
      mode:
        LAYOUT_MODES
          .MIXED_SEATER_SLEEPER,

      preset:
        LAYOUT_PRESETS.MIXED_COACH,

      orientation: {
        steering:
          "RIGHT_HAND_DRIVE",
        conductor_side: "LEFT",
        driver_side: "RIGHT",
      },

      lowerGrid,
      upperGrid,

      summary: {
        seatingCapacity:
          driverLowerSeatingCapacity,

        lowerSleeperCapacity,

        upperSleeperCapacity,

        sleeperCapacity:
          lowerSleeperCapacity +
          upperSleeperCapacity,

        lowerCapacity:
          driverLowerSeatingCapacity +
          lowerSleeperCapacity,

        upperCapacity:
          upperSleeperCapacity,

        totalCapacity:
          driverLowerSeatingCapacity +
          lowerSleeperCapacity +
          upperSleeperCapacity,
      },
    };
  };

export const generateIndianLayout =
  (config = {}) => {
    const mode =
      config.layoutMode ||
      config.layout_mode ||
      LAYOUT_MODES.FULL_SLEEPER;

    switch (mode) {
      case LAYOUT_MODES.FULL_SEATER:
        return generateIndianSeater(
          config
        );

      case LAYOUT_MODES
        .MIXED_SEATER_SLEEPER:
        return generateIndianMixedCoach(
          config
        );

      case LAYOUT_MODES.FULL_SLEEPER:
        return generateIndianFullSleeper(
          config
        );

      default:
        throw new Error(
          `Generator is not available for ${mode}.`
        );
    }
  };
