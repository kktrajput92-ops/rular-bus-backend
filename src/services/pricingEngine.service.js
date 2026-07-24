const pool = require("../config/db");

class PricingEngineService {
  async calculateFare({
    routeId,
    busId = null,
    scheduleId = null,
    journeyId = null,
    categoryId = null,
    travelDate,
    travelTime = null,
    baseFare,
  }) {
    const result = await pool.query(
      `SELECT *
       FROM pricing_rules
       WHERE is_active = TRUE
         AND approval_status = 'APPROVED'
         AND (route_id IS NULL OR route_id = $1)
         AND (bus_id IS NULL OR bus_id = $2)
         AND (schedule_id IS NULL OR schedule_id = $3)
         AND (journey_id IS NULL OR journey_id = $4)
         AND (category_id IS NULL OR category_id = $5)
         AND effective_from <= $6
         AND effective_to >= $6
       ORDER BY priority DESC`,
      [
        routeId,
        busId,
        scheduleId,
        journeyId,
        categoryId,
        travelDate,
      ]
    );

    let finalFare = Number(baseFare);
    const appliedRules = [];

    const travelDay = new Date(travelDate)
      .toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      })
      .toUpperCase();

    const normalizedTravelTime = travelTime
      ? String(travelTime).trim().substring(0, 5)
      : null;

    for (const rule of result.rows) {
      const allowedDays = Array.isArray(rule.condition_data?.days)
        ? rule.condition_data.days.map((day) =>
            String(day).trim().toUpperCase()
          )
        : [];

      if (
        allowedDays.length > 0 &&
        !allowedDays.includes(travelDay)
      ) {
        continue;
      }

      const timeFrom = rule.condition_data?.timeFrom
        ? String(rule.condition_data.timeFrom).trim().substring(0, 5)
        : null;

      const timeTo = rule.condition_data?.timeTo
        ? String(rule.condition_data.timeTo).trim().substring(0, 5)
        : null;

      if (timeFrom && timeTo) {
        if (!normalizedTravelTime) {
          continue;
        }

        if (
          normalizedTravelTime < timeFrom ||
          normalizedTravelTime > timeTo
        ) {
          continue;
        }
      }

      const adjustmentType = String(
  rule.condition_data?.adjustmentType || "LEGACY"
)
  .trim()
  .toUpperCase();

const amount = Number(rule.amount);

if (!Number.isFinite(amount) || amount < 0) {
  continue;
}

switch (rule.pricing_method) {
  case "FIXED":
    if (adjustmentType === "DISCOUNT") {
      finalFare -= amount;
    } else if (adjustmentType === "SURCHARGE") {
      finalFare += amount;
    } else {
      finalFare = amount;
    }
    break;

  case "PERCENTAGE":
    if (adjustmentType === "DISCOUNT") {
      finalFare -= (finalFare * amount) / 100;
    } else {
      finalFare += (finalFare * amount) / 100;
    }
    break;

  case "MULTIPLIER":
    finalFare *= amount;
    break;

  default:
    continue;
}

if (finalFare < 0) {
  finalFare = 0;
}

      appliedRules.push(rule);
    }

    return {
      baseFare: Number(baseFare),
      finalFare: Number(finalFare.toFixed(2)),
      appliedRules,
    };
  }
}

module.exports = new PricingEngineService();
