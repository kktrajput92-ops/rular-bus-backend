import { COLORS } from "../theme/colors";

export default function StatCard({
  title,
  value,
  color = COLORS.primary,
}) {
  return (
    <div
      style={{
        background: color,
        color: COLORS.white,
        padding: 20,
        borderRadius: 18,
        boxShadow: `0 4px 12px ${COLORS.shadow}`,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {title}
      </h3>

      <h1
        style={{
          marginTop: 10,
          marginBottom: 0,
          fontSize: 34,
          fontWeight: 700,
        }}
      >
        {value}
      </h1>
    </div>
  );
}
