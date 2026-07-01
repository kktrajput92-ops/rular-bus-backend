import layout2x2 from "./layouts/layout2x2";

export function generateLayout(totalSeats, layoutType) {
  switch (layoutType) {
    case "2x2":
      return layout2x2(totalSeats);

    default:
      return [];
  }
}
