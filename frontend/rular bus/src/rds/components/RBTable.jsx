import { colors, spacing, radius, typography } from "../tokens";

export default function RBTable({ columns = [], data = [] }) {
  return (
    <div
      style={{
        overflowX: "auto",
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        background: colors.white,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: typography.fontFamily,
        }}
      >
        <thead
          style={{
            background: colors.primary,
            color: colors.white,
          }}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: spacing.lg,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {col.title || col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              style={{
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: spacing.lg,
                  }}
                >
                  {col.render
                    ? col.render(row)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
