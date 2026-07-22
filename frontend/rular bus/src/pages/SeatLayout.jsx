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
  useEffect(() => {
    loadLayout();
  }, [busId]);

  const loadLayout = async () => {
    try {
      const res = await fetch(`${API_BASE}/seat-layouts/${busId}`);
      const data = await res.json();

      if (data.success) {
        setLayout(data.layout || []);
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
    ? getSeatLabel(cell.row, cell.col)
    : `${cell.type}_${cell.row}_${cell.col}`,
            seat_type: cell.type,
deck: cell.type === "UPPER_BERTH" ? 2 : 1,
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
/>
            </div>
          </div>
        </div>
      )}

    </RBCard>
  </div>
); 

}
