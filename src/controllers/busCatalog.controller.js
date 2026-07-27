const pool = require("../config/db");

const normalizeCode = (value = "") =>
  String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const parseBoolean = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  return value === true || value === "true";
};

const parseNullableInteger = (value) => {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  const number = Number(value);

  return Number.isInteger(number) ? number : NaN;
};

const parseNullableNumber = (value) => {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : NaN;
};

const safeJsonObject = (value) => {
  if (!value) return {};

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

// =========================================================
// CATALOG SUMMARY
// =========================================================

const getCatalogSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM bus_manufacturers) AS manufacturers,
        (SELECT COUNT(*) FROM bus_models) AS models,
        (SELECT COUNT(*) FROM bus_body_variants) AS body_variants,
        (SELECT COUNT(*) FROM seat_layout_templates) AS templates
    `);

    return res.json({
      success: true,
      summary: result.rows[0],
    });
  } catch (error) {
    console.error("Catalog summary failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load bus catalog summary.",
    });
  }
};

// =========================================================
// MANUFACTURERS
// =========================================================

const getManufacturers = async (req, res) => {
  try {
    const includeInactive =
      req.query.include_inactive === "true";

    const result = await pool.query(
      `
      SELECT
        manufacturer.*,
        COUNT(DISTINCT model.id)::INTEGER AS model_count,
        COUNT(DISTINCT variant.id)::INTEGER AS variant_count
      FROM bus_manufacturers manufacturer
      LEFT JOIN bus_models model
        ON model.manufacturer_id = manufacturer.id
      LEFT JOIN bus_body_variants variant
        ON variant.model_id = model.id
      WHERE ($1::BOOLEAN = TRUE OR manufacturer.is_active = TRUE)
      GROUP BY manufacturer.id
      ORDER BY
        manufacturer.sort_order,
        manufacturer.name
      `,
      [includeInactive]
    );

    return res.json({
      success: true,
      manufacturers: result.rows,
    });
  } catch (error) {
    console.error("Get manufacturers failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load manufacturers.",
    });
  }
};

const createManufacturer = async (req, res) => {
  try {
    const {
      name,
      country = null,
      description = null,
      logo_url = null,
      sort_order = 0,
    } = req.body;

    const code = normalizeCode(
      req.body.code || name
    );

    if (!String(name || "").trim() || !code) {
      return res.status(400).json({
        success: false,
        message: "Manufacturer name and code are required.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO bus_manufacturers (
        name,
        code,
        country,
        description,
        logo_url,
        is_active,
        sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        String(name).trim(),
        code,
        country || null,
        description || null,
        logo_url || null,
        parseBoolean(req.body.is_active, true),
        Number(sort_order) || 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Manufacturer created successfully.",
      manufacturer: result.rows[0],
    });
  } catch (error) {
    console.error("Create manufacturer failed:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Manufacturer name or code already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create manufacturer.",
    });
  }
};

const updateManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      country = null,
      description = null,
      logo_url = null,
      sort_order = 0,
    } = req.body;

    const code = normalizeCode(
      req.body.code || name
    );

    if (!String(name || "").trim() || !code) {
      return res.status(400).json({
        success: false,
        message: "Manufacturer name and code are required.",
      });
    }

    const result = await pool.query(
      `
      UPDATE bus_manufacturers
      SET
        name = $1,
        code = $2,
        country = $3,
        description = $4,
        logo_url = $5,
        is_active = $6,
        sort_order = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
      `,
      [
        String(name).trim(),
        code,
        country || null,
        description || null,
        logo_url || null,
        parseBoolean(req.body.is_active, true),
        Number(sort_order) || 0,
        id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Manufacturer not found.",
      });
    }

    return res.json({
      success: true,
      message: "Manufacturer updated successfully.",
      manufacturer: result.rows[0],
    });
  } catch (error) {
    console.error("Update manufacturer failed:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Manufacturer name or code already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update manufacturer.",
    });
  }
};

const deleteManufacturer = async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE bus_manufacturers
      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Manufacturer not found.",
      });
    }

    return res.json({
      success: true,
      message: "Manufacturer deactivated successfully.",
      manufacturer: result.rows[0],
    });
  } catch (error) {
    console.error("Deactivate manufacturer failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate manufacturer.",
    });
  }
};

// =========================================================
// MODELS
// =========================================================

const getModels = async (req, res) => {
  try {
    const manufacturerId =
      parseNullableInteger(req.query.manufacturer_id);

    if (Number.isNaN(manufacturerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid manufacturer ID.",
      });
    }

    const includeInactive =
      req.query.include_inactive === "true";

    const result = await pool.query(
      `
      SELECT
        model.*,
        manufacturer.name AS manufacturer_name,
        manufacturer.code AS manufacturer_code,
        COUNT(DISTINCT variant.id)::INTEGER AS variant_count
      FROM bus_models model
      JOIN bus_manufacturers manufacturer
        ON manufacturer.id = model.manufacturer_id
      LEFT JOIN bus_body_variants variant
        ON variant.model_id = model.id
      WHERE
        ($1::INTEGER IS NULL OR model.manufacturer_id = $1)
        AND ($2::BOOLEAN = TRUE OR model.is_active = TRUE)
      GROUP BY
        model.id,
        manufacturer.id
      ORDER BY
        manufacturer.sort_order,
        manufacturer.name,
        model.sort_order,
        model.name
      `,
      [manufacturerId, includeInactive]
    );

    return res.json({
      success: true,
      models: result.rows,
    });
  } catch (error) {
    console.error("Get models failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load bus models.",
    });
  }
};

const createModel = async (req, res) => {
  try {
    const manufacturerId =
      parseNullableInteger(req.body.manufacturer_id);

    const lengthMeters =
      parseNullableNumber(req.body.length_meters);

    if (
      !manufacturerId ||
      Number.isNaN(manufacturerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid manufacturer is required.",
      });
    }

    if (Number.isNaN(lengthMeters)) {
      return res.status(400).json({
        success: false,
        message: "Invalid model length.",
      });
    }

    const name = String(req.body.name || "").trim();
    const code = normalizeCode(req.body.code || name);

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Model name and code are required.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO bus_models (
        manufacturer_id,
        name,
        code,
        model_category,
        fuel_type,
        axle_type,
        length_meters,
        description,
        specifications,
        is_active,
        sort_order
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11
      )
      RETURNING *
      `,
      [
        manufacturerId,
        name,
        code,
        req.body.model_category || "COACH",
        req.body.fuel_type || null,
        req.body.axle_type || null,
        lengthMeters,
        req.body.description || null,
        safeJsonObject(req.body.specifications),
        parseBoolean(req.body.is_active, true),
        Number(req.body.sort_order) || 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Bus model created successfully.",
      model: result.rows[0],
    });
  } catch (error) {
    console.error("Create model failed:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Manufacturer does not exist.",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Model name or code already exists for this manufacturer.",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Model data violates a validation rule.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create bus model.",
    });
  }
};

const updateModel = async (req, res) => {
  try {
    const manufacturerId =
      parseNullableInteger(req.body.manufacturer_id);

    const lengthMeters =
      parseNullableNumber(req.body.length_meters);

    if (
      !manufacturerId ||
      Number.isNaN(manufacturerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid manufacturer is required.",
      });
    }

    if (Number.isNaN(lengthMeters)) {
      return res.status(400).json({
        success: false,
        message: "Invalid model length.",
      });
    }

    const name = String(req.body.name || "").trim();
    const code = normalizeCode(req.body.code || name);

    const result = await pool.query(
      `
      UPDATE bus_models
      SET
        manufacturer_id = $1,
        name = $2,
        code = $3,
        model_category = $4,
        fuel_type = $5,
        axle_type = $6,
        length_meters = $7,
        description = $8,
        specifications = $9,
        is_active = $10,
        sort_order = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
      `,
      [
        manufacturerId,
        name,
        code,
        req.body.model_category || "COACH",
        req.body.fuel_type || null,
        req.body.axle_type || null,
        lengthMeters,
        req.body.description || null,
        safeJsonObject(req.body.specifications),
        parseBoolean(req.body.is_active, true),
        Number(req.body.sort_order) || 0,
        req.params.id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Bus model not found.",
      });
    }

    return res.json({
      success: true,
      message: "Bus model updated successfully.",
      model: result.rows[0],
    });
  } catch (error) {
    console.error("Update model failed:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Model name or code already exists for this manufacturer.",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Model data violates a validation rule.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update bus model.",
    });
  }
};

const deleteModel = async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE bus_models
      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Bus model not found.",
      });
    }

    return res.json({
      success: true,
      message: "Bus model deactivated successfully.",
      model: result.rows[0],
    });
  } catch (error) {
    console.error("Deactivate model failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate bus model.",
    });
  }
};

// =========================================================
// BODY VARIANTS
// =========================================================

const getBodyVariants = async (req, res) => {
  try {
    const modelId =
      parseNullableInteger(req.query.model_id);

    const manufacturerId =
      parseNullableInteger(req.query.manufacturer_id);

    if (
      Number.isNaN(modelId) ||
      Number.isNaN(manufacturerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid catalog filter.",
      });
    }

    const includeInactive =
      req.query.include_inactive === "true";

    const result = await pool.query(
      `
      SELECT
        variant.*,
        model.name AS model_name,
        model.code AS model_code,
        manufacturer.id AS manufacturer_id,
        manufacturer.name AS manufacturer_name,
        manufacturer.code AS manufacturer_code
      FROM bus_body_variants variant
      JOIN bus_models model
        ON model.id = variant.model_id
      JOIN bus_manufacturers manufacturer
        ON manufacturer.id = model.manufacturer_id
      WHERE
        ($1::INTEGER IS NULL OR variant.model_id = $1)
        AND ($2::INTEGER IS NULL OR manufacturer.id = $2)
        AND ($3::BOOLEAN = TRUE OR variant.is_active = TRUE)
      ORDER BY
        manufacturer.sort_order,
        manufacturer.name,
        model.sort_order,
        model.name,
        variant.sort_order,
        variant.name
      `,
      [
        modelId,
        manufacturerId,
        includeInactive,
      ]
    );

    return res.json({
      success: true,
      body_variants: result.rows,
    });
  } catch (error) {
    console.error("Get body variants failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load body variants.",
    });
  }
};

const createBodyVariant = async (req, res) => {
  try {
    const modelId =
      parseNullableInteger(req.body.model_id);

    const defaultCapacity =
      parseNullableInteger(req.body.default_capacity);

    if (!modelId || Number.isNaN(modelId)) {
      return res.status(400).json({
        success: false,
        message: "Valid bus model is required.",
      });
    }

    if (Number.isNaN(defaultCapacity)) {
      return res.status(400).json({
        success: false,
        message: "Invalid default capacity.",
      });
    }

    const name = String(req.body.name || "").trim();
    const code = normalizeCode(req.body.code || name);

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Variant name and code are required.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO bus_body_variants (
        model_id,
        name,
        code,
        body_type,
        layout_mode,
        deck_type,
        is_ac,
        is_sleeper,
        default_capacity,
        default_preset,
        description,
        configuration,
        is_active,
        sort_order
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
      `,
      [
        modelId,
        name,
        code,
        req.body.body_type || "CUSTOM",
        req.body.layout_mode || "CUSTOM",
        req.body.deck_type || "CUSTOM",
        parseBoolean(req.body.is_ac, false),
        parseBoolean(req.body.is_sleeper, false),
        defaultCapacity,
        req.body.default_preset || null,
        req.body.description || null,
        safeJsonObject(req.body.configuration),
        parseBoolean(req.body.is_active, true),
        Number(req.body.sort_order) || 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Body variant created successfully.",
      body_variant: result.rows[0],
    });
  } catch (error) {
    console.error("Create body variant failed:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Bus model does not exist.",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Variant name or code already exists for this model.",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Variant data violates a validation rule.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create body variant.",
    });
  }
};

const updateBodyVariant = async (req, res) => {
  try {
    const modelId =
      parseNullableInteger(req.body.model_id);

    const defaultCapacity =
      parseNullableInteger(req.body.default_capacity);

    if (!modelId || Number.isNaN(modelId)) {
      return res.status(400).json({
        success: false,
        message: "Valid bus model is required.",
      });
    }

    const name = String(req.body.name || "").trim();
    const code = normalizeCode(req.body.code || name);

    const result = await pool.query(
      `
      UPDATE bus_body_variants
      SET
        model_id = $1,
        name = $2,
        code = $3,
        body_type = $4,
        layout_mode = $5,
        deck_type = $6,
        is_ac = $7,
        is_sleeper = $8,
        default_capacity = $9,
        default_preset = $10,
        description = $11,
        configuration = $12,
        is_active = $13,
        sort_order = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
      `,
      [
        modelId,
        name,
        code,
        req.body.body_type || "CUSTOM",
        req.body.layout_mode || "CUSTOM",
        req.body.deck_type || "CUSTOM",
        parseBoolean(req.body.is_ac, false),
        parseBoolean(req.body.is_sleeper, false),
        defaultCapacity,
        req.body.default_preset || null,
        req.body.description || null,
        safeJsonObject(req.body.configuration),
        parseBoolean(req.body.is_active, true),
        Number(req.body.sort_order) || 0,
        req.params.id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Body variant not found.",
      });
    }

    return res.json({
      success: true,
      message: "Body variant updated successfully.",
      body_variant: result.rows[0],
    });
  } catch (error) {
    console.error("Update body variant failed:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Variant name or code already exists for this model.",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Variant data violates a validation rule.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update body variant.",
    });
  }
};

const deleteBodyVariant = async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE bus_body_variants
      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Body variant not found.",
      });
    }

    return res.json({
      success: true,
      message: "Body variant deactivated successfully.",
      body_variant: result.rows[0],
    });
  } catch (error) {
    console.error("Deactivate body variant failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate body variant.",
    });
  }
};

// =========================================================
// LAYOUT TEMPLATES
// =========================================================

const getLayoutTemplates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        template.*,
        manufacturer.name AS manufacturer_name,
        model.name AS model_name,
        variant.name AS body_variant_name
      FROM seat_layout_templates template
      LEFT JOIN bus_manufacturers manufacturer
        ON manufacturer.id = template.manufacturer_id
      LEFT JOIN bus_models model
        ON model.id = template.model_id
      LEFT JOIN bus_body_variants variant
        ON variant.id = template.body_variant_id
      WHERE (
        $1::BOOLEAN = TRUE
        OR template.is_active = TRUE
      )
      ORDER BY
        template.is_system DESC,
        template.name
    `, [
      req.query.include_inactive === "true",
    ]);

    return res.json({
      success: true,
      templates: result.rows,
    });
  } catch (error) {
    console.error("Get layout templates failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load layout templates.",
    });
  }
};

module.exports = {
  getCatalogSummary,

  getManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,

  getModels,
  createModel,
  updateModel,
  deleteModel,

  getBodyVariants,
  createBodyVariant,
  updateBodyVariant,
  deleteBodyVariant,

  getLayoutTemplates,
};
