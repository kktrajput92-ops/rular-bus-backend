const pool = require("../config/db");

const parseNullableId = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isInteger(number) &&
    number > 0
    ? number
    : NaN;
};

const parseBoolean = (
  value,
  fallback = false
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return fallback;
};

const validateCatalogSelection = async ({
  manufacturerId,
  modelId,
  bodyVariantId,
  layoutTemplateId,
}) => {
  if (
    modelId &&
    !manufacturerId
  ) {
    return {
      valid: false,
      message:
        "Manufacturer is required when a model is selected.",
    };
  }

  if (
    bodyVariantId &&
    !modelId
  ) {
    return {
      valid: false,
      message:
        "Bus model is required when a body variant is selected.",
    };
  }

  if (manufacturerId) {
    const manufacturer =
      await pool.query(
        `
        SELECT id
        FROM bus_manufacturers
        WHERE id = $1
          AND is_active = TRUE
        `,
        [manufacturerId]
      );

    if (!manufacturer.rows.length) {
      return {
        valid: false,
        message:
          "Selected manufacturer does not exist or is inactive.",
      };
    }
  }

  if (modelId) {
    const model = await pool.query(
      `
      SELECT id
      FROM bus_models
      WHERE id = $1
        AND manufacturer_id = $2
        AND is_active = TRUE
      `,
      [
        modelId,
        manufacturerId,
      ]
    );

    if (!model.rows.length) {
      return {
        valid: false,
        message:
          "Selected model does not belong to the selected manufacturer.",
      };
    }
  }

  if (bodyVariantId) {
    const variant =
      await pool.query(
        `
        SELECT id
        FROM bus_body_variants
        WHERE id = $1
          AND model_id = $2
          AND is_active = TRUE
        `,
        [
          bodyVariantId,
          modelId,
        ]
      );

    if (!variant.rows.length) {
      return {
        valid: false,
        message:
          "Selected body variant does not belong to the selected model.",
      };
    }
  }

  if (layoutTemplateId) {
    const template =
      await pool.query(
        `
        SELECT id
        FROM seat_layout_templates
        WHERE id = $1
          AND is_active = TRUE
          AND (
            manufacturer_id IS NULL
            OR manufacturer_id = $2
          )
          AND (
            model_id IS NULL
            OR model_id = $3
          )
          AND (
            body_variant_id IS NULL
            OR body_variant_id = $4
          )
        `,
        [
          layoutTemplateId,
          manufacturerId,
          modelId,
          bodyVariantId,
        ]
      );

    if (!template.rows.length) {
      return {
        valid: false,
        message:
          "Selected layout template is not valid for this bus configuration.",
      };
    }
  }

  return {
    valid: true,
  };
};

const getBusSelectQuery = () => `
  SELECT
    bus.*,

    manufacturer.name
      AS manufacturer_name,
    manufacturer.code
      AS manufacturer_code,

    model.name
      AS model_name,
    model.code
      AS model_code,

    variant.name
      AS body_variant_name,
    variant.code
      AS body_variant_code,
    variant.body_type,
    variant.layout_mode,
    variant.default_preset,

    template.name
      AS seat_layout_template_name,
    template.code
      AS seat_layout_template_code

  FROM buses bus

  LEFT JOIN bus_manufacturers manufacturer
    ON manufacturer.id =
      bus.manufacturer_id

  LEFT JOIN bus_models model
    ON model.id =
      bus.model_id

  LEFT JOIN bus_body_variants variant
    ON variant.id =
      bus.body_variant_id

  LEFT JOIN seat_layout_templates template
    ON template.id =
      bus.seat_layout_template_id
`;

const addBus = async (
  req,
  res
) => {
  try {
    const {
      bus_name,
      bus_number,
      bus_type,
      registration_number,
      operator_name,
      bus_status,
    } = req.body;

    const rtoApprovedSeats =
      Number(
        req.body.rto_approved_seats
      );

    const physicalSeats =
      Number(
        req.body.physical_seats
      );

    const totalSeats =
      physicalSeats;

    const manufacturerId =
      parseNullableId(
        req.body.manufacturer_id
      );

    const modelId =
      parseNullableId(
        req.body.model_id
      );

    const bodyVariantId =
      parseNullableId(
        req.body.body_variant_id
      );

    const layoutTemplateId =
      parseNullableId(
        req.body
          .seat_layout_template_id
      );

    if (
      [
        manufacturerId,
        modelId,
        bodyVariantId,
        layoutTemplateId,
      ].some(Number.isNaN)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid bus catalog selection.",
      });
    }

    if (
      !String(bus_name || "").trim() ||
      !String(bus_number || "").trim() ||
      !String(bus_type || "").trim() ||
      !String(
        registration_number || ""
      ).trim() ||
      !String(
        operator_name || ""
      ).trim() ||
      !String(bus_status || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All required bus fields must be provided.",
      });
    }

    if (
      !Number.isInteger(
        rtoApprovedSeats
      ) ||
      !Number.isInteger(
        physicalSeats
      ) ||
      rtoApprovedSeats < 0 ||
      physicalSeats < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Seat counts must be non-negative whole numbers.",
      });
    }

    if (
      physicalSeats <
      rtoApprovedSeats
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Physical seats cannot be less than RTO approved seats.",
      });
    }

    const catalogValidation =
      await validateCatalogSelection({
        manufacturerId,
        modelId,
        bodyVariantId,
        layoutTemplateId,
      });

    if (!catalogValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          catalogValidation.message,
      });
    }

    const duplicate =
      await pool.query(
        `
        SELECT id
        FROM buses
        WHERE LOWER(bus_number) =
          LOWER($1)
        `,
        [String(bus_number).trim()]
      );

    if (duplicate.rows.length) {
      return res.status(409).json({
        success: false,
        message:
          "Bus number already exists.",
      });
    }

    const result =
      await pool.query(
        `
        INSERT INTO buses (
          bus_name,
          bus_number,
          total_seats,
          bus_type,
          rto_approved_seats,
          physical_seats,
          registration_number,
          operator_name,
          bus_status,
          is_ac,
          is_sleeper,
          manufacturer_id,
          model_id,
          body_variant_id,
          seat_layout_template_id
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15
        )
        RETURNING *
        `,
        [
          String(bus_name).trim(),
          String(bus_number).trim(),
          totalSeats,
          String(bus_type).trim(),
          rtoApprovedSeats,
          physicalSeats,
          String(
            registration_number
          ).trim(),
          String(operator_name).trim(),
          String(bus_status).trim(),
          parseBoolean(
            req.body.is_ac
          ),
          parseBoolean(
            req.body.is_sleeper
          ),
          manufacturerId,
          modelId,
          bodyVariantId,
          layoutTemplateId,
        ]
      );

    return res.status(201).json({
      success: true,
      message:
        "Bus added successfully.",
      bus: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Add bus failed:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "Bus number already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to add bus.",
    });
  }
};

const getAllBuses = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(`
        ${getBusSelectQuery()}
        ORDER BY bus.id DESC
      `);

    return res.json({
      success: true,
      total: result.rows.length,
      buses: result.rows,
    });
  } catch (error) {
    console.error(
      "Get buses failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load buses.",
    });
  }
};

const getBusById = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(
        `
        ${getBusSelectQuery()}
        WHERE bus.id = $1
        `,
        [req.params.id]
      );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Bus not found.",
      });
    }

    return res.json({
      success: true,
      bus: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get bus failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load bus.",
    });
  }
};

const updateBus = async (
  req,
  res
) => {
  try {
    const {
      bus_name,
      bus_number,
      bus_type,
      registration_number,
      operator_name,
      bus_status,
    } = req.body;

    const rtoApprovedSeats =
      Number(
        req.body.rto_approved_seats
      );

    const physicalSeats =
      Number(
        req.body.physical_seats
      );

    const totalSeats =
      physicalSeats;

    const manufacturerId =
      parseNullableId(
        req.body.manufacturer_id
      );

    const modelId =
      parseNullableId(
        req.body.model_id
      );

    const bodyVariantId =
      parseNullableId(
        req.body.body_variant_id
      );

    const layoutTemplateId =
      parseNullableId(
        req.body
          .seat_layout_template_id
      );

    if (
      [
        manufacturerId,
        modelId,
        bodyVariantId,
        layoutTemplateId,
      ].some(Number.isNaN)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid bus catalog selection.",
      });
    }

    if (
      !String(bus_name || "").trim() ||
      !String(bus_number || "").trim() ||
      !String(bus_type || "").trim() ||
      !String(
        registration_number || ""
      ).trim() ||
      !String(
        operator_name || ""
      ).trim() ||
      !String(bus_status || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All required bus fields must be provided.",
      });
    }

    if (
      !Number.isInteger(
        rtoApprovedSeats
      ) ||
      !Number.isInteger(
        physicalSeats
      ) ||
      rtoApprovedSeats < 0 ||
      physicalSeats < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Seat counts must be non-negative whole numbers.",
      });
    }

    if (
      physicalSeats <
      rtoApprovedSeats
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Physical seats cannot be less than RTO approved seats.",
      });
    }

    const catalogValidation =
      await validateCatalogSelection({
        manufacturerId,
        modelId,
        bodyVariantId,
        layoutTemplateId,
      });

    if (!catalogValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          catalogValidation.message,
      });
    }

    const duplicate =
      await pool.query(
        `
        SELECT id
        FROM buses
        WHERE LOWER(bus_number) =
          LOWER($1)
          AND id <> $2
        `,
        [
          String(bus_number).trim(),
          req.params.id,
        ]
      );

    if (duplicate.rows.length) {
      return res.status(409).json({
        success: false,
        message:
          "Bus number already exists.",
      });
    }

    const result =
      await pool.query(
        `
        UPDATE buses
        SET
          bus_name = $1,
          bus_number = $2,
          bus_type = $3,
          total_seats = $4,
          rto_approved_seats = $5,
          physical_seats = $6,
          registration_number = $7,
          operator_name = $8,
          bus_status = $9,
          is_ac = $10,
          is_sleeper = $11,
          manufacturer_id = $12,
          model_id = $13,
          body_variant_id = $14,
          seat_layout_template_id = $15,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $16
        RETURNING *
        `,
        [
          String(bus_name).trim(),
          String(bus_number).trim(),
          String(bus_type).trim(),
          totalSeats,
          rtoApprovedSeats,
          physicalSeats,
          String(
            registration_number
          ).trim(),
          String(operator_name).trim(),
          String(bus_status).trim(),
          parseBoolean(
            req.body.is_ac
          ),
          parseBoolean(
            req.body.is_sleeper
          ),
          manufacturerId,
          modelId,
          bodyVariantId,
          layoutTemplateId,
          req.params.id,
        ]
      );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Bus not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Bus updated successfully.",
      bus: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update bus failed:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "Bus number already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update bus.",
    });
  }
};

const deleteBus = async (
  req,
  res
) => {
  try {
    const schedule =
      await pool.query(
        `
        SELECT id
        FROM schedules
        WHERE bus_id = $1
        LIMIT 1
        `,
        [req.params.id]
      );

    if (schedule.rows.length) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete bus because a schedule already exists.",
      });
    }

    const result =
      await pool.query(
        `
        DELETE FROM buses
        WHERE id = $1
        RETURNING id
        `,
        [req.params.id]
      );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Bus not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Bus deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete bus failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete bus.",
    });
  }
};

module.exports = {
  addBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
};
