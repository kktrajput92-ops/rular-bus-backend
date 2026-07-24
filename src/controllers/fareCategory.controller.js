const pool = require("../config/db");

// Create Fare Category
const createFareCategory = async (req, res) => {
  try {
    const {
      name,
      code,
      description = null,
      seat_type = null,
      service_type = null,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Name and code are required",
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    const result = await pool.query(
      `INSERT INTO fare_categories
       (name, code, description, seat_type, service_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        String(name).trim(),
        normalizedCode,
        description,
        seat_type,
        service_type,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Fare category created successfully",
      category: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Fare category name or code already exists",
      });
    }

    if (err.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid category data",
        error: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Fare Categories
const getAllFareCategories = async (req, res) => {
  try {
    const { active } = req.query;

    const values = [];
    let query = `
      SELECT *
      FROM fare_categories
    `;

    if (active === "true" || active === "false") {
      values.push(active === "true");
      query += ` WHERE is_active = $1`;
    }

    query += ` ORDER BY id DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      count: result.rows.length,
      categories: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Fare Category By ID
const getFareCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM fare_categories WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Fare category not found",
      });
    }

    res.json({
      success: true,
      category: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Fare Category
const updateFareCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      description,
      seat_type,
      service_type,
      is_active,
    } = req.body;

    const result = await pool.query(
      `UPDATE fare_categories
       SET
         name = COALESCE($1, name),
         code = COALESCE($2, code),
         description = COALESCE($3, description),
         seat_type = COALESCE($4, seat_type),
         service_type = COALESCE($5, service_type),
         is_active = COALESCE($6, is_active),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        name ? String(name).trim() : null,
        code ? String(code).trim().toUpperCase() : null,
        description ?? null,
        seat_type ?? null,
        service_type ?? null,
        typeof is_active === "boolean" ? is_active : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Fare category not found",
      });
    }

    res.json({
      success: true,
      message: "Fare category updated successfully",
      category: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Fare category name or code already exists",
      });
    }

    if (err.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid category data",
        error: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Soft Delete Fare Category
const deleteFareCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE fare_categories
       SET is_active = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Fare category not found",
      });
    }

    res.json({
      success: true,
      message: "Fare category deactivated successfully",
      category: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createFareCategory,
  getAllFareCategories,
  getFareCategoryById,
  updateFareCategory,
  deleteFareCategory,
};
