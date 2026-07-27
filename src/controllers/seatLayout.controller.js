const pool = require("../config/db");

const VALID_LAYOUT_MODES = new Set([
  "FULL_SEATER",
  "FULL_SLEEPER",
  "MIXED_SEATER_SLEEPER",
  "SEMI_SLEEPER",
  "CUSTOM",
]);

const VALID_SIDES = new Set([
  "CONDUCTOR_LEFT",
  "DRIVER_RIGHT",
  "CENTER",
  "FULL_WIDTH",
]);

const SELLABLE_TYPES = new Set([
  "SEAT",
  "SEATER",
  "LOWER_BERTH",
  "UPPER_BERTH",
]);

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes", "on"].includes(
    String(value).trim().toLowerCase()
  );
};

const normalizeNullableMoney = (value, fieldName) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error(
      `${fieldName} must be zero or greater.`
    );

    error.status = 400;
    throw error;
  }

  return amount;
};

const normalizeLayoutConfig = (input = {}) => {
  const layoutMode = String(
    input.layout_mode || "CUSTOM"
  )
    .trim()
    .toUpperCase();

  if (!VALID_LAYOUT_MODES.has(layoutMode)) {
    const error = new Error(
      "Invalid layout mode."
    );

    error.status = 400;
    throw error;
  }

  const layoutPreset =
    input.layout_preset === undefined ||
    input.layout_preset === null ||
    String(input.layout_preset).trim() === ""
      ? null
      : String(input.layout_preset)
          .trim()
          .toUpperCase();

  const configuration =
    input.configuration &&
    typeof input.configuration === "object" &&
    !Array.isArray(input.configuration)
      ? input.configuration
      : {};

  return {
    layout_mode: layoutMode,
    layout_preset: layoutPreset,
    steering_position: "RIGHT_HAND_DRIVE",
    conductor_side: "LEFT",
    driver_side: "RIGHT",
    lower_deck_enabled: normalizeBoolean(
      input.lower_deck_enabled,
      true
    ),
    upper_deck_enabled: normalizeBoolean(
      input.upper_deck_enabled,
      false
    ),
    configuration,
  };
};

const normalizeLayoutItem = (item, index) => {
  const seatNo = String(
    item.seat_no || ""
  ).trim();

  const seatType = String(
    item.seat_type || ""
  )
    .trim()
    .toUpperCase();

  const rawDeck = String(
    item.deck ?? "LOWER"
  )
    .trim()
    .toUpperCase();

  const deck =
    rawDeck === "2" || rawDeck === "UPPER"
      ? "UPPER"
      : "LOWER";

  const rowNo = Number(item.row_no);
  const colNo = Number(item.col_no);
  const fare = Number(item.fare || 0);

  const rawSide =
    item.side === undefined ||
    item.side === null ||
    String(item.side).trim() === ""
      ? null
      : String(item.side)
          .trim()
          .toUpperCase();

  const positionKind =
    item.position_kind === undefined ||
    item.position_kind === null ||
    String(item.position_kind).trim() === ""
      ? null
      : String(item.position_kind)
          .trim()
          .toUpperCase();

  const berthGroup =
    item.berth_group === undefined ||
    item.berth_group === null ||
    String(item.berth_group).trim() === ""
      ? null
      : String(item.berth_group)
          .trim()
          .toUpperCase();

  if (!seatNo) {
    const error = new Error(
      `Seat number is required at item ${index + 1}.`
    );

    error.status = 400;
    throw error;
  }

  if (!seatType) {
    const error = new Error(
      `Seat type is required for ${seatNo}.`
    );

    error.status = 400;
    throw error;
  }

  if (
    !Number.isInteger(rowNo) ||
    rowNo < 0 ||
    !Number.isInteger(colNo) ||
    colNo < 0
  ) {
    const error = new Error(
      `Valid row and column are required for ${seatNo}.`
    );

    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(fare) || fare < 0) {
    const error = new Error(
      `Fare cannot be negative for ${seatNo}.`
    );

    error.status = 400;
    throw error;
  }

  if (rawSide && !VALID_SIDES.has(rawSide)) {
    const error = new Error(
      `Invalid side value for ${seatNo}.`
    );

    error.status = 400;
    throw error;
  }

  if (
    deck === "UPPER" &&
    ["DRIVER", "DOOR"].includes(seatType)
  ) {
    const error = new Error(
      `${seatType} cannot be placed on the upper deck.`
    );

    error.status = 400;
    throw error;
  }

  const isSellable = SELLABLE_TYPES.has(
    seatType
  );

  const privateBookingEnabled = isSellable
    ? normalizeBoolean(
        item.private_booking_enabled,
        true
      )
    : false;

  const sharingBookingEnabled = isSellable
    ? normalizeBoolean(
        item.sharing_booking_enabled,
        false
      )
    : false;

  const sharingCapacity = isSellable
    ? Number(item.sharing_capacity || 1)
    : 1;

  if (
    !Number.isInteger(sharingCapacity) ||
    sharingCapacity < 1 ||
    sharingCapacity > 10
  ) {
    const error = new Error(
      `Sharing capacity for ${seatNo} must be between 1 and 10.`
    );

    error.status = 400;
    throw error;
  }

  if (
    sharingBookingEnabled &&
    sharingCapacity < 2
  ) {
    const error = new Error(
      `Sharing capacity for ${seatNo} must be at least 2 when sharing is enabled.`
    );

    error.status = 400;
    throw error;
  }

  if (
    isSellable &&
    !privateBookingEnabled &&
    !sharingBookingEnabled
  ) {
    const error = new Error(
      `${seatNo} must allow private booking, sharing booking, or both.`
    );

    error.status = 400;
    throw error;
  }

  const privateFare = isSellable
    ? normalizeNullableMoney(
        item.private_fare,
        `Private fare for ${seatNo}`
      )
    : null;

  const sharingFare = isSellable
    ? normalizeNullableMoney(
        item.sharing_fare,
        `Sharing fare for ${seatNo}`
      )
    : null;

  if (
    sharingBookingEnabled &&
    sharingFare === null
  ) {
    const error = new Error(
      `Sharing fare is required for ${seatNo}.`
    );

    error.status = 400;
    throw error;
  }

  return {
    seat_no: seatNo,
    seat_type: seatType,
    deck,
    row_no: rowNo,
    col_no: colNo,

    is_driver:
      normalizeBoolean(item.is_driver) ||
      seatType === "DRIVER",

    is_door:
      normalizeBoolean(item.is_door) ||
      seatType === "DOOR",

    is_aisle:
      normalizeBoolean(item.is_aisle) ||
      seatType === "AISLE",

    is_extra:
      normalizeBoolean(item.is_extra) ||
      seatType === "EXTRA",

    fare,
    side: rawSide,
    position_kind: positionKind,
    berth_group: berthGroup,

    private_booking_enabled:
      privateBookingEnabled,

    sharing_booking_enabled:
      sharingBookingEnabled,

    sharing_capacity: sharingCapacity,

    private_fare:
      privateFare ??
      (privateBookingEnabled ? fare : null),

    sharing_fare:
      sharingFare ??
      (sharingBookingEnabled ? fare : null),
  };
};

// ===============================
// Get Layout
// ===============================
const getLayout = async (req, res) => {
  try {
    const busId = Number(req.params.busId);

    if (
      !Number.isInteger(busId) ||
      busId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid bus ID is required.",
      });
    }

    const [layoutResult, configResult] =
      await Promise.all([
        pool.query(
          `SELECT *
           FROM seat_layouts
           WHERE bus_id = $1
           ORDER BY
             CASE
               WHEN deck = 'LOWER' THEN 1
               WHEN deck = 'UPPER' THEN 2
               ELSE 3
             END,
             row_no,
             col_no`,
          [busId]
        ),

        pool.query(
          `SELECT
             id,
             bus_id,
             layout_mode,
             layout_preset,
             steering_position,
             conductor_side,
             driver_side,
             lower_deck_enabled,
             upper_deck_enabled,
             configuration,
             created_at,
             updated_at
           FROM bus_seat_layout_configs
           WHERE bus_id = $1`,
          [busId]
        ),
      ]);

    return res.json({
      success: true,
      layout: layoutResult.rows,
      config:
        configResult.rows[0] || {
          bus_id: busId,
          layout_mode: "CUSTOM",
          layout_preset: null,
          steering_position:
            "RIGHT_HAND_DRIVE",
          conductor_side: "LEFT",
          driver_side: "RIGHT",
          lower_deck_enabled: true,
          upper_deck_enabled: false,
          configuration: {},
        },
    });
  } catch (error) {
    console.error(
      "Get seat layout failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load seat layout.",
    });
  }
};

// ===============================
// Save Layout
// ===============================
const saveLayout = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const busId = Number(req.params.busId);

    const {
      layout,
      config = {},
    } = req.body;

    if (
      !Number.isInteger(busId) ||
      busId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid bus ID is required.",
      });
    }

    if (!Array.isArray(layout)) {
      return res.status(400).json({
        success: false,
        message: "Layout must be an array.",
      });
    }

    const normalizedConfig =
      normalizeLayoutConfig(config);

    const busResult = await client.query(
      `SELECT
         id,
         total_seats
       FROM buses
       WHERE id = $1`,
      [busId]
    );

    if (busResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bus not found.",
      });
    }

    const normalizedLayout = layout.map(
      normalizeLayoutItem
    );

    const seatNumbers = normalizedLayout.map(
      (item) => item.seat_no.toLowerCase()
    );

    if (
      new Set(seatNumbers).size !==
      seatNumbers.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate seat numbers are not allowed.",
      });
    }

    const positionKeys = normalizedLayout.map(
      (item) =>
        `${item.deck}:${item.row_no}:${item.col_no}`
    );

    if (
      new Set(positionKeys).size !==
      positionKeys.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate deck, row and column positions are not allowed.",
      });
    }

    const hasUpperItems =
      normalizedLayout.some(
        (item) => item.deck === "UPPER"
      );

    normalizedConfig.upper_deck_enabled =
      normalizedConfig.upper_deck_enabled ||
      hasUpperItems;

    await client.query("BEGIN");
    transactionStarted = true;

    await client.query(
      "SELECT pg_advisory_xact_lock($1)",
      [busId]
    );

    await client.query(
      `INSERT INTO bus_seat_layout_configs
       (
         bus_id,
         layout_mode,
         layout_preset,
         steering_position,
         conductor_side,
         driver_side,
         lower_deck_enabled,
         upper_deck_enabled,
         configuration,
         updated_at
       )
       VALUES
       (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9, CURRENT_TIMESTAMP
       )
       ON CONFLICT (bus_id)
       DO UPDATE SET
         layout_mode = EXCLUDED.layout_mode,
         layout_preset = EXCLUDED.layout_preset,
         steering_position =
           EXCLUDED.steering_position,
         conductor_side =
           EXCLUDED.conductor_side,
         driver_side =
           EXCLUDED.driver_side,
         lower_deck_enabled =
           EXCLUDED.lower_deck_enabled,
         upper_deck_enabled =
           EXCLUDED.upper_deck_enabled,
         configuration =
           EXCLUDED.configuration,
         updated_at = CURRENT_TIMESTAMP`,
      [
        busId,
        normalizedConfig.layout_mode,
        normalizedConfig.layout_preset,
        normalizedConfig.steering_position,
        normalizedConfig.conductor_side,
        normalizedConfig.driver_side,
        normalizedConfig.lower_deck_enabled,
        normalizedConfig.upper_deck_enabled,
        JSON.stringify(
          normalizedConfig.configuration
        ),
      ]
    );

    await client.query(
      `DELETE FROM seat_layouts
       WHERE bus_id = $1`,
      [busId]
    );

    for (const seat of normalizedLayout) {
      await client.query(
        `INSERT INTO seat_layouts
         (
           bus_id,
           seat_no,
           seat_type,
           deck,
           row_no,
           col_no,
           is_driver,
           is_door,
           is_aisle,
           is_extra,
           fare,
           side,
           position_kind,
           berth_group,
           private_booking_enabled,
           sharing_booking_enabled,
           sharing_capacity,
           private_fare,
           sharing_fare
         )
         VALUES
         (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15,
           $16, $17, $18, $19
         )`,
        [
          busId,
          seat.seat_no,
          seat.seat_type,
          seat.deck,
          seat.row_no,
          seat.col_no,
          seat.is_driver,
          seat.is_door,
          seat.is_aisle,
          seat.is_extra,
          seat.fare,
          seat.side,
          seat.position_kind,
          seat.berth_group,
          seat.private_booking_enabled,
          seat.sharing_booking_enabled,
          seat.sharing_capacity,
          seat.private_fare,
          seat.sharing_fare,
        ]
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message:
        "Seat layout and configuration saved successfully.",
      saved_items: normalizedLayout.length,
      config: normalizedConfig,
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Seat layout rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Save seat layout failed:",
      error
    );

    if (
      error.code === "23505" &&
      error.constraint ===
        "seat_layouts_bus_id_seat_no_key"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate seat number found.",
      });
    }

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to save seat layout.",
      });
  } finally {
    client.release();
  }
};

module.exports = {
  getLayout,
  saveLayout,
};
