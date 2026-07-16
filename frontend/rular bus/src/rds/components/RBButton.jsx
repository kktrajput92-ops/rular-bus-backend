import { colors, spacing, radius, typography } from "../tokens";

export default function RBButton({
  children,
  variant = "primary",
  disabled = false,
  onClick,
  style = {},
  ...props
}) {
  const variants = {
    primary: {
      background: colors.primary,
      color: colors.white,
    },
    secondary: {
      background: colors.surface,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    },
    danger: {
      background: colors.danger,
      color: colors.white,
    },
    success: {
      background: colors.success,
      color: colors.white,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: `${spacing.md}px ${spacing.lg}px`,
        borderRadius: radius.lg,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: typography.fontFamily,
        fontSize: typography.body,
        fontWeight: typography.weight.semibold,
        transition: "0.2s",
        opacity: disabled ? 0.6 : 1,
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
