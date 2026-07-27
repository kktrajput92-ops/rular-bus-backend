import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../api/api";
import {
  RBButton,
  RBCard,
  RBInput,
} from "../rds/components";
import BusCanvas from "../components/seatDesigner/BusCanvas";
import SeatGrid from "../components/seatDesigner/SeatGrid";
import Toolbox from "../components/seatDesigner/Toolbox";
import {
  generateIndianLayout,
  LAYOUT_MODES,
  LAYOUT_PRESETS,
  TYPES,
} from "../layout-engine/indianCoachGenerator.js";

const SELLABLE_TYPES = new Set([
  TYPES.SEAT,
  TYPES.LOWER_BERTH,
  TYPES.UPPER_BERTH,
]);

const MODE_OPTIONS = [
  {
    value: LAYOUT_MODES.FULL_SEATER,
    title: "Full Seater",
    description:
      "2×2, 3×2, 2×1 और 1×1 seating layouts",
    icon: "💺",
  },
  {
    value: LAYOUT_MODES.FULL_SLEEPER,
    title: "Full Sleeper",
    description:
      "Left single sleeper, right double sleeper",
    icon: "🛏️",
  },
  {
    value:
      LAYOUT_MODES.MIXED_SEATER_SLEEPER,
    title: "Mixed Coach",
    description:
      "Lower seating + lower/upper sleepers",
    icon: "🚌",
  },
];

const SEATER_PRESETS = [
  {
    value: LAYOUT_PRESETS.SEATER_2X2,
    label: "2 × 2 Standard",
    description: "4 seats per row",
  },
  {
    value: LAYOUT_PRESETS.SEATER_3X2,
    label: "3 × 2 Economy",
    description: "5 seats per row",
  },
  {
    value: LAYOUT_PRESETS.SEATER_2X1,
    label: "2 × 1 Premium",
    description: "3 seats per row",
  },
  {
    value: LAYOUT_PRESETS.SEATER_1X1,
    label: "1 × 1 Luxury",
    description: "2 seats per row",
  },
];

const DEFAULT_FORM = {
  layoutMode: LAYOUT_MODES.FULL_SLEEPER,
  layoutPreset: LAYOUT_PRESETS.FULL_SLEEPER,

  totalSeats: 40,
  seatFare: 450,

  conductorLowerCapacity: 6,
  conductorUpperCapacity: 6,

  driverLowerCapacity: 12,
  driverUpperCapacity: 12,

  driverLowerSeatingCapacity: 10,
  driverLowerSleeperCapacity: 4,
  driverUpperSleeperCapacity: 12,

  sittingFare: 450,
  singleLowerFare: 600,
  singleUpperFare: 600,

  doubleLowerPrivateFare: 1800,
  doubleLowerSharingFare: 550,

  doubleUpperPrivateFare: 1800,
  doubleUpperSharingFare: 550,

  sharingCapacity: 4,
};

const createEmptyCell = (
  row,
  col,
  deck
) => ({
  row,
  col,
  deck,
  type: TYPES.EMPTY,
  seat_number: "",
  fare: 0,
  side: null,
  position_kind: null,
  berth_group: null,
  private_booking_enabled: false,
  sharing_booking_enabled: false,
  sharing_capacity: 1,
  private_fare: null,
  sharing_fare: null,
});

const createEmptyGrid = (
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

const normalizeDeck = (deck) =>
  String(deck).toUpperCase() === "UPPER"
    ? "UPPER"
    : "LOWER";

const toNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const fieldStyle = {
  display: "grid",
  gap: 6,
};

const panelStyle = {
  border: "1px solid #dbe3ef",
  borderRadius: 16,
  padding: 18,
  background: "#ffffff",
  boxShadow:
    "0 4px 16px rgba(15, 23, 42, 0.05)",
};

export default function SeatLayout() {
  const { busId } = useParams();

  const [form, setForm] =
    useState(DEFAULT_FORM);

  const [lowerGrid, setLowerGrid] =
    useState([]);

  const [upperGrid, setUpperGrid] =
    useState([]);

  const [savedItems, setSavedItems] =
    useState([]);

  const [activeDeck, setActiveDeck] =
    useState("LOWER");

  const [selectedTool, setSelectedTool] =
    useState(TYPES.SEAT);

  const [selectedSeat, setSelectedSeat] =
    useState(null);

  const [editForm, setEditForm] =
    useState({
      seatNumber: "",
      fare: "",
      privateEnabled: true,
      sharingEnabled: false,
      sharingCapacity: 1,
      privateFare: "",
      sharingFare: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [toast, setToast] =
    useState({
      visible: false,
      type: "info",
      text: "",
    });

  const showToast = (
    text,
    type = "info"
  ) => {
    setToast({
      visible: true,
      type,
      text,
    });

    window.clearTimeout(
      window.__rularSeatToastTimer
    );

    window.__rularSeatToastTimer =
      window.setTimeout(() => {
        setToast((old) => ({
          ...old,
          visible: false,
        }));
      }, 4000);
  };

  const currentGrid =
    activeDeck === "UPPER"
      ? upperGrid
      : lowerGrid;

  const selectedCell = useMemo(() => {
    if (!selectedSeat) {
      return null;
    }

    const grid =
      selectedSeat.deck === "UPPER"
        ? upperGrid
        : lowerGrid;

    return (
      grid[selectedSeat.row]?.[
        selectedSeat.col
      ] || null
    );
  }, [
    selectedSeat,
    lowerGrid,
    upperGrid,
  ]);

  const summary = useMemo(() => {
    const allCells = [
      ...lowerGrid.flat(),
      ...upperGrid.flat(),
    ];

    const sellable = allCells.filter(
      (cell) =>
        SELLABLE_TYPES.has(cell.type)
    );

    return {
      totalItems: allCells.filter(
        (cell) =>
          cell.type !== TYPES.EMPTY
      ).length,

      sellable: sellable.length,

      lower: lowerGrid
        .flat()
        .filter((cell) =>
          SELLABLE_TYPES.has(cell.type)
        ).length,

      upper: upperGrid
        .flat()
        .filter((cell) =>
          SELLABLE_TYPES.has(cell.type)
        ).length,

      seater: sellable.filter(
        (cell) =>
          cell.type === TYPES.SEAT
      ).length,

      lowerBerths: sellable.filter(
        (cell) =>
          cell.type ===
          TYPES.LOWER_BERTH
      ).length,

      upperBerths: sellable.filter(
        (cell) =>
          cell.type ===
          TYPES.UPPER_BERTH
      ).length,

      sharingEnabled: sellable.filter(
        (cell) =>
          cell.sharing_booking_enabled
      ).length,
    };
  }, [lowerGrid, upperGrid]);

  useEffect(() => {
    loadLayout();
  }, [busId]);

  useEffect(() => {
    if (!selectedCell) {
      setEditForm({
        seatNumber: "",
        fare: "",
        privateEnabled: true,
        sharingEnabled: false,
        sharingCapacity: 1,
        privateFare: "",
        sharingFare: "",
      });

      return;
    }

    setEditForm({
      seatNumber:
        selectedCell.seat_number || "",

      fare:
        selectedCell.fare === null ||
        selectedCell.fare === undefined
          ? ""
          : String(selectedCell.fare),

      privateEnabled:
        Boolean(
          selectedCell
            .private_booking_enabled
        ),

      sharingEnabled:
        Boolean(
          selectedCell
            .sharing_booking_enabled
        ),

      sharingCapacity:
        Number(
          selectedCell
            .sharing_capacity || 1
        ),

      privateFare:
        selectedCell.private_fare ===
          null ||
        selectedCell.private_fare ===
          undefined
          ? ""
          : String(
              selectedCell.private_fare
            ),

      sharingFare:
        selectedCell.sharing_fare ===
          null ||
        selectedCell.sharing_fare ===
          undefined
          ? ""
          : String(
              selectedCell.sharing_fare
            ),
    });
  }, [selectedCell]);

  const updateForm = (
    field,
    value
  ) => {
    setForm((old) => ({
      ...old,
      [field]: value,
    }));
  };

  const loadLayout = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_BASE}/seat-layouts/${busId}`
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load layout."
        );
      }

      const rows = Array.isArray(
        data.layout
      )
        ? data.layout
        : [];

      setSavedItems(rows);

      setLowerGrid(
        convertRowsToGrid(
          rows.filter(
            (item) =>
              normalizeDeck(item.deck) ===
              "LOWER"
          ),
          "LOWER"
        )
      );

      setUpperGrid(
        convertRowsToGrid(
          rows.filter(
            (item) =>
              normalizeDeck(item.deck) ===
              "UPPER"
          ),
          "UPPER"
        )
      );

      const configuration =
        data.config?.configuration || {};

      setForm((old) => ({
        ...old,
        ...configuration,

        layoutMode:
          data.config?.layout_mode ||
          old.layoutMode,

        layoutPreset:
          data.config?.layout_preset ||
          configuration.layoutPreset ||
          old.layoutPreset,
      }));
    } catch (error) {
      console.error(
        "Load seat layout failed:",
        error
      );

      setMessage(
        error.message ||
          "Failed to load layout."
      );
    } finally {
      setLoading(false);
    }
  };

  const convertRowsToGrid = (
    rows,
    deck
  ) => {
    if (!rows.length) {
      return [];
    }

    const maxRow = Math.max(
      ...rows.map((item) =>
        Number(item.row_no)
      )
    );

    const maxCol = Math.max(
      ...rows.map((item) =>
        Number(item.col_no)
      )
    );

    const grid = createEmptyGrid(
      maxRow + 1,
      maxCol + 1,
      deck
    );

    rows.forEach((item) => {
      const row = Number(item.row_no);
      const col = Number(item.col_no);

      grid[row][col] = {
        row,
        col,
        deck,
        type: String(
          item.seat_type || TYPES.EMPTY
        ).toUpperCase(),

        seat_number: String(
          item.seat_no || ""
        ),

        fare: Number(item.fare || 0),

        side: item.side || null,

        position_kind:
          item.position_kind || null,

        berth_group:
          item.berth_group || null,

        private_booking_enabled:
          Boolean(
            item.private_booking_enabled
          ),

        sharing_booking_enabled:
          Boolean(
            item.sharing_booking_enabled
          ),

        sharing_capacity: Number(
          item.sharing_capacity || 1
        ),

        private_fare:
          item.private_fare === null
            ? null
            : Number(
                item.private_fare
              ),

        sharing_fare:
          item.sharing_fare === null
            ? null
            : Number(
                item.sharing_fare
              ),
      };
    });

    return grid;
  };

  const applyGeneratedLayout = (
    nextForm,
    successPrefix = "Layout generated"
  ) => {
    try {
      const result =
        generateIndianLayout({
          ...nextForm,
          layout_mode:
            nextForm.layoutMode,
          layoutMode:
            nextForm.layoutMode,
          layoutPreset:
            nextForm.layoutPreset,
        });

      setLowerGrid(
        result.lowerGrid || []
      );

      setUpperGrid(
        result.upperGrid || []
      );

      setActiveDeck("LOWER");
      setSelectedSeat(null);

      setMessage(
        `${successPrefix}. Total passenger capacity: ${result.summary.totalCapacity}`
      );

      return true;
    } catch (error) {
      setMessage(
        error.message ||
          "Layout generation failed."
      );

      return false;
    }
  };

  const generateLayout = () => {
    applyGeneratedLayout(form);
  };

  const selectMode = (mode) => {
    let preset =
      form.layoutPreset;

    if (
      mode ===
      LAYOUT_MODES.FULL_SLEEPER
    ) {
      preset =
        LAYOUT_PRESETS.FULL_SLEEPER;
    }

    if (
      mode ===
      LAYOUT_MODES
        .MIXED_SEATER_SLEEPER
    ) {
      preset =
        LAYOUT_PRESETS.MIXED_COACH;
    }

    if (
      mode ===
        LAYOUT_MODES.FULL_SEATER &&
      !String(preset).startsWith(
        "SEATER_"
      )
    ) {
      preset =
        LAYOUT_PRESETS.SEATER_2X2;
    }

    const nextForm = {
      ...form,
      layoutMode: mode,
      layoutPreset: preset,
    };

    setForm(nextForm);

    applyGeneratedLayout(
      nextForm,
      "Coach mode changed and layout generated"
    );
  };

  const selectSeaterPreset = (
    preset
  ) => {
    const nextForm = {
      ...form,
      layoutMode:
        LAYOUT_MODES.FULL_SEATER,
      layoutPreset: preset,
    };

    setForm(nextForm);

    applyGeneratedLayout(
      nextForm,
      "Seater preset changed and layout generated"
    );
  };

  const setCurrentGrid = (
    updater
  ) => {
    if (activeDeck === "UPPER") {
      setUpperGrid(updater);
    } else {
      setLowerGrid(updater);
    }
  };

  const getSeatLabel = (
    row,
    col
  ) =>
    currentGrid[row]?.[col]
      ?.seat_number || "";

  const toggleCell = (
    rowIndex,
    colIndex
  ) => {
    const cell =
      currentGrid[rowIndex]?.[
        colIndex
      ];

    if (!cell) {
      return;
    }

    setSelectedSeat({
      row: rowIndex,
      col: colIndex,
      deck: activeDeck,
    });

    setMessage(
      `${cell.seat_number || cell.type} selected. Properties बदलें या selected tool apply करें.`
    );
  };

  const applySelectedTool = () => {
    if (!selectedSeat || !selectedCell) {
      setMessage(
        "पहले grid में कोई cell select करें."
      );

      return;
    }

    if (
      selectedSeat.deck === "UPPER" &&
      [TYPES.DOOR, TYPES.DRIVER].includes(
        selectedTool
      )
    ) {
      setMessage(
        "Driver और Entry Door केवल Lower Deck पर रखे जा सकते हैं."
      );

      return;
    }

    const sellable =
      SELLABLE_TYPES.has(
        selectedTool
      );

    const updater = (oldGrid) =>
      oldGrid.map((row) =>
        row.map((cell) => {
          if (
            cell.row !== selectedSeat.row ||
            cell.col !== selectedSeat.col
          ) {
            return cell;
          }

          const existingNumber =
            String(
              cell.seat_number || ""
            ).trim();

          return {
            ...cell,
            type: selectedTool,

            seat_number:
              selectedTool === TYPES.EMPTY
                ? ""
                : sellable
                ? existingNumber
                : `${selectedTool}_${selectedSeat.deck}_${selectedSeat.row}_${selectedSeat.col}`,

            fare: sellable
              ? Number(cell.fare || 0)
              : 0,

            side:
              selectedTool === TYPES.DOOR
                ? "CONDUCTOR_LEFT"
                : selectedTool === TYPES.DRIVER
                ? "DRIVER_RIGHT"
                : cell.side,

            position_kind:
              selectedTool === TYPES.DOOR
                ? "ENTRY_DOOR"
                : selectedTool === TYPES.DRIVER
                ? "DRIVER"
                : selectedTool === TYPES.AISLE
                ? "AISLE"
                : cell.position_kind,

            berth_group:
              sellable
                ? cell.berth_group
                : null,

            private_booking_enabled:
              sellable,

            sharing_booking_enabled:
              false,

            sharing_capacity: 1,

            private_fare: sellable
              ? Number(
                  cell.private_fare ??
                  cell.fare ??
                  0
                )
              : null,

            sharing_fare: null,
          };
        })
      );

    if (
      selectedSeat.deck === "UPPER"
    ) {
      setUpperGrid(updater);
    } else {
      setLowerGrid(updater);
    }

    setMessage(
      `${selectedTool} applied locally. Save Layout दबाकर database में save करें.`
    );
  };

  const updateSelectedCell = () => {
    if (
      !selectedSeat ||
      !selectedCell
    ) {
      setMessage(
        "पहले कोई seat या berth select करें."
      );

      return;
    }

    const sellable =
      SELLABLE_TYPES.has(
        selectedCell.type
      );

    if (
      sellable &&
      !String(
        editForm.seatNumber
      ).trim()
    ) {
      setMessage(
        "Seat number required है."
      );

      return;
    }

    const fare = toNumber(
      editForm.fare,
      0
    );

    const privateFare =
      editForm.privateFare === ""
        ? fare
        : toNumber(
            editForm.privateFare,
            fare
          );

    const sharingFare =
      editForm.sharingFare === ""
        ? null
        : toNumber(
            editForm.sharingFare,
            0
          );

    if (
      sellable &&
      !editForm.privateEnabled &&
      !editForm.sharingEnabled
    ) {
      setMessage(
        "Seat पर Private या Sharing में से कम से कम एक booking mode enable करें."
      );

      return;
    }

    if (
      editForm.sharingEnabled &&
      Number(
        editForm.sharingCapacity
      ) < 2
    ) {
      setMessage(
        "Sharing capacity कम से कम 2 होनी चाहिए."
      );

      return;
    }

    if (
      editForm.sharingEnabled &&
      sharingFare === null
    ) {
      setMessage(
        "Sharing fare required है."
      );

      return;
    }

    const updater = (oldGrid) =>
      oldGrid.map((row) =>
        row.map((cell) => {
          if (
            cell.row !==
              selectedSeat.row ||
            cell.col !==
              selectedSeat.col
          ) {
            return cell;
          }

          return {
            ...cell,

            seat_number: sellable
              ? String(
                  editForm.seatNumber
                ).trim()
              : cell.seat_number,

            fare: sellable
              ? fare
              : 0,

            private_booking_enabled:
              sellable &&
              editForm.privateEnabled,

            sharing_booking_enabled:
              sellable &&
              editForm.sharingEnabled,

            sharing_capacity:
              sellable &&
              editForm.sharingEnabled
                ? Number(
                    editForm.sharingCapacity
                  )
                : 1,

            private_fare:
              sellable &&
              editForm.privateEnabled
                ? privateFare
                : null,

            sharing_fare:
              sellable &&
              editForm.sharingEnabled
                ? sharingFare
                : null,
          };
        })
      );

    if (
      selectedSeat.deck === "UPPER"
    ) {
      setUpperGrid(updater);
    } else {
      setLowerGrid(updater);
    }

    setMessage(
      "Cell updated locally. Save Layout दबाकर database में save करें."
    );
  };

  const flattenGrid = (
    grid,
    deck
  ) => {
    const items = [];

    grid.forEach((row) => {
      row.forEach((cell) => {
        if (
          cell.type === TYPES.EMPTY
        ) {
          return;
        }

        const sellable =
          SELLABLE_TYPES.has(
            cell.type
          );

        items.push({
          seat_no: sellable
            ? String(
                cell.seat_number
              ).trim()
            : `${cell.type}_${deck}_${cell.row}_${cell.col}`,

          seat_type: cell.type,
          deck,
          row_no: cell.row,
          col_no: cell.col,

          fare: sellable
            ? Number(cell.fare || 0)
            : 0,

          side: cell.side || null,

          position_kind:
            cell.position_kind ||
            null,

          berth_group:
            cell.berth_group || null,

          is_driver:
            cell.type ===
            TYPES.DRIVER,

          is_door:
            cell.type === TYPES.DOOR,

          is_aisle:
            cell.type ===
            TYPES.AISLE,

          is_extra:
            cell.type ===
            TYPES.EXTRA,

          private_booking_enabled:
            sellable
              ? Boolean(
                  cell
                    .private_booking_enabled
                )
              : false,

          sharing_booking_enabled:
            sellable
              ? Boolean(
                  cell
                    .sharing_booking_enabled
                )
              : false,

          sharing_capacity:
            sellable
              ? Number(
                  cell.sharing_capacity ||
                    1
                )
              : 1,

          private_fare:
            sellable &&
            cell.private_booking_enabled
              ? Number(
                  cell.private_fare ??
                    cell.fare ??
                    0
                )
              : null,

          sharing_fare:
            sellable &&
            cell.sharing_booking_enabled
              ? Number(
                  cell.sharing_fare ??
                    cell.fare ??
                    0
                )
              : null,
        });
      });
    });

    return items;
  };

  const saveLayout = async () => {
    try {
      setSaving(true);
      setMessage("");

      showToast(
        "Saving seat layout...",
        "info"
      );

      const items = [
        ...flattenGrid(
          lowerGrid,
          "LOWER"
        ),
        ...flattenGrid(
          upperGrid,
          "UPPER"
        ),
      ];

      if (!items.length) {
        throw new Error(
          "पहले layout generate करें."
        );
      }

      const sellableItems =
        items.filter((item) =>
          SELLABLE_TYPES.has(
            item.seat_type
          )
        );

      if (
        sellableItems.some(
          (item) =>
            !String(
              item.seat_no
            ).trim()
        )
      ) {
        throw new Error(
          "हर seat और berth का number required है."
        );
      }

      const normalizedNumbers =
        sellableItems.map((item) =>
          String(item.seat_no)
            .trim()
            .toLowerCase()
        );

      if (
        new Set(normalizedNumbers)
          .size !==
        normalizedNumbers.length
      ) {
        throw new Error(
          "Duplicate seat numbers allowed नहीं हैं."
        );
      }

      const response = await fetch(
        `${API_BASE}/seat-layouts/${busId}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            layout: items,

            config: {
              layout_mode:
                form.layoutMode,

              layout_preset:
                form.layoutPreset,

              steering_position:
                "RIGHT_HAND_DRIVE",

              conductor_side:
                "LEFT",

              driver_side: "RIGHT",

              lower_deck_enabled:
                lowerGrid.length > 0,

              upper_deck_enabled:
                upperGrid.length > 0,

              configuration: {
                ...form,
                layoutMode:
                  form.layoutMode,
                layoutPreset:
                  form.layoutPreset,
              },
            },
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save layout."
        );
      }

      setSavedItems(items);

      const successMessage =
        `${data.saved_items ?? items.length} layout items successfully saved.`;

      setMessage(successMessage);

      showToast(
        successMessage,
        "success"
      );
    } catch (error) {
      console.error(
        "Save layout failed:",
        error
      );

      const errorMessage =
        error.message ||
        "Failed to save layout.";

      setMessage(errorMessage);

      showToast(
        errorMessage,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const renderNumberField = ({
    label,
    field,
    min = 0,
    step = 1,
  }) => (
    <label style={fieldStyle}>
      <span
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: "#334155",
        }}
      >
        {label}
      </span>

      <RBInput
        type="number"
        min={min}
        step={step}
        value={form[field]}
        onChange={(event) =>
          updateForm(
            field,
            event.target.value
          )
        }
      />
    </label>
  );

  const renderSeaterForm = () => (
    <div style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>
        💺 Seater Configuration
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {SEATER_PRESETS.map(
          (preset) => (
            <button
              type="button"
              key={preset.value}
              onClick={() =>
                selectSeaterPreset(
                  preset.value
                )
              }
              style={{
                padding: 14,
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left",
                background:
                  form.layoutPreset ===
                  preset.value
                    ? "#eff6ff"
                    : "#ffffff",
                border:
                  form.layoutPreset ===
                  preset.value
                    ? "2px solid #2563eb"
                    : "1px solid #cbd5e1",
              }}
            >
              <strong>
                {preset.label}
              </strong>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                {preset.description}
              </div>
            </button>
          )
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
        }}
      >
        {renderNumberField({
          label:
            "Total Passenger Seats",
          field: "totalSeats",
          min: 1,
        })}

        {renderNumberField({
          label: "Fare Per Seat",
          field: "seatFare",
          min: 0,
        })}
      </div>
    </div>
  );

  const renderSleeperFields = ({
    mixed = false,
  }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 16,
      }}
    >
      <section
        style={{
          ...panelStyle,
          borderTop:
            "5px solid #16a34a",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          🚪 Left — Conductor Side
        </h3>

        <p
          style={{
            color: "#64748b",
            fontSize: 13,
          }}
        >
          Single sleeper positions
        </p>

        <div
          style={{
            display: "grid",
            gap: 13,
          }}
        >
          {renderNumberField({
            label:
              "Lower Single Sleepers",
            field:
              "conductorLowerCapacity",
          })}

          {renderNumberField({
            label:
              "Upper Single Sleepers",
            field:
              "conductorUpperCapacity",
          })}

          {renderNumberField({
            label:
              "Single Lower Fare",
            field: "singleLowerFare",
          })}

          {renderNumberField({
            label:
              "Single Upper Fare",
            field: "singleUpperFare",
          })}
        </div>
      </section>

      <section
        style={{
          ...panelStyle,
          borderTop:
            "5px solid #f97316",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          🛞 Right — Driver Side
        </h3>

        <p
          style={{
            color: "#64748b",
            fontSize: 13,
          }}
        >
          Double positions and sharing
        </p>

        <div
          style={{
            display: "grid",
            gap: 13,
          }}
        >
          {mixed ? (
            <>
              {renderNumberField({
                label:
                  "Lower Sitting Seats",
                field:
                  "driverLowerSeatingCapacity",
                step: 2,
              })}

              {renderNumberField({
                label:
                  "Lower Sleeper Capacity",
                field:
                  "driverLowerSleeperCapacity",
                step: 2,
              })}

              {renderNumberField({
                label:
                  "Upper Sleeper Capacity",
                field:
                  "driverUpperSleeperCapacity",
                step: 2,
              })}

              {renderNumberField({
                label: "Sitting Fare",
                field: "sittingFare",
              })}
            </>
          ) : (
            <>
              {renderNumberField({
                label:
                  "Lower Double Capacity",
                field:
                  "driverLowerCapacity",
                step: 2,
              })}

              {renderNumberField({
                label:
                  "Upper Double Capacity",
                field:
                  "driverUpperCapacity",
                step: 2,
              })}
            </>
          )}

          {renderNumberField({
            label:
              "Lower Private Berth Fare",
            field:
              "doubleLowerPrivateFare",
          })}

          {renderNumberField({
            label:
              "Lower Sharing Fare / Passenger",
            field:
              "doubleLowerSharingFare",
          })}

          {renderNumberField({
            label:
              "Upper Private Berth Fare",
            field:
              "doubleUpperPrivateFare",
          })}

          {renderNumberField({
            label:
              "Upper Sharing Fare / Passenger",
            field:
              "doubleUpperSharingFare",
          })}

          {renderNumberField({
            label:
              "Maximum Sharing Capacity",
            field: "sharingCapacity",
            min: 2,
          })}
        </div>
      </section>
    </div>
  );

  return (
    <>
      {toast.visible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 18,
            left: "50%",
            transform:
              "translateX(-50%)",
            zIndex: 99999,
            width:
              "min(calc(100vw - 28px), 460px)",
            padding: "14px 18px",
            borderRadius: 14,
            boxShadow:
              "0 12px 35px rgba(15, 23, 42, 0.25)",
            fontWeight: 700,
            textAlign: "center",
            color:
              toast.type === "success"
                ? "#14532d"
                : toast.type === "error"
                ? "#7f1d1d"
                : "#1e3a8a",
            background:
              toast.type === "success"
                ? "#dcfce7"
                : toast.type === "error"
                ? "#fee2e2"
                : "#dbeafe",
            border:
              toast.type === "success"
                ? "1px solid #4ade80"
                : toast.type === "error"
                ? "1px solid #f87171"
                : "1px solid #60a5fa",
          }}
        >
          {toast.type === "success"
            ? "✅ "
            : toast.type === "error"
            ? "❌ "
            : "⏳ "}
          {toast.text}
        </div>
      )}

      <div
        style={{
          padding: 20,
          background: "#f8fafc",
          minHeight: "100vh",
        }}
      >
      <RBCard
        style={{
          padding: 22,
          borderRadius: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin:
                  "0 0 8px 0",
              }}
            >
              🚌 Indian Bus Layout
              Designer
            </h2>

            <div
              style={{
                color: "#64748b",
              }}
            >
              Bus ID:{" "}
              <strong>{busId}</strong>
            </div>
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#ecfdf5",
              border:
                "1px solid #86efac",
              fontWeight: 700,
            }}
          >
            LEFT = Conductor 🚪
            <br />
            RIGHT = Driver 🛞
          </div>
        </div>

        {message && (
          <div
            style={{
              marginTop: 18,
              padding: 13,
              borderRadius: 12,
              background: "#eff6ff",
              border:
                "1px solid #93c5fd",
            }}
          >
            {message}
          </div>
        )}

        <h3 style={{ marginTop: 28 }}>
          1. Select Coach Mode
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {MODE_OPTIONS.map(
            (option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  selectMode(
                    option.value
                  )
                }
                style={{
                  padding: 18,
                  borderRadius: 16,
                  cursor: "pointer",
                  textAlign: "left",
                  background:
                    form.layoutMode ===
                    option.value
                      ? "#eff6ff"
                      : "#ffffff",
                  border:
                    form.layoutMode ===
                    option.value
                      ? "2px solid #2563eb"
                      : "1px solid #cbd5e1",
                  boxShadow:
                    "0 4px 12px rgba(15,23,42,.05)",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 8,
                  }}
                >
                  {option.icon}
                </div>

                <strong
                  style={{
                    fontSize: 16,
                  }}
                >
                  {option.title}
                </strong>

                <div
                  style={{
                    marginTop: 6,
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  {option.description}
                </div>
              </button>
            )
          )}
        </div>

        <div style={{ marginTop: 22 }}>
          {form.layoutMode ===
            LAYOUT_MODES.FULL_SEATER &&
            renderSeaterForm()}

          {form.layoutMode ===
            LAYOUT_MODES.FULL_SLEEPER &&
            renderSleeperFields({
              mixed: false,
            })}

          {form.layoutMode ===
            LAYOUT_MODES
              .MIXED_SEATER_SLEEPER &&
            renderSleeperFields({
              mixed: true,
            })}
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <RBButton
            onClick={generateLayout}
          >
            ✨ Generate Layout
          </RBButton>

          <RBButton
            onClick={saveLayout}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "💾 Save Layout"}
          </RBButton>

          <RBButton
            onClick={loadLayout}
            disabled={loading}
          >
            ↻ Reload Saved
          </RBButton>
        </div>

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {[
            [
              "Sellable Capacity",
              summary.sellable,
            ],
            [
              "Lower Deck",
              summary.lower,
            ],
            [
              "Upper Deck",
              summary.upper,
            ],
            [
              "Seater",
              summary.seater,
            ],
            [
              "Lower Berths",
              summary.lowerBerths,
            ],
            [
              "Upper Berths",
              summary.upperBerths,
            ],
            [
              "Sharing Enabled",
              summary.sharingEnabled,
            ],
            [
              "Saved Items",
              savedItems.length,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: 14,
                borderRadius: 13,
                background: "#ffffff",
                border:
                  "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 23,
                  fontWeight: 800,
                }}
              >
                {value}
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontSize: 12,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 28 }}>
          2. Graphical Preview
        </h3>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <RBButton
            onClick={() => {
              setActiveDeck("LOWER");
              setSelectedSeat(null);
            }}
            style={{
              background:
                activeDeck === "LOWER"
                  ? "#2563eb"
                  : "#e2e8f0",
              color:
                activeDeck === "LOWER"
                  ? "#ffffff"
                  : "#0f172a",
            }}
          >
            Lower Deck
          </RBButton>

          <RBButton
            onClick={() => {
              setActiveDeck("UPPER");
              setSelectedSeat(null);
            }}
            disabled={!upperGrid.length}
            style={{
              background:
                activeDeck === "UPPER"
                  ? "#7c3aed"
                  : "#e2e8f0",
              color:
                activeDeck === "UPPER"
                  ? "#ffffff"
                  : "#0f172a",
            }}
          >
            Upper Deck
          </RBButton>
        </div>

        {loading ? (
          <p>Loading layout...</p>
        ) : !currentGrid.length ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              border:
                "2px dashed #cbd5e1",
              borderRadius: 16,
              color: "#64748b",
            }}
          >
            Configuration भरकर
            Generate Layout दबाएँ।
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(170px, 210px) minmax(320px, 1fr) minmax(250px, 310px)",
              gap: 20,
              alignItems: "start",
              overflowX: "auto",
            }}
          >
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>
                Editing Tools
              </h3>

              <Toolbox
                selectedTool={
                  selectedTool
                }
                onSelect={
                  setSelectedTool
                }
              />

              <RBButton
                onClick={
                  applySelectedTool
                }
                style={{
                  width: "100%",
                  marginTop: 14,
                }}
              >
                Apply Selected Tool
              </RBButton>

              <p
                style={{
                  marginBottom: 0,
                  marginTop: 10,
                  color: "#64748b",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Cell पर click करने से केवल
                selection होगा। Type बदलने
                के लिए ऊपर tool चुनकर यह
                button दबाएँ।
              </p>
            </div>

            <div
              style={{
                ...panelStyle,
                overflowX: "auto",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  textAlign: "center",
                }}
              >
                {activeDeck === "LOWER"
                  ? "Lower Deck"
                  : "Upper Deck"}
              </h3>

              <BusCanvas
                deck={activeDeck}
              >
                <SeatGrid
                  grid={currentGrid}
                  getSeatLabel={
                    getSeatLabel
                  }
                  toggleCell={
                    toggleCell
                  }
                  selectedSeat={
                    selectedSeat?.deck ===
                    activeDeck
                      ? selectedSeat
                      : null
                  }
                />
              </BusCanvas>
            </div>

            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>
                Seat / Berth Properties
              </h3>

              {!selectedCell ? (
                <p
                  style={{
                    color: "#64748b",
                  }}
                >
                  Grid में किसी cell को
                  select करें।
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>Deck:</strong>{" "}
                    {selectedSeat.deck}
                  </div>

                  <div>
                    <strong>Type:</strong>{" "}
                    {selectedCell.type}
                  </div>

                  <div>
                    <strong>Position:</strong>{" "}
                    Row{" "}
                    {selectedSeat.row + 1},
                    Column{" "}
                    {selectedSeat.col + 1}
                  </div>

                  {SELLABLE_TYPES.has(
                    selectedCell.type
                  ) && (
                    <>
                      <label
                        style={fieldStyle}
                      >
                        <span>
                          Seat / Berth Number
                        </span>

                        <RBInput
                          value={
                            editForm.seatNumber
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (old) => ({
                                ...old,
                                seatNumber:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>

                      <label
                        style={fieldStyle}
                      >
                        <span>
                          Base Fare
                        </span>

                        <RBInput
                          type="number"
                          min="0"
                          value={
                            editForm.fare
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (old) => ({
                                ...old,
                                fare:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>

                      <label>
                        <input
                          type="checkbox"
                          checked={
                            editForm.privateEnabled
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (old) => ({
                                ...old,
                                privateEnabled:
                                  event
                                    .target
                                    .checked,
                              })
                            )
                          }
                        />{" "}
                        Allow Private Booking
                      </label>

                      {editForm.privateEnabled && (
                        <label
                          style={fieldStyle}
                        >
                          <span>
                            Private Fare
                          </span>

                          <RBInput
                            type="number"
                            min="0"
                            value={
                              editForm.privateFare
                            }
                            onChange={(
                              event
                            ) =>
                              setEditForm(
                                (old) => ({
                                  ...old,
                                  privateFare:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                          />
                        </label>
                      )}

                      <label>
                        <input
                          type="checkbox"
                          checked={
                            editForm.sharingEnabled
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (old) => ({
                                ...old,
                                sharingEnabled:
                                  event
                                    .target
                                    .checked,
                              })
                            )
                          }
                        />{" "}
                        Allow Sharing Booking
                      </label>

                      {editForm.sharingEnabled && (
                        <>
                          <label
                            style={fieldStyle}
                          >
                            <span>
                              Sharing Capacity
                            </span>

                            <RBInput
                              type="number"
                              min="2"
                              max="10"
                              value={
                                editForm.sharingCapacity
                              }
                              onChange={(
                                event
                              ) =>
                                setEditForm(
                                  (old) => ({
                                    ...old,
                                    sharingCapacity:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                            />
                          </label>

                          <label
                            style={fieldStyle}
                          >
                            <span>
                              Sharing Fare /
                              Passenger
                            </span>

                            <RBInput
                              type="number"
                              min="0"
                              value={
                                editForm.sharingFare
                              }
                              onChange={(
                                event
                              ) =>
                                setEditForm(
                                  (old) => ({
                                    ...old,
                                    sharingFare:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                            />
                          </label>
                        </>
                      )}
                    </>
                  )}

                  <RBButton
                    onClick={
                      updateSelectedCell
                    }
                  >
                    Update Cell
                  </RBButton>
                </div>
              )}
            </div>
          </div>
        )}
      </RBCard>
      </div>
    </>
  );
}
