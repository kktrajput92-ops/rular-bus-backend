const pool = require("../config/db");

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;

  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeCode = (value) => {
  const normalized = normalizeText(value);

  if (!normalized) return null;

  return normalized
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const parsePositiveInteger = (value) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseSortOrder = (value) => {
  const parsed = Number(value ?? 0);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const parseBoolean = (value, fallback = true) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const getPublicLocationTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        type_code,
        type_name,
        COALESCE(
          NULLIF(TRIM(display_name), ''),
          type_name
        ) AS display_name,
        icon,
        description,
        sort_order
      FROM passenger_location_types
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, type_name ASC, id ASC
    `);

    return res.json({
      success: true,
      location_types: result.rows,
    });
  } catch (error) {
    console.error("Get public location types failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load location types.",
    });
  }
};

const getAllLocationTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM passenger_location_types
      ORDER BY sort_order ASC, type_name ASC, id ASC
    `);

    return res.json({
      success: true,
      location_types: result.rows,
    });
  } catch (error) {
    console.error("Get location types failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load location types.",
    });
  }
};

const createLocationType = async (req, res) => {
  try {
    const typeName = normalizeText(req.body.type_name);
    const typeCode =
      normalizeCode(req.body.type_code) ||
      normalizeCode(typeName);
    const displayName = normalizeText(req.body.display_name);
    const icon = normalizeText(req.body.icon);
    const description = normalizeText(req.body.description);
    const sortOrder = parseSortOrder(req.body.sort_order);

    if (!typeName) {
      return res.status(400).json({
        success: false,
        message: "Type name is required.",
      });
    }

    if (!typeCode) {
      return res.status(400).json({
        success: false,
        message: "A valid type code is required.",
      });
    }

    if (sortOrder === null) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be a non-negative integer.",
      });
    }

    const result = await pool.query(
      `INSERT INTO passenger_location_types
        (
          type_code,
          type_name,
          display_name,
          icon,
          description,
          sort_order,
          is_active
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        typeCode,
        typeName,
        displayName,
        icon,
        description,
        sortOrder,
        parseBoolean(req.body.is_active, true),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Location type created successfully.",
      location_type: result.rows[0],
    });
  } catch (error) {
    console.error("Create location type failed:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This location type already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create location type.",
    });
  }
};

const updateLocationType = async (req, res) => {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid location type ID.",
      });
    }

    const existingResult = await pool.query(
      `SELECT *
       FROM passenger_location_types
       WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Location type was not found.",
      });
    }

    const existing = existingResult.rows[0];

    const typeName =
      req.body.type_name !== undefined
        ? normalizeText(req.body.type_name)
        : existing.type_name;

    const typeCode =
      req.body.type_code !== undefined
        ? normalizeCode(req.body.type_code)
        : existing.type_code;

    const displayName =
      req.body.display_name !== undefined
        ? normalizeText(req.body.display_name)
        : existing.display_name;

    const icon =
      req.body.icon !== undefined
        ? normalizeText(req.body.icon)
        : existing.icon;

    const description =
      req.body.description !== undefined
        ? normalizeText(req.body.description)
        : existing.description;

    const sortOrder =
      req.body.sort_order !== undefined
        ? parseSortOrder(req.body.sort_order)
        : existing.sort_order;

    if (!typeName || !typeCode) {
      return res.status(400).json({
        success: false,
        message: "Type name and type code are required.",
      });
    }

    if (sortOrder === null) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be a non-negative integer.",
      });
    }

    const result = await pool.query(
      `UPDATE passenger_location_types
       SET
         type_code = $1,
         type_name = $2,
         display_name = $3,
         icon = $4,
         description = $5,
         sort_order = $6,
         is_active = $7,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        typeCode,
        typeName,
        displayName,
        icon,
        description,
        sortOrder,
        parseBoolean(
          req.body.is_active,
          existing.is_active
        ),
        id,
      ]
    );

    await pool.query(
      `UPDATE passenger_locations
       SET
         location_type = $1,
         updated_at = CURRENT_TIMESTAMP
       WHERE location_type_id = $2`,
      [typeCode, id]
    );

    return res.json({
      success: true,
      message: "Location type updated successfully.",
      location_type: result.rows[0],
    });
  } catch (error) {
    console.error("Update location type failed:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This location type already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update location type.",
    });
  }
};

const deleteLocationType = async (req, res) => {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid location type ID.",
      });
    }

    const usageResult = await pool.query(
      `SELECT COUNT(*)::INT AS usage_count
       FROM passenger_locations
       WHERE location_type_id = $1`,
      [id]
    );

    if (usageResult.rows[0].usage_count > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This type is used by existing locations. Deactivate it instead of deleting it.",
      });
    }

    const result = await pool.query(
      `DELETE FROM passenger_location_types
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Location type was not found.",
      });
    }

    return res.json({
      success: true,
      message: "Location type deleted successfully.",
    });
  } catch (error) {
    console.error("Delete location type failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete location type.",
    });
  }
};

module.exports = {
  getPublicLocationTypes,
  getAllLocationTypes,
  createLocationType,
  updateLocationType,
  deleteLocationType,
};
