const pool = require("../config/db");

const normalizeCouponCode = (code) =>
  typeof code === "string" ? code.trim().toUpperCase() : "";

const isValidPositiveNumber = (value) =>
  value !== null &&
  value !== "" &&
  !Number.isNaN(Number(value)) &&
  Number(value) > 0;

const isValidNonNegativeNumber = (value) =>
  value !== null &&
  value !== "" &&
  !Number.isNaN(Number(value)) &&
  Number(value) >= 0;

// Create Coupon
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description = null,
      discount_type,
      discount_value,
      minimum_fare = 0,
      maximum_discount = null,
      valid_from,
      valid_to,
      usage_limit = null,
      per_user_limit = 1,
      is_active = true,
    } = req.body;

    const normalizedCode = normalizeCouponCode(code);
    const normalizedName =
      typeof name === "string" ? name.trim() : "";

    if (
      !normalizedCode ||
      !normalizedName ||
      !discount_type ||
      discount_value === undefined ||
      discount_value === null ||
      !valid_from ||
      !valid_to
    ) {
      return res.status(400).json({
        success: false,
        message: "Required coupon fields are missing.",
      });
    }

    const validDiscountTypes = ["PERCENTAGE", "FIXED"];

    if (!validDiscountTypes.includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: "discount_type must be PERCENTAGE or FIXED.",
      });
    }

    if (!isValidPositiveNumber(discount_value)) {
      return res.status(400).json({
        success: false,
        message: "discount_value must be greater than zero.",
      });
    }

    if (
      discount_type === "PERCENTAGE" &&
      Number(discount_value) > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100.",
      });
    }

    if (!isValidNonNegativeNumber(minimum_fare)) {
      return res.status(400).json({
        success: false,
        message: "minimum_fare cannot be negative.",
      });
    }

    if (
      maximum_discount !== null &&
      maximum_discount !== "" &&
      !isValidNonNegativeNumber(maximum_discount)
    ) {
      return res.status(400).json({
        success: false,
        message: "maximum_discount cannot be negative.",
      });
    }

    if (
      usage_limit !== null &&
      usage_limit !== "" &&
      (!Number.isInteger(Number(usage_limit)) ||
        Number(usage_limit) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "usage_limit must be a positive integer.",
      });
    }

    if (
      !Number.isInteger(Number(per_user_limit)) ||
      Number(per_user_limit) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "per_user_limit must be a positive integer.",
      });
    }

    if (new Date(valid_from) > new Date(valid_to)) {
      return res.status(400).json({
        success: false,
        message: "valid_from cannot be later than valid_to.",
      });
    }

    const duplicateCoupon = await pool.query(
      `SELECT id
       FROM coupon_codes
       WHERE UPPER(code) = UPPER($1)
       LIMIT 1`,
      [normalizedCode]
    );

    if (duplicateCoupon.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists.",
      });
    }

    const result = await pool.query(
      `INSERT INTO coupon_codes
       (
         code,
         name,
         description,
         discount_type,
         discount_value,
         minimum_fare,
         maximum_discount,
         valid_from,
         valid_to,
         usage_limit,
         per_user_limit,
         is_active
       )
       VALUES
       (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12
       )
       RETURNING *`,
      [
        normalizedCode,
        normalizedName,
        description,
        discount_type,
        discount_value,
        minimum_fare,
        maximum_discount === "" ? null : maximum_discount,
        valid_from,
        valid_to,
        usage_limit === "" ? null : usage_limit,
        per_user_limit,
        is_active,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error("Create coupon error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists.",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Coupon data violates a validation rule.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon.",
      error: error.message,
    });
  }
};

// Get All Coupons
const getAllCoupons = async (req, res) => {
  try {
    const includeInactive =
      String(req.query.includeInactive).toLowerCase() === "true";

    const result = await pool.query(
      `SELECT *
       FROM coupon_codes
       WHERE ($1::boolean = TRUE OR is_active = TRUE)
       ORDER BY created_at DESC`,
      [includeInactive]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      coupons: result.rows,
    });
  } catch (error) {
    console.error("Get all coupons error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons.",
      error: error.message,
    });
  }
};

// Get Coupon By ID
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid coupon ID is required.",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM coupon_codes
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    return res.status(200).json({
      success: true,
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error("Get coupon by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon.",
      error: error.message,
    });
  }
};

// Update Coupon
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid coupon ID is required.",
      });
    }

    const existingResult = await pool.query(
      `SELECT *
       FROM coupon_codes
       WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    const existingCoupon = existingResult.rows[0];

    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      minimum_fare,
      maximum_discount,
      valid_from,
      valid_to,
      usage_limit,
      per_user_limit,
      is_active,
    } = req.body;

    const updatedCode =
      code !== undefined
        ? normalizeCouponCode(code)
        : existingCoupon.code;

    const updatedName =
      name !== undefined
        ? String(name).trim()
        : existingCoupon.name;

    const updatedDescription =
      description !== undefined
        ? description
        : existingCoupon.description;

    const updatedDiscountType =
      discount_type !== undefined
        ? discount_type
        : existingCoupon.discount_type;

    const updatedDiscountValue =
      discount_value !== undefined
        ? discount_value
        : existingCoupon.discount_value;

    const updatedMinimumFare =
      minimum_fare !== undefined
        ? minimum_fare
        : existingCoupon.minimum_fare;

    const updatedMaximumDiscount =
      maximum_discount !== undefined
        ? maximum_discount === ""
          ? null
          : maximum_discount
        : existingCoupon.maximum_discount;

    const updatedValidFrom =
      valid_from !== undefined
        ? valid_from
        : existingCoupon.valid_from;

    const updatedValidTo =
      valid_to !== undefined
        ? valid_to
        : existingCoupon.valid_to;

    const updatedUsageLimit =
      usage_limit !== undefined
        ? usage_limit === ""
          ? null
          : usage_limit
        : existingCoupon.usage_limit;

    const updatedPerUserLimit =
      per_user_limit !== undefined
        ? per_user_limit
        : existingCoupon.per_user_limit;

    const updatedIsActive =
      is_active !== undefined
        ? is_active
        : existingCoupon.is_active;

    if (!updatedCode || !updatedName) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and name are required.",
      });
    }

    if (
      !["PERCENTAGE", "FIXED"].includes(
        updatedDiscountType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "discount_type must be PERCENTAGE or FIXED.",
      });
    }

    if (!isValidPositiveNumber(updatedDiscountValue)) {
      return res.status(400).json({
        success: false,
        message: "discount_value must be greater than zero.",
      });
    }

    if (
      updatedDiscountType === "PERCENTAGE" &&
      Number(updatedDiscountValue) > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100.",
      });
    }

    if (!isValidNonNegativeNumber(updatedMinimumFare)) {
      return res.status(400).json({
        success: false,
        message: "minimum_fare cannot be negative.",
      });
    }

    if (
      updatedMaximumDiscount !== null &&
      !isValidNonNegativeNumber(updatedMaximumDiscount)
    ) {
      return res.status(400).json({
        success: false,
        message: "maximum_discount cannot be negative.",
      });
    }

    if (
      updatedUsageLimit !== null &&
      (!Number.isInteger(Number(updatedUsageLimit)) ||
        Number(updatedUsageLimit) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "usage_limit must be a positive integer.",
      });
    }

    if (
      updatedUsageLimit !== null &&
      Number(existingCoupon.used_count) >
        Number(updatedUsageLimit)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "usage_limit cannot be lower than the current used_count.",
      });
    }

    if (
      !Number.isInteger(Number(updatedPerUserLimit)) ||
      Number(updatedPerUserLimit) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "per_user_limit must be a positive integer.",
      });
    }

    if (
      new Date(updatedValidFrom) >
      new Date(updatedValidTo)
    ) {
      return res.status(400).json({
        success: false,
        message: "valid_from cannot be later than valid_to.",
      });
    }

    const duplicateCoupon = await pool.query(
      `SELECT id
       FROM coupon_codes
       WHERE UPPER(code) = UPPER($1)
         AND id <> $2
       LIMIT 1`,
      [updatedCode, id]
    );

    if (duplicateCoupon.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists.",
      });
    }

    const result = await pool.query(
      `UPDATE coupon_codes
       SET
         code = $1,
         name = $2,
         description = $3,
         discount_type = $4,
         discount_value = $5,
         minimum_fare = $6,
         maximum_discount = $7,
         valid_from = $8,
         valid_to = $9,
         usage_limit = $10,
         per_user_limit = $11,
         is_active = $12,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        updatedCode,
        updatedName,
        updatedDescription,
        updatedDiscountType,
        updatedDiscountValue,
        updatedMinimumFare,
        updatedMaximumDiscount,
        updatedValidFrom,
        updatedValidTo,
        updatedUsageLimit,
        updatedPerUserLimit,
        updatedIsActive,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully.",
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error("Update coupon error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists.",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Coupon data violates a validation rule.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon.",
      error: error.message,
    });
  }
};

// Soft Delete Coupon
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid coupon ID is required.",
      });
    }

    const result = await pool.query(
      `UPDATE coupon_codes
       SET
         is_active = FALSE,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND is_active = TRUE
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      const existingResult = await pool.query(
        `SELECT id, is_active
         FROM coupon_codes
         WHERE id = $1`,
        [id]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Coupon not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Coupon is already inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deactivated successfully.",
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error("Delete coupon error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate coupon.",
      error: error.message,
    });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};
