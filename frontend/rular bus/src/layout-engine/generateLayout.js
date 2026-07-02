import layout2x2 from "./layouts/layout2x2";
import layout2x1 from "./layouts/layout2x1";
export function generateLayout(totalSeats, layoutType) {
  switch (layoutType) {
   case "2x2":
  return layout2x2(totalSeats);

case "2x1":
  return layout2x1(totalSeats);

default:
  return layout2x2(totalSeats);
  }
}
