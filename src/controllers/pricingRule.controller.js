const pool = require("../config/db");

// Create Pricing Rule
const createPricingRule = async (req, res) => {
  try {
    const {
      name,
      rule_type,
      pricing_method,
      amount,
      category_id,
      route_id,
      bus_id,
      schedule_id,
      journey_id,
      effective_from,
      effective_to,
      priority = 1,
      approval_mode = "MANAGER_ONLY",
      change_reason = null,
      condition_data = {},
    } = req.body;

    if (!name || !rule_type || !pricing_method || amount == null) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }
if (
  effective_from &&
  effective_to &&
  new Date(effective_from) > new Date(effective_to)
) {
  return res.status(400).json({
    success: false,
    message: "effective_from cannot be later than effective_to.",
  });
}
const duplicateRule = await pool.query(
  `SELECT id
   FROM pricing_rules
   WHERE is_active = TRUE
     AND route_id IS NOT DISTINCT FROM $1
     AND bus_id IS NOT DISTINCT FROM $2
     AND schedule_id IS NOT DISTINCT FROM $3
     AND journey_id IS NOT DISTINCT FROM $4
     AND category_id IS NOT DISTINCT FROM $5
     AND rule_type = $6
     AND pricing_method = $7
     AND effective_from = $8
     AND effective_to = $9
   LIMIT 1`,
  [
    route_id || null,
    bus_id || null,
    schedule_id || null,
    journey_id || null,
    category_id || null,
    rule_type,
    pricing_method,
    effective_from,
    effective_to,
  ]
);

if (duplicateRule.rows.length > 0) {
  return res.status(409).json({
    success: false,
    message: "A pricing rule with the same configuration already exists.",
  });
}
    const result = await pool.query(
      `INSERT INTO pricing_rules
      (
        name,
        rule_type,
        pricing_method,
        amount,
        category_id,
        route_id,
        bus_id,
        schedule_id,
        journey_id,
        effective_from,
        effective_to,
        priority,
        approval_mode,
        change_reason,
        condition_data
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
      )
      RETURNING *`,
      [
        name,
        rule_type,
        pricing_method,
        amount,
        category_id,
        route_id,
        bus_id,
        schedule_id,
        journey_id,
        effective_from,
        effective_to,
        priority,
        approval_mode,
        change_reason,
        condition_data,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Pricing rule created successfully",
      rule: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Get All Pricing Rules
// Get Pricing Rule By ID
const getPricingRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         pr.*,
         fc.name AS category_name,
         fc.code AS category_code,
         r.source AS route_source,
         r.destination AS route_destination
       FROM pricing_rules pr
       LEFT JOIN fare_categories fc
         ON fc.id = pr.category_id
       LEFT JOIN routes r
         ON r.id = pr.route_id
       WHERE pr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pricing rule not found",
      });
    }

    res.json({
      success: true,
      rule: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const getAllPricingRules = async (req, res) => {
  try {
    const result = await pool.query(
  `SELECT
     pr.*,
     fc.name AS category_name,
     fc.code AS category_code,
     r.source AS route_source,
     r.destination AS route_destination
   FROM pricing_rules pr
   LEFT JOIN fare_categories fc
     ON pr.category_id = fc.id
   LEFT JOIN routes r
     ON pr.route_id = r.id
   WHERE pr.is_active = TRUE
   ORDER BY pr.priority DESC, pr.created_at DESC`
);

    res.json({
      success: true,
      count: result.rows.length,
      rules: result.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Update Pricing Rule
const updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      rule_type,
      route_id,
      bus_id,
      schedule_id,
      journey_id,
      category_id,
      pricing_method,
      amount,
      effective_from,
      effective_to,
      condition_data,
      priority,
      approval_mode,
      change_reason,
      is_active,
    } = req.body;

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid pricing rule ID is required.",
      });
    }

    const existingRuleResult = await pool.query(
      `SELECT *
       FROM pricing_rules
       WHERE id = $1`,
      [id]
    );

    if (existingRuleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pricing rule not found.",
      });
    }

    const existingRule = existingRuleResult.rows[0];

    const updatedName =
      name !== undefined ? name.trim() : existingRule.name;

    const updatedRuleType =
      rule_type !== undefined ? rule_type : existingRule.rule_type;

    const updatedRouteId =
      route_id !== undefined ? route_id : existingRule.route_id;

    const updatedBusId =
      bus_id !== undefined ? bus_id : existingRule.bus_id;

    const updatedScheduleId =
      schedule_id !== undefined ? schedule_id : existingRule.schedule_id;

    const updatedJourneyId =
      journey_id !== undefined ? journey_id : existingRule.journey_id;

    const updatedCategoryId =
      category_id !== undefined ? category_id : existingRule.category_id;

    const updatedPricingMethod =
      pricing_method !== undefined
        ? pricing_method
        : existingRule.pricing_method;

    const updatedAmount =
      amount !== undefined ? amount : existingRule.amount;

    const updatedEffectiveFrom =
      effective_from !== undefined
        ? effective_from
        : existingRule.effective_from;

    const updatedEffectiveTo =
      effective_to !== undefined
        ? effective_to
        : existingRule.effective_to;

    const updatedConditionData =
      condition_data !== undefined
        ? condition_data
        : existingRule.condition_data;

    const updatedPriority =
      priority !== undefined ? priority : existingRule.priority;

    const updatedApprovalMode =
      approval_mode !== undefined
        ? approval_mode
        : existingRule.approval_mode;

    const updatedChangeReason =
      change_reason !== undefined
        ? change_reason
        : existingRule.change_reason;

    const updatedIsActive =
      is_active !== undefined ? is_active : existingRule.is_active;

    if (!updatedName) {
      return res.status(400).json({
        success: false,
        message: "Pricing rule name is required.",
      });
    }

    if (!updatedRuleType) {
      return res.status(400).json({
        success: false,
        message: "Rule type is required.",
      });
    }

    const validPricingMethods = [
      "FIXED",
      "PERCENTAGE",
      "MULTIPLIER",
    ];

    if (!validPricingMethods.includes(updatedPricingMethod)) {
      return res.status(400).json({
        success: false,
        message:
          "Pricing method must be FIXED, PERCENTAGE, or MULTIPLIER.",
      });
    }

    if (
      updatedAmount === null ||
      updatedAmount === "" ||
      Number.isNaN(Number(updatedAmount))
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid pricing amount is required.",
      });
    }

    if (Number(updatedAmount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Pricing amount cannot be negative.",
      });
    }

    if (
      updatedEffectiveFrom &&
      updatedEffectiveTo &&
      new Date(updatedEffectiveFrom) > new Date(updatedEffectiveTo)
    ) {
      return res.status(400).json({
        success: false,
        message: "effective_from cannot be later than effective_to.",
      });
    }

    const duplicateRuleResult = await pool.query(
      `SELECT id
       FROM pricing_rules
       WHERE id <> $1
         AND is_active = TRUE
         AND route_id IS NOT DISTINCT FROM $2
         AND bus_id IS NOT DISTINCT FROM $3
         AND schedule_id IS NOT DISTINCT FROM $4
         AND journey_id IS NOT DISTINCT FROM $5
         AND category_id IS NOT DISTINCT FROM $6
         AND rule_type = $7
         AND pricing_method = $8
         AND effective_from = $9
         AND effective_to = $10
       LIMIT 1`,
      [
        id,
        updatedRouteId,
        updatedBusId,
        updatedScheduleId,
        updatedJourneyId,
        updatedCategoryId,
        updatedRuleType,
        updatedPricingMethod,
        updatedEffectiveFrom,
        updatedEffectiveTo,
      ]
    );

    if (duplicateRuleResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "A pricing rule with the same configuration already exists.",
      });
    }

    const result = await pool.query(
      `UPDATE pricing_rules
       SET
         name = $1,
         rule_type = $2,
         route_id = $3,
         bus_id = $4,
         schedule_id = $5,
         journey_id = $6,
         category_id = $7,
         pricing_method = $8,
         amount = $9,
         effective_from = $10,
         effective_to = $11,
         condition_data = $12::jsonb,
         priority = $13,
         approval_mode = $14,
         change_reason = $15,
         is_active = $16,
         version = COALESCE(version, 1) + 1,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING *`,
      [
        updatedName,
        updatedRuleType,
        updatedRouteId,
        updatedBusId,
        updatedScheduleId,
        updatedJourneyId,
        updatedCategoryId,
        updatedPricingMethod,
        updatedAmount,
        updatedEffectiveFrom,
        updatedEffectiveTo,
        JSON.stringify(updatedConditionData || {}),
        updatedPriority,
        updatedApprovalMode,
        updatedChangeReason,
        updatedIsActive,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Pricing rule updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update pricing rule error:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message:
          "The provided route, bus, schedule, journey, or category ID is invalid.",
      });
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid input format.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update pricing rule.",
      error: error.message,
    });
  }
};
// Soft Delete Pricing Rule
const deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid pricing rule ID is required.",
      });
    }

    const result = await pool.query(
      `UPDATE pricing_rules
       SET
         is_active = FALSE,
         version = COALESCE(version, 1) + 1,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND is_active = TRUE
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      const existingRule = await pool.query(
        `SELECT id, is_active
         FROM pricing_rules
         WHERE id = $1`,
        [id]
      );

      if (existingRule.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Pricing rule not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Pricing rule is already inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pricing rule deactivated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Soft delete pricing rule error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid pricing rule ID format.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate pricing rule.",
      error: error.message,
    });
  }
};
module.exports = {
  createPricingRule,
  getAllPricingRules,
  getPricingRuleById,
  updatePricingRule,
  deletePricingRule,
};
