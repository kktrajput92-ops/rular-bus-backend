export const BUS_TYPES = {
  SEATER: "seater",
  SLEEPER: "sleeper",
  SEMI_SLEEPER: "semi-sleeper",
};

export const LAYOUTS = {
  "2x2": "2x2",
  "2x1": "2x1",
  "3x2": "3x2",
  "sleeper": "sleeper",
};

export const DEFAULT_BUS_CONFIG = {
  busType: BUS_TYPES.SEATER,

  upperDeck: {
    enabled: false,
    layout: null,
    totalSeats: 0,
  },

  lowerDeck: {
    layout: LAYOUTS["2x2"],
    totalSeats: 52,
  },
};
