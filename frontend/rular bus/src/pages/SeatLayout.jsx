import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../api/api";
import {
  RBButton,
  RBInput,
  RBCard,
} from "../rds/components";

export default function SeatLayout() {
  const { busId } = useParams();

  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(4);
  const [grid, setGrid] = useState([]);

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
    oldGrid.map((row, r) =>
      row.map((cell, c) => {
        if (r !== rowIndex || c !== colIndex) return cell;

        const order = [
          "EMPTY",
          "SEAT",
          "DOOR",
          "DRIVER",
          "AISLE",
          "EXTRA",
        ];

        const next = order[(order.indexOf(cell.type) + 1) % order.length];

        return {
          ...cell,
          type: next,
        };
      })
    )
  );
};
const getSeatLabel = (row, col) => {
  let count = 0;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].type === "SEAT") {
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
            deck: 1,
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

        <p><strong>Bus ID:</strong> {busId}</p>

        <p><strong>Saved Seats:</strong> {layout.length}</p>

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
        </div>
<RBButton onClick={saveLayout}>
  Save Layout
</RBButton>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>

            {grid.map((row, r) => (

              <div
                key={r}
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 8,
                }}
              >

                {row.map((cell) => (

                  <div
                    key={`${cell.row}-${cell.col}`}
onClick={() => toggleCell(cell.row, cell.col)}
                    style={{
                      width: 50,
                      height: 50,
                      border: "1px solid #999",
                      borderRadius: 6,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background:
  cell.type === "SEAT"
    ? "#4f8ef7"
    : cell.type === "DOOR"
    ? "#22c55e"
    : cell.type === "DRIVER"
    ? "#f97316"
    : cell.type === "AISLE"
    ? "#9ca3af"
    : cell.type === "EXTRA"
    ? "#a855f7"
    : "#fafafa",
cursor: "pointer",
color: cell.type === "EMPTY" ? "#000" : "#fff",
fontWeight: "bold",
                    }}
                  >
                   {cell.type === "EMPTY"
  ? `${cell.row + 1}-${cell.col + 1}`
  : cell.type === "SEAT"
  ? getSeatLabel(cell.row, cell.col)
  : cell.type}
                  </div>

                ))}

              </div>

            ))}

          </div>
        )}

      </RBCard>

    </div>
  );
}
