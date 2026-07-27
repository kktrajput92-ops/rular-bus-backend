const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const {
  createCustomerAccessToken,
} = require("../utils/customerToken");

const normalizePhone = (value) => {
  return String(value || "")
    .replace(/\D/g, "")
    .trim();
};

const normalizeEmail = (value) => {
  const email = String(value || "")
    .trim()
    .toLowerCase();

  return email || null;
};

const normalizeName = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};

const isValidPhone = (phone) => {
  return /^[0-9]{10,15}$/.test(phone);
};

const isValidEmail = (email) => {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

const isValidPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

const publicCustomer = (customer) => ({
  id: customer.id,
  full_name: customer.full_name,
  phone: customer.phone,
  email: customer.email,
  is_active: customer.is_active,
  account_status:
    customer.account_status,
  preferred_language:
    customer.preferred_language,
  phone_verified_at:
    customer.phone_verified_at,
  email_verified_at:
    customer.email_verified_at,
  last_login_at:
    customer.last_login_at,
  profile_completed:
    customer.profile_completed,
  created_at: customer.created_at,
  updated_at: customer.updated_at,
});

const writeLoginLog = async ({
  customerProfileId = null,
  identifier = null,
  success,
  failureReason = null,
  requestIp = null,
  userAgent = null,
}) => {
  try {
    await pool.query(
      `
        INSERT INTO customer_login_logs (
          customer_profile_id,
          login_identifier,
          login_method,
          success,
          failure_reason,
          request_ip,
          user_agent
        )
        VALUES (
          $1,
          $2,
          'PASSWORD',
          $3,
          $4,
          $5,
          $6
        )
      `,
      [
        customerProfileId,
        identifier,
        success,
        failureReason,
        requestIp,
        userAgent,
      ]
    );
  } catch (error) {
    console.error(
      "Customer login log failed:",
      error
    );
  }
};

const registerCustomer = async (
  req,
  res
) => {
  const client =
    await pool.connect();

  try {
    const fullName = normalizeName(
      req.body.full_name
    );

    const phone = normalizePhone(
      req.body.phone
    );

    const email = normalizeEmail(
      req.body.email
    );

    const password =
      req.body.password;

    const confirmPassword =
      req.body.confirm_password;

    if (fullName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Customer full name is required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid mobile number is required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message:
          "Customer email format is invalid",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one letter and one number",
      });
    }

    if (
      confirmPassword !== undefined &&
      password !== confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password and confirm password do not match",
      });
    }

    await client.query("BEGIN");

    const duplicateResult =
      await client.query(
        `
          SELECT
            id,
            phone,
            email,
            deleted_at
          FROM customer_profiles
          WHERE phone = $1
             OR (
               $2::VARCHAR IS NOT NULL
               AND LOWER(email) = LOWER($2)
             )
          LIMIT 1
        `,
        [phone, email]
      );

    if (duplicateResult.rows.length) {
  const existing =
    duplicateResult.rows[0];

  const existingDetails =
    await client.query(
      `
        SELECT
          id,
          phone,
          email,
          password_hash,
          deleted_at
        FROM customer_profiles
        WHERE id = $1
        FOR UPDATE
      `,
      [existing.id]
    );

  const existingCustomer =
    existingDetails.rows[0];

  if (
    existingCustomer.password_hash ||
    existingCustomer.deleted_at
  ) {
    await client.query("ROLLBACK");

    if (
      existingCustomer.phone === phone
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This mobile number is already registered",
      });
    }

    return res.status(409).json({
      success: false,
      message:
        "This email address is already registered",
    });
  }

  const passwordHash =
    await bcrypt.hash(password, 12);

  const claimedResult =
    await client.query(
      `
        UPDATE customer_profiles
        SET
          full_name = $1,
          email = COALESCE($2, email),
          password_hash = $3,
          is_active = TRUE,
          account_status = 'ACTIVE',
          registration_source = $4,
          preferred_language = $5,
          failed_login_attempts = 0,
          locked_until = NULL,
          password_changed_at =
            CURRENT_TIMESTAMP,
          deleted_at = NULL,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING
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
      `,
      [
        fullName,
        email,
        passwordHash,
        String(
          req.body.registration_source ||
            "WEB"
        )
          .trim()
          .toUpperCase(),
        String(
          req.body.preferred_language ||
            "hi"
        )
          .trim()
          .toLowerCase(),
        existingCustomer.id,
      ]
    );

  const claimedCustomer =
    claimedResult.rows[0];

  const token =
    createCustomerAccessToken(
      claimedCustomer
    );

  await client.query("COMMIT");

  return res.status(200).json({
    success: true,
    message:
      "Existing customer profile registration completed",
    token,
    customer:
      publicCustomer(
        claimedCustomer
      ),
  });
}


    const passwordHash =
      await bcrypt.hash(password, 12);

    const result =
      await client.query(
        `
          INSERT INTO customer_profiles (
            full_name,
            phone,
            email,
            password_hash,
            is_active,
            account_status,
            registration_source,
            preferred_language,
            profile_completed,
            failed_login_attempts,
            password_changed_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            TRUE,
            'ACTIVE',
            $5,
            $6,
            FALSE,
            0,
            CURRENT_TIMESTAMP
          )
          RETURNING
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
        `,
        [
          fullName,
          phone,
          email,
          passwordHash,
          String(
            req.body.registration_source ||
              "WEB"
          )
            .trim()
            .toUpperCase(),
          String(
            req.body.preferred_language ||
              "hi"
          )
            .trim()
            .toLowerCase(),
        ]
      );

    const customer =
      result.rows[0];

    const token =
      createCustomerAccessToken(
        customer
      );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        "Customer registration successful",
      token,
      customer:
        publicCustomer(customer),
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Customer registration error:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "Mobile number or email is already registered",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message:
          "Customer information is invalid",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Customer registration failed",
    });
  } finally {
    client.release();
  }
};

const loginCustomer = async (
  req,
  res
) => {
  try {
    const identifier = String(
      req.body.identifier ||
        req.body.phone ||
        req.body.email ||
        ""
    ).trim();

    const password =
      req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number or email and password are required",
      });
    }

    const normalizedPhone =
      normalizePhone(identifier);

    const normalizedEmail =
      normalizeEmail(identifier);

    const result = await pool.query(
      `
        SELECT *
        FROM customer_profiles
        WHERE deleted_at IS NULL
          AND (
            phone = $1
            OR LOWER(email) = LOWER($2)
          )
        LIMIT 1
      `,
      [
        normalizedPhone,
        normalizedEmail,
      ]
    );

    if (!result.rows.length) {
      await writeLoginLog({
        identifier,
        success: false,
        failureReason:
          "ACCOUNT_NOT_FOUND",
        requestIp: req.ip,
        userAgent:
          req.headers["user-agent"] ||
          null,
      });

      return res.status(401).json({
        success: false,
        message:
          "Invalid mobile number, email or password",
      });
    }

    const customer =
      result.rows[0];

    if (!customer.is_active) {
      await writeLoginLog({
        customerProfileId:
          customer.id,
        identifier,
        success: false,
        failureReason:
          "ACCOUNT_INACTIVE",
        requestIp: req.ip,
        userAgent:
          req.headers["user-agent"] ||
          null,
      });

      return res.status(403).json({
        success: false,
        message:
          "Customer account is inactive",
      });
    }

    if (
      customer.account_status ===
      "SUSPENDED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Customer account is suspended",
      });
    }

    if (
      customer.locked_until &&
      new Date(
        customer.locked_until
      ).getTime() > Date.now()
    ) {
      return res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked. Please try again later",
        locked_until:
          customer.locked_until,
      });
    }

    if (!customer.password_hash) {
      return res.status(400).json({
        success: false,
        message:
          "Password login is not configured for this customer account",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        customer.password_hash
      );

    if (!passwordMatches) {
      const nextAttempts =
        Number(
          customer.failed_login_attempts ||
            0
        ) + 1;

      const shouldLock =
        nextAttempts >= 5;

      await pool.query(
        `
          UPDATE customer_profiles
          SET
            failed_login_attempts =
              CASE
                WHEN $1 = TRUE
                  THEN 0
                ELSE $2
              END,
            locked_until =
              CASE
                WHEN $1 = TRUE
                  THEN CURRENT_TIMESTAMP
                    + INTERVAL '15 minutes'
                ELSE locked_until
              END,
            account_status =
              CASE
                WHEN $1 = TRUE
                  THEN 'LOCKED'
                ELSE account_status
              END,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $3
        `,
        [
          shouldLock,
          nextAttempts,
          customer.id,
        ]
      );

      await writeLoginLog({
        customerProfileId:
          customer.id,
        identifier,
        success: false,
        failureReason:
          shouldLock
            ? "ACCOUNT_LOCKED"
            : "INVALID_PASSWORD",
        requestIp: req.ip,
        userAgent:
          req.headers["user-agent"] ||
          null,
      });

      return res.status(401).json({
        success: false,
        message: shouldLock
          ? "Too many failed attempts. Account locked for 15 minutes"
          : "Invalid mobile number, email or password",
        remaining_attempts:
          shouldLock
            ? 0
            : 5 - nextAttempts,
      });
    }

    const updatedResult =
      await pool.query(
        `
          UPDATE customer_profiles
          SET
            failed_login_attempts = 0,
            locked_until = NULL,
            account_status =
              CASE
                WHEN account_status =
                  'LOCKED'
                  THEN 'ACTIVE'
                ELSE account_status
              END,
            last_login_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING
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
        `,
        [customer.id]
      );

    const updatedCustomer =
      updatedResult.rows[0];

    const token =
      createCustomerAccessToken(
        updatedCustomer
      );

    await writeLoginLog({
      customerProfileId:
        customer.id,
      identifier,
      success: true,
      requestIp: req.ip,
      userAgent:
        req.headers["user-agent"] ||
        null,
    });

    return res.json({
      success: true,
      message:
        "Customer login successful",
      token,
      customer:
        publicCustomer(
          updatedCustomer
        ),
    });
  } catch (error) {
    console.error(
      "Customer login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Customer login failed",
    });
  }
};

const getCurrentCustomer = async (
  req,
  res
) => {
  return res.json({
    success: true,
    customer:
      publicCustomer(req.customer),
  });
};

const updateCustomerProfile = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const customerProfileId = Number(
      req.customer?.id
    );

    const fullName = normalizeName(
      req.body.full_name
    );

    const email = normalizeEmail(
      req.body.email
    );

    const preferredLanguage = String(
      req.body.preferred_language || "hi"
    )
      .trim()
      .toLowerCase();

    if (
      !Number.isInteger(customerProfileId) ||
      customerProfileId <= 0
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Valid customer account is required",
      });
    }

    if (fullName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Customer full name is required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message:
          "Customer email format is invalid",
      });
    }

    if (
      !["hi", "en"].includes(
        preferredLanguage
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Preferred language must be hi or en",
      });
    }

    await client.query("BEGIN");

    if (email) {
      const duplicateEmail =
        await client.query(
          `
            SELECT id
            FROM customer_profiles
            WHERE LOWER(email) = LOWER($1)
              AND id <> $2
              AND deleted_at IS NULL
            LIMIT 1
          `,
          [
            email,
            customerProfileId,
          ]
        );

      if (duplicateEmail.rows.length) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message:
            "This email address is already registered",
        });
      }
    }

    const result = await client.query(
      `
        UPDATE customer_profiles
        SET
          full_name = $1,
          email = $2,
          preferred_language = $3,
          profile_completed = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
          AND is_active = TRUE
          AND deleted_at IS NULL
        RETURNING
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
      `,
      [
        fullName,
        email,
        preferredLanguage,
        customerProfileId,
      ]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Customer profile not found",
      });
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message:
        "Customer profile updated successfully",
      customer:
        publicCustomer(result.rows[0]),
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    console.error(
      "Update customer profile error:",
      error
    );

    if (
      error.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This email address is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Customer profile update failed",
    });
  } finally {
    client.release();
  }
};

const logoutCustomer = async (
  req,
  res
) => {
  return res.json({
    success: true,
    message:
      "Customer logout successful",
  });
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  updateCustomerProfile,
  logoutCustomer,
};
