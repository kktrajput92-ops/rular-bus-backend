const pool = require("../config/db");

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;

  const normalized = String(value).trim();
  return normalized || null;
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
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  return fallback;
};

const selectColumns = `
  SELECT
    hrs.id,
    hrs.route_id,
    r.source,
    r.destination,
    COALESCE(
      NULLIF(TRIM(hrs.display_label), ''),
      CONCAT(r.source, ' → ', r.destination)
    ) AS display_label,
    hrs.note,
    hrs.sort_order,
    hrs.is_active,
    hrs.created_at,
    hrs.updated_at
  FROM homepage_route_shortcuts hrs
  INNER JOIN routes r
    ON r.id = hrs.route_id
`;

const getPublicHomepageRoutes = async (req, res) => {
  try {
    const result = await pool.query(`
      ${selectColumns}
      WHERE hrs.is_active = TRUE
      ORDER BY hrs.sort_order ASC, hrs.id ASC
    `);

    res.json({
      success: true,
      routes: result.rows,
    });
  } catch (error) {
    console.error("Get public homepage routes failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load homepage routes.",
    });
  }
};

const getAllHomepageRoutes = async (req, res) => {
  try {
    const result = await pool.query(`
      ${selectColumns}
      ORDER BY hrs.sort_order ASC, hrs.id ASC
    `);

    res.json({
      success: true,
      routes: result.rows,
    });
  } catch (error) {
    console.error("Get homepage routes failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load homepage routes.",
    });
  }
};

const createHomepageRoute = async (req, res) => {
  try {
    const routeId = parsePositiveInteger(req.body.route_id);
    const sortOrder = parseSortOrder(req.body.sort_order);

    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: "A valid route is required.",
      });
    }

    if (sortOrder === null) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be a non-negative integer.",
      });
    }

    const routeResult = await pool.query(
      "SELECT id FROM routes WHERE id = $1",
      [routeId]
    );

    if (routeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Selected route was not found.",
      });
    }

    const result = await pool.query(
      `INSERT INTO homepage_route_shortcuts
        (
          route_id,
          display_label,
          note,
          sort_order,
          is_active
        )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        routeId,
        normalizeText(req.body.display_label),
        normalizeText(req.body.note),
        sortOrder,
        parseBoolean(req.body.is_active, true),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Homepage route created successfully.",
      route: result.rows[0],
    });
  } catch (error) {
    console.error("Create homepage route failed:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This route is already displayed on the homepage.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create homepage route.",
    });
  }
};

const updateHomepageRoute = async (req, res) => {
  try {
    const shortcutId = parsePositiveInteger(req.params.id);
    const routeId = parsePositiveInteger(req.body.route_id);
    const sortOrder = parseSortOrder(req.body.sort_order);

    if (!shortcutId) {
      return res.status(400).json({
        success: false,
        message: "Invalid homepage route ID.",
      });
    }

    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: "A valid route is required.",
      });
    }

    if (sortOrder === null) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be a non-negative integer.",
      });
    }

    const routeResult = await pool.query(
      "SELECT id FROM routes WHERE id = $1",
      [routeId]
    );

    if (routeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Selected route was not found.",
      });
    }

    const result = await pool.query(
      `UPDATE homepage_route_shortcuts
       SET
         route_id = $1,
         display_label = $2,
         note = $3,
         sort_order = $4,
         is_active = $5,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        routeId,
        normalizeText(req.body.display_label),
        normalizeText(req.body.note),
        sortOrder,
        parseBoolean(req.body.is_active, true),
        shortcutId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Homepage route was not found.",
      });
    }

    res.json({
      success: true,
      message: "Homepage route updated successfully.",
      route: result.rows[0],
    });
  } catch (error) {
    console.error("Update homepage route failed:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This route is already displayed on the homepage.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update homepage route.",
    });
  }
};

const deleteHomepageRoute = async (req, res) => {
  try {
    const shortcutId = parsePositiveInteger(req.params.id);

    if (!shortcutId) {
      return res.status(400).json({
        success: false,
        message: "Invalid homepage route ID.",
      });
    }

    const result = await pool.query(
      `DELETE FROM homepage_route_shortcuts
       WHERE id = $1
       RETURNING id`,
      [shortcutId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Homepage route was not found.",
      });
    }

    res.json({
      success: true,
      message: "Homepage route deleted successfully.",
    });
  } catch (error) {
    console.error("Delete homepage route failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete homepage route.",
    });
  }
};

module.exports = {
  getPublicHomepageRoutes,
  getAllHomepageRoutes,
  createHomepageRoute,
  updateHomepageRoute,
  deleteHomepageRoute,
};
