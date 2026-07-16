import { colors, spacing, radius, typography } from "../tokens";

export default function RBInput({
  label,
  error,
  style = {},
  ...props
}) {
  return (
    <div style={{ marginBottom: spacing.lg }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: spacing.sm,
            fontFamily: typography.fontFamily,
            fontSize: typography.body,
            color: colors.text,
            fontWeight: typography.weight.medium,
          }}
        >
          {label}
        </label>
      )}

      <input
        {...props}
        style={{
          width: "100%",
          padding: spacing.md,
          borderRadius: radius.lg,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          outline: "none",
          fontFamily: typography.fontFamily,
          fontSize: typography.body,
          background: colors.white,
          boxSizing: "border-box",
          ...style,
        }}
      />

      {error && (
        <small
          style={{
            color: colors.danger,
            marginTop: spacing.xs,
            display: "block",
          }}
        >
          {error}
        </small>
      )}
    </div>
  );
}
