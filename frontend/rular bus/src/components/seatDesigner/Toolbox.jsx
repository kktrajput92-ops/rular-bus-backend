import { RBButton } from "../../rds/components";

const TOOLS = [
  "SEAT",
  "LOWER_BERTH",
  "UPPER_BERTH",
  "DOOR",
  "DRIVER",
  "AISLE",
  "EXTRA",
  "EMPTY",
];

export default function Toolbox({ selectedTool, onSelect }) {
  return (
    <div
      style={{
        minWidth: 180,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {TOOLS.map((tool) => (
        <RBButton
          key={tool}
          onClick={() => onSelect(tool)}
          style={{
            background:
              selectedTool === tool ? "#2563eb" : "#e5e7eb",
            color:
              selectedTool === tool ? "#fff" : "#111",
          }}
        >
          {tool}
        </RBButton>
      ))}
    </div>
  );
}
