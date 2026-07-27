const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const customerAuthMiddleware = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization || "";

    if (
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Customer access token required",
      });
    }

    const token = authHeader
      .slice(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Customer access token required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      decoded.token_type !==
        "CUSTOMER_ACCESS" ||
      !decoded.customer_profile_id
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid customer access token",
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          full_name,
          phone,
          email,
          is_active,
          account_status,
          preferred_language,
          phone_verified_at,
          email_verified_at,
          last_login_at,
          profile_completed,
          created_at,
          updated_at
        FROM customer_profiles
        WHERE id = $1
          AND is_active = TRUE
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [decoded.customer_profile_id]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        success: false,
        message:
          "Customer account not found",
      });
    }

    const customer = result.rows[0];

    if (
      customer.account_status ===
        "SUSPENDED" ||
      customer.account_status ===
        "DELETED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Customer account is not available",
      });
    }

    req.customer = customer;
    req.customerToken = decoded;

    next();
  } catch (error) {
    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Customer session expired",
      });
    }

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid customer access token",
      });
    }

    console.error(
      "Customer auth middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Customer authentication failed",
    });
  }
};

module.exports =
  customerAuthMiddleware;
