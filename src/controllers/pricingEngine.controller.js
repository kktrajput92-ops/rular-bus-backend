const pricingEngineService = require("../services/pricingEngine.service");

const calculateFare = async (req, res) => {
  try {
    const {
  routeId,
  busId,
  scheduleId,
  journeyId,
  categoryId,
  travelDate,
  travelTime,
  baseFare,
} = req.body;

    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: "routeId is required.",
      });
    }

    if (!travelDate) {
      return res.status(400).json({
        success: false,
        message: "travelDate is required.",
      });
    }

    if (baseFare === undefined || Number(baseFare) < 0) {
      return res.status(400).json({
        success: false,
        message: "A valid baseFare is required.",
      });
    }

   const result = await pricingEngineService.calculateFare({
  routeId,
  busId,
  scheduleId,
  journeyId,
  categoryId,
  travelDate,
  travelTime,
  baseFare,
});

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Pricing engine error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate fare.",
      error: error.message,
    });
  }
};

module.exports = {
  calculateFare,
};
