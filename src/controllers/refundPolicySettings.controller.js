const pool = require("../config/db");

const POLICY_CODE =
  "RULAR_BUS_CANCELLATION_POLICY";

const VALID_CHARGE_MODES = new Set([
  "POLICY_CHARGE",
  "NO_CHARGE",
  "CUSTOM_CHARGE",
]);

const getAuthenticatedUserId = (req) => {
  const value =
    req.user?.id ??
    req.user?.user_id ??
    req.userId ??
    null;

  const parsed = Number(value);

  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
};

const getAuthenticatedCompanyId = (req) => {
  const value =
    req.user?.company_id ??
    req.companyId ??
    null;

  const parsed = Number(value);

  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
};

const getRequestIp = (req) =>
  String(
    req.ip ||
      req.socket?.remoteAddress ||
      ""
  ).slice(0, 100) || null;

const getUserAgent = (req) =>
  String(
    req.get("user-agent") || ""
  ).slice(0, 5000) || null;

const parseOptionalBoolean = (
  value,
  fieldName
) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    const error = new Error(
      `${fieldName} must be true or false.`
    );

    error.status = 400;
    throw error;
  }

  return value;
};

const getRefundPolicySettings = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          policy_code,
          policy_name,
          automatic_refund_enabled,
          default_charge_mode,
          allow_no_charge_override,
          allow_custom_charge_override,
          automatic_refund_processing_mode,
          is_active,
          created_by_user_id,
          updated_by_user_id,
          created_at,
          updated_at
        FROM refund_policy_settings
        WHERE policy_code = $1
          AND is_active = TRUE
        LIMIT 1
      `,
      [POLICY_CODE]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Rular Bus Cancellation Policy settings were not found.",
      });
    }

    return res.json({
      success: true,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get refund policy settings failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to load refund policy settings.",
      });
  }
};

const updateRefundPolicySettings = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Valid authenticated user is required.",
      });
    }

    const automaticRefundEnabled =
      parseOptionalBoolean(
        req.body
          .automatic_refund_enabled,
        "automatic_refund_enabled"
      );

    const allowNoChargeOverride =
      parseOptionalBoolean(
        req.body
          .allow_no_charge_override,
        "allow_no_charge_override"
      );

    const allowCustomChargeOverride =
      parseOptionalBoolean(
        req.body
          .allow_custom_charge_override,
        "allow_custom_charge_override"
      );

    let defaultChargeMode;

    if (
      req.body.default_charge_mode !==
      undefined
    ) {
      defaultChargeMode = String(
        req.body.default_charge_mode
      )
        .trim()
        .toUpperCase();

      if (
        !VALID_CHARGE_MODES.has(
          defaultChargeMode
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "default_charge_mode must be POLICY_CHARGE, NO_CHARGE or CUSTOM_CHARGE.",
        });
      }
    }

    const hasUpdate =
      automaticRefundEnabled !==
        undefined ||
      allowNoChargeOverride !==
        undefined ||
      allowCustomChargeOverride !==
        undefined ||
      defaultChargeMode !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        success: false,
        message:
          "At least one refund policy setting is required.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const currentResult =
      await client.query(
        `
          SELECT *
          FROM refund_policy_settings
          WHERE policy_code = $1
            AND is_active = TRUE
          LIMIT 1
          FOR UPDATE
        `,
        [POLICY_CODE]
      );

    if (!currentResult.rows.length) {
      const error = new Error(
        "Rular Bus Cancellation Policy settings were not found."
      );

      error.status = 404;
      throw error;
    }

    const current =
      currentResult.rows[0];

    const updateResult =
      await client.query(
        `
          UPDATE refund_policy_settings
          SET
            automatic_refund_enabled =
              $1,
            default_charge_mode =
              $2,
            allow_no_charge_override =
              $3,
            allow_custom_charge_override =
              $4,
            automatic_refund_processing_mode =
              'GATEWAY',
            updated_by_user_id =
              $5,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $6
          RETURNING
            id,
            policy_code,
            policy_name,
            automatic_refund_enabled,
            default_charge_mode,
            allow_no_charge_override,
            allow_custom_charge_override,
            automatic_refund_processing_mode,
            is_active,
            created_by_user_id,
            updated_by_user_id,
            created_at,
            updated_at
        `,
        [
          automaticRefundEnabled ??
            current
              .automatic_refund_enabled,

          defaultChargeMode ??
            current.default_charge_mode,

          allowNoChargeOverride ??
            current
              .allow_no_charge_override,

          allowCustomChargeOverride ??
            current
              .allow_custom_charge_override,

          userId,
          current.id,
        ]
      );

    await client.query(
      `
        INSERT INTO audit_logs (
          company_id,
          user_id,
          module_name,
          action,
          record_id,
          ip_address,
          user_agent
        )
        VALUES (
          $1,
          $2,
          'REFUND_MANAGEMENT',
          'REFUND_POLICY_SETTINGS_UPDATED',
          $3,
          $4,
          $5
        )
      `,
      [
        getAuthenticatedCompanyId(req),
        userId,
        current.id,
        getRequestIp(req),
        getUserAgent(req),
      ]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message:
        "Rular Bus Cancellation Policy settings updated successfully.",
      settings: updateResult.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Refund settings rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Update refund policy settings failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to update refund policy settings.",
      });
  } finally {
    client.release();
  }
};

module.exports = {
  getRefundPolicySettings,
  updateRefundPolicySettings,
};
