const pool = require("../config/db");

const hasPermission = (permissionCode) => {
  return async (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {

      const result = await pool.query(
        `
        SELECT 1
        FROM role_permissions rp
        JOIN permissions p
          ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        AND p.permission_code = $2
        LIMIT 1
        `,
        [
          req.user.role_id,
          permissionCode
        ]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Permission Denied",
        });
      }

      next();

    } catch (err) {

      return res.status(500).json({
        success: false,
        message: err.message,
      });

    }

  };
};

module.exports = hasPermission;
