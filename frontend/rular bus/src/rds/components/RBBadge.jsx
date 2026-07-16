import { colors, spacing, radius, typography } from "../tokens";

const variants = {
  success: {
    background: "#DCFCE7",
    color: colors.success,
  },
  warning: {
    background: "#FEF3C7",
    color: colors.warning,
  },
  danger: {
    background: "#FEE2E2",
    color: colors.danger,
  },
  info: {
    background: "#DBEAFE",
    color: colors.primary,
  },
};

export default function RBBadge({
  children,
  variant = "info",
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${spacing.xs}px ${spacing.md}px`,
        borderRadius: radius.full,
        fontFamily: typography.fontFamily,
        fontSize: typography.caption,
        fontWeight: typography.weight.semibold,
        ...variants[variant],
      }}
    >
      {children}
    </span>
  );
}
