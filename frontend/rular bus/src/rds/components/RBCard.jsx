import { colors, spacing, radius } from "../tokens";

export default function RBCard({
  children,
  style = {},
  ...props
}) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        padding: spacing.lg,
        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
