export function createSeat(
  id,
  label,
  side,
  position,
  type = "normal",
  status = "available"
) {
  return {
    id,
    label,
    side,
    position,
    type,
    status,
  };
}
