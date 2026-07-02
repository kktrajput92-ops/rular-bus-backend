import layout2x2 from "./layouts/layout2x2";
import layout2x1 from "./layouts/layout2x1";
import layout3x2 from "./layouts/layout3x2";
import sleeper from "./layouts/sleeper";
export function generateLayout(totalSeats, layoutType) {
  switch (layoutType) {
case "sleeper":
  return sleeper(totalSeats);

    case "2x2":
      return layout2x2(totalSeats);

    case "2x1":
      return layout2x1(totalSeats);

    case "3x2":
      return layout3x2(totalSeats);

    default:
      return layout2x2(totalSeats);
  }
}
