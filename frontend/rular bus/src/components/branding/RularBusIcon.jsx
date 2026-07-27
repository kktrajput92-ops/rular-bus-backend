export default function RularBusIcon({
  size = 40,
  className = "",
  alt = "RULAR BUS",
  decorative = false,
}) {
  return (
    <img
      src="/branding/rular-bus-icon.png"
      alt={decorative ? "" : alt}
      aria-hidden={
        decorative
          ? "true"
          : undefined
      }
      className={[
        "rular-bus-brand-icon",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: `${size}px`,
        height: "auto",
      }}
      draggable="false"
    />
  );
}
