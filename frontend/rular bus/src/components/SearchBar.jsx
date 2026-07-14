import { COLORS } from "../theme/colors";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        boxShadow: `0 2px 8px ${COLORS.shadow}`,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

