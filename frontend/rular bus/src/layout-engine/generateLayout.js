import layout2x2 from "./layouts/layout2x2";
import layout2x1 from "./layouts/layout2x1";
import layout3x2 from "./layouts/layout3x2";
import sleeper from "./layouts/sleeper";
import premiumSleeper from "./layouts/premiumSleeper";
import mirrorSleeper from "./layouts/mirrorSleeper";
import semiSleeper from "./layouts/semiSleeper";
import mixedCoach from "./layouts/mixedCoach";

export function generateLayout(config = {}) {
  const layoutType =
    config.lowerDeck?.layout || config.layoutType;

  const totalSeats =
    config.lowerDeck?.totalSeats || config.totalSeats || 0;

  switch (layoutType) {
    case "2x2":
      return layout2x2(totalSeats);

    case "2x1":
      return layout2x1(totalSeats);

    case "3x2":
      return layout3x2(totalSeats);

    case "sleeper":
      return sleeper(totalSeats);

    case "premium-sleeper":
      return premiumSleeper(config);

    case "mirror-sleeper":
      return mirrorSleeper(config);

    case "semi-sleeper":
      return semiSleeper(config);

    case "mixed-coach":
      return mixedCoach(config);

    default:
      return [];
  }
}
