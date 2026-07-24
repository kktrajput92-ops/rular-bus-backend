import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../api/api";
import {
  RBButton,
  RBInput,
  RBCard,
} from "../rds/components";
import Toolbox from "../components/seatDesigner/Toolbox";
import BusCanvas from "../components/seatDesigner/BusCanvas";
import SeatGrid from "../components/seatDesigner/SeatGrid";

export default function SeatLayout() {
  const { busId } = useParams();

  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(4);
  const [grid, setGrid] = useState([]);
const [selectedTool, setSelectedTool] = useState("SEAT");
const [selectedSeat, setSelectedSeat] = useState(null);
const [seatNumber, setSeatNumber] = useState("");
const [seatFare, setSeatFare] = useState("");
  useEffect(() => {
    loadLayout();
  }, [busId]);
useEffect(() => {
  if (!selectedSeat) {
    setSeatNumber("");
    setSeatFare("");
    return;
  }

  const selectedCell =
    grid[selectedSeat.row]?.[selectedSeat.col];

  if (!selectedCell) {
    setSeatNumber("");
    setSeatFare("");
    return;
  }

  setSeatNumber(
  selectedCell.type === "SEAT"
    ? (selectedCell.seat_number || getSeatLabel(selectedCell.row, selectedCell.col))
    : selectedCell.type
);

  setSeatFare(selectedCell.fare || "");
}, [selectedSeat]);
  const loadLayout = async () => {
    try {
      const res = await fetch(`${API_BASE}/seat-layouts/${busId}`);
      const data = await res.json();

      if (data.success) {
        setLayout(data.layout || []);
const saved = data.layout || [];

setLayout(saved);

if (saved.length > 0) {
  const maxRow = Math.max(...saved.map((s) => s.row_no));
  const maxCol = Math.max(...saved.map((s) => s.col_no));

  setRows(maxRow + 1);
  setCols(maxCol + 1);

  const temp = Array.from(
    { length: maxRow + 1 },
    (_, r) =>
      Array.from(
        { length: maxCol + 1 },
        (_, c) => ({
          row: r,
          col: c,
          type: "EMPTY",
        })
      )
  );

  saved.forEach((seat) => {
    temp[seat.row_no][seat.col_no] = {
  row: seat.row_no,
  col: seat.col_no,
  type: seat.seat_type,
  seat_number: seat.seat_no,
  fare: seat.fare,
};
  });

  setGrid(temp);
}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const generateGrid = () => {
  const temp = [];

  for (let r = 0; r < rows; r++) {
    const row = [];

    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        type: "EMPTY",
      });
    }

    temp.push(row);
  }

  setGrid(temp);
};

const toggleCell = (rowIndex, colIndex) => {
  setGrid((oldGrid) =>
    oldGrid.map((row) =>
      row.map((cell) => {
        if (cell.row !== rowIndex || cell.col !== colIndex) {
          return cell;
        }

        return {
          ...cell,
          type: selectedTool,
        };
      })
    )
  );
 

  setSelectedSeat({
    row: rowIndex,
    col: colIndex,
  });
};
const getSeatLabel = (row, col) => {
  let count = 0;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (
  grid[r][c].type === "SEAT" ||
  grid[r][c].type === "LOWER_BERTH" ||
  grid[r][c].type === "UPPER_BERTH"
) {
        count++;

        if (r === row && c === col) {
          return `A${count}`;
        }
      }
    }
      }

    return "";
  };

  const saveLayout = async () => {
  try {
    const seats = [];

    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type !== "EMPTY") {
          seats.push({
            seat_no:
  cell.type === "SEAT"
    ? (cell.seat_number || getSeatLabel(cell.row, cell.col))
    : `${cell.type}_${cell.row}_${cell.col}`,
            seat_type: cell.type,
deck: cell.type === "UPPER_BERTH" ? 2 : 1,
fare: Number(cell.fare) || 0,
            row_no: cell.row,
            col_no: cell.col,
            is_driver: cell.type === "DRIVER",
            is_door: cell.type === "DOOR",
            is_aisle: cell.type === "AISLE",
            is_extra: cell.type === "EXTRA",
          });
        }
      });
    });

    const res = await fetch(`${API_BASE}/seat-layouts/${busId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ layout: seats }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Layout saved successfully.");
    } else {
      alert(data.message || "Failed to save layout.");
    }
  } catch (err) {
    console.error(err);
    alert("Error saving layout.");
  }
};
const updateSeat = () => {
  if (!selectedSeat) {
    alert("Please select a seat.");
    return;
  }

  setGrid((oldGrid) =>
    oldGrid.map((row) =>
      row.map((cell) => {
        if (
          cell.row !== selectedSeat.row ||
          cell.col !== selectedSeat.col
        ) {
          return cell;
        }

        return {
          ...cell,
          seat_number: seatNumber,
          fare: Number(seatFare) || 0,
        };
      })
    )
  );

  alert("Seat updated. Click Save Layout to save changes.");
};  
return (
  <div style={{ padding: 20 }}>
    <RBCard style={{ padding: 20 }}>
      <h2>Seat Layout Designer</h2>

      <p>
        <strong>Bus ID:</strong> {busId}
      </p>

      <p>
        <strong>Saved Seats:</strong> {layout.length}
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <RBInput
          type="number"
          value={rows}
          onChange={(e) => setRows(Number(e.target.value))}
          placeholder="Rows"
        />

        <RBInput
          type="number"
          value={cols}
          onChange={(e) => setCols(Number(e.target.value))}
          placeholder="Columns"
        />

        <RBButton onClick={generateGrid}>
          Generate Grid
        </RBButton>

        <RBButton onClick={saveLayout}>
          Save Layout
        </RBButton>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
       <Toolbox
  selectedTool={selectedTool}
  onSelect={setSelectedTool}
/>

       <div>
  <div
    style={{
      background: "#fff",
      border: "3px solid #1f2937",
      borderRadius: 28,
      padding: 20,
      width: "fit-content",
      boxShadow: "0 10px 25px rgba(0,0,0,.15)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 16,
        fontWeight: "bold",
      }}
    >
      <span>👨 DRIVER</span>
      <span>🚪 DOOR</span>
    </div>

    <SeatGrid
  grid={grid}
  getSeatLabel={getSeatLabel}
  toggleCell={toggleCell}
  selectedSeat={selectedSeat}
/>
</div>           
 </div>
          <div
  style={{
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: 18,
    minWidth: 220,
    boxShadow: "0 6px 18px rgba(0,0,0,.08)",
  }}
>
  <h3 style={{ marginTop: 0 }}>Seat Properties</h3>

  {selectedSeat ? (
    <>
      <p><strong>Row:</strong> {selectedSeat.row + 1}</p>
      <p><strong>Column:</strong> {selectedSeat.col + 1}</p>
      <p>
        <strong>Type:</strong>{" "}
        {grid[selectedSeat.row]?.[selectedSeat.col]?.type}
      </p>
        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Seat Number
          </label>

          <RBInput
            value={seatNumber}
            onChange={(e) => setSeatNumber(e.target.value)}
            placeholder="Seat Number"
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Fare
          </label>

          <RBInput
            type="number"
            value={seatFare}
            onChange={(e) => setSeatFare(e.target.value)}
            placeholder="Fare"
          />
        </div>
<RBButton
  variant="primary"
  onClick={updateSeat}
  style={{ marginTop: 16, width: "100%" }}
>
  Update Seat
</RBButton>
    </>
  ) : (
    <p>Select a seat to view properties.</p>
  )}
</div>
        </div>
      )}

    </RBCard>
  </div>
); 

}
