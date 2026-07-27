const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const {
  createCustomerAccessToken,
} = require("../utils/customerToken");

const normalizePhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .trim();

const normalizeEmail = (value) => {
  const email = String(value || "")
    .trim()
    .toLowerCase();

  return email || null;
};

const normalizeIdentifier = (value) =>
  String(value || "").trim();

const isValidPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /[0-9]/.test(password);

const getPositiveInteger = (
  value,
  fallback
) => {
  const number = Number(value);

  return Number.isInteger(number) &&
    number > 0
    ? number
    : fallback;
};

const OTP_EXPIRY_MINUTES =
  getPositiveInteger(
    process.env
      .CUSTOMER_OTP_EXPIRY_MINUTES,
    5
  );

const OTP_MAX_ATTEMPTS =
  getPositiveInteger(
    process.env
      .CUSTOMER_OTP_MAX_ATTEMPTS,
    5
  );

const RESET_EXPIRY_MINUTES =
  getPositiveInteger(
    process.env
      .CUSTOMER_RESET_TOKEN_EXPIRY_MINUTES,
    15
  );

const getOtpMode = () =>
  String(
    process.env.CUSTOMER_OTP_MODE ||
      "TEST"
  )
    .trim()
    .toUpperCase();

const assertSafeOtpMode = () => {
  if (
    String(process.env.NODE_ENV)
      .trim()
      .toLowerCase() ===
      "production" &&
    getOtpMode() === "TEST"
  ) {
    throw new Error(
      "CUSTOMER_OTP_MODE=TEST cannot run in production"
    );
  }
};

const getOtpCode = () => {
  assertSafeOtpMode();

  if (getOtpMode() === "TEST") {
    const testOtp = String(
      process.env.CUSTOMER_TEST_OTP ||
        "123456"
    ).trim();

    if (!/^[0-9]{6}$/.test(testOtp)) {
      throw new Error(
        "CUSTOMER_TEST_OTP must contain exactly 6 digits"
      );
    }

    return testOtp;
  }

  return crypto
    .randomInt(0, 1000000)
    .toString()
    .padStart(6, "0");
};

const hashResetToken = (token) =>
  crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");

const findCustomerByIdentifier =
  async (client, identifier) => {
    const phone =
      normalizePhone(identifier);

    const email =
      normalizeEmail(identifier);

    const result = await client.query(
      `
        SELECT *
        FROM customer_profiles
        WHERE deleted_at IS NULL
          AND is_active = TRUE
          AND (
            phone = $1
            OR LOWER(email) =
               LOWER($2)
          )
        LIMIT 1
      `,
      [phone, email]
    );

    return result.rows[0] || null;
  };

const genericForgotResponse = (
  res
) =>
  res.json({
    success: true,
    message:
      "If the account exists, a password reset OTP has been generated.",
  });

const requestPasswordResetOtp =
  async (req, res) => {
    const client =
      await pool.connect();

    let transactionStarted = false;

    try {
      assertSafeOtpMode();

      const identifier =
        normalizeIdentifier(
          req.body.identifier ||
            req.body.phone ||
            req.body.email
        );

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message:
            "Mobile number or email is required",
        });
      }

      await client.query("BEGIN");
      transactionStarted = true;

      const customer =
        await findCustomerByIdentifier(
          client,
          identifier
        );

      if (!customer) {
        await client.query("COMMIT");
        transactionStarted = false;

        return genericForgotResponse(
          res
        );
      }

      const destination =
        customer.phone;

      await client.query(
        `
          UPDATE customer_otps
          SET expires_at =
            CURRENT_TIMESTAMP
          WHERE destination = $1
            AND purpose =
              'FORGOT_PASSWORD'
            AND verified_at IS NULL
            AND expires_at >
              CURRENT_TIMESTAMP
        `,
        [destination]
      );

      const otpCode = getOtpCode();

      const otpHash =
        await bcrypt.hash(
          otpCode,
          12
        );

      const result =
        await client.query(
          `
            INSERT INTO customer_otps (
              customer_profile_id,
              destination,
              channel,
              purpose,
              otp_hash,
              expires_at,
              attempts,
              max_attempts,
              resend_count,
              request_ip,
              user_agent
            )
            VALUES (
              $1,
              $2,
              'SMS',
              'FORGOT_PASSWORD',
              $3,
              CURRENT_TIMESTAMP
                + ($4 * INTERVAL '1 minute'),
              0,
              $5,
              0,
              $6,
              $7
            )
            RETURNING
              id,
              expires_at
          `,
          [
            customer.id,
            destination,
            otpHash,
            OTP_EXPIRY_MINUTES,
            OTP_MAX_ATTEMPTS,
            req.ip || null,
            req.headers[
              "user-agent"
            ] || null,
          ]
        );

      await client.query("COMMIT");
      transactionStarted = false;

      if (getOtpMode() === "TEST") {
        console.log(
          "\n=================================="
        );
        console.log(
          "CUSTOMER PASSWORD RESET TEST OTP"
        );
        console.log(
          `Customer: ${customer.id}`
        );
        console.log(
          `Destination: ${destination}`
        );
        console.log(
          `OTP: ${otpCode}`
        );
        console.log(
          `Expires: ${result.rows[0].expires_at}`
        );
        console.log(
          "==================================\n"
        );
      } else {
        /*
         * बाद में SMS provider integration
         * यहीं से otpCode deliver करेगी।
         */
        console.log(
          "SMS delivery provider is not configured"
        );
      }

      return genericForgotResponse(
        res
      );
    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query(
            "ROLLBACK"
          );
        } catch {}
      }

      console.error(
        "Password reset OTP request failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Password reset OTP could not be generated",
      });
    } finally {
      client.release();
    }
  };

const verifyPasswordResetOtp =
  async (req, res) => {
    const client =
      await pool.connect();

    let transactionStarted = false;

    try {
      const identifier =
        normalizeIdentifier(
          req.body.identifier
        );

      const otp = String(
        req.body.otp || ""
      ).trim();

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message:
            "Mobile number or email is required",
        });
      }

      if (!/^[0-9]{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          message:
            "Valid 6-digit OTP is required",
        });
      }

      await client.query("BEGIN");
      transactionStarted = true;

      const customer =
        await findCustomerByIdentifier(
          client,
          identifier
        );

      if (!customer) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message:
            "OTP is invalid or expired",
        });
      }

      const otpResult =
        await client.query(
          `
            SELECT *
            FROM customer_otps
            WHERE customer_profile_id =
              $1
              AND destination = $2
              AND purpose =
                'FORGOT_PASSWORD'
              AND verified_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
          `,
          [
            customer.id,
            customer.phone,
          ]
        );

      if (!otpResult.rows.length) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message:
            "OTP is invalid or expired",
        });
      }

      const otpRecord =
        otpResult.rows[0];

      if (
        new Date(
          otpRecord.expires_at
        ).getTime() <= Date.now()
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message:
            "OTP has expired",
        });
      }

      if (
        Number(otpRecord.attempts) >=
        Number(
          otpRecord.max_attempts
        )
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(429).json({
          success: false,
          message:
            "Maximum OTP attempts exceeded",
        });
      }

      const otpMatches =
        await bcrypt.compare(
          otp,
          otpRecord.otp_hash
        );

      if (!otpMatches) {
        const attemptResult =
          await client.query(
            `
              UPDATE customer_otps
              SET attempts =
                attempts + 1
              WHERE id = $1
              RETURNING
                attempts,
                max_attempts
            `,
            [otpRecord.id]
          );

        await client.query("COMMIT");
        transactionStarted = false;

        const updated =
          attemptResult.rows[0];

        return res.status(400).json({
          success: false,
          message:
            "OTP is invalid",
          remaining_attempts:
            Math.max(
              0,
              Number(
                updated.max_attempts
              ) -
                Number(
                  updated.attempts
                )
            ),
        });
      }

      await client.query(
        `
          UPDATE customer_otps
          SET verified_at =
            CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [otpRecord.id]
      );

      await client.query(
        `
          UPDATE customer_password_reset_tokens
          SET used_at =
            CURRENT_TIMESTAMP
          WHERE customer_profile_id =
            $1
            AND used_at IS NULL
            AND expires_at >
              CURRENT_TIMESTAMP
        `,
        [customer.id]
      );

      const resetToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      const tokenHash =
        hashResetToken(resetToken);

      const tokenResult =
        await client.query(
          `
            INSERT INTO customer_password_reset_tokens (
              customer_profile_id,
              token_hash,
              expires_at,
              request_ip
            )
            VALUES (
              $1,
              $2,
              CURRENT_TIMESTAMP
                + ($3 * INTERVAL '1 minute'),
              $4
            )
            RETURNING expires_at
          `,
          [
            customer.id,
            tokenHash,
            RESET_EXPIRY_MINUTES,
            req.ip || null,
          ]
        );

      await client.query("COMMIT");
      transactionStarted = false;

      return res.json({
        success: true,
        message:
          "OTP verified successfully",
        reset_token: resetToken,
        expires_at:
          tokenResult.rows[0]
            .expires_at,
      });
    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query(
            "ROLLBACK"
          );
        } catch {}
      }

      console.error(
        "Password reset OTP verification failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "OTP verification failed",
      });
    } finally {
      client.release();
    }
  };

const resetCustomerPassword =
  async (req, res) => {
    const client =
      await pool.connect();

    let transactionStarted = false;

    try {
      const resetToken = String(
        req.body.reset_token || ""
      ).trim();

      const password =
        req.body.password;

      const confirmPassword =
        req.body.confirm_password;

      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message:
            "Password reset token is required",
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
        password !== confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password and confirm password do not match",
        });
      }

      const tokenHash =
        hashResetToken(resetToken);

      await client.query("BEGIN");
      transactionStarted = true;

      const tokenResult =
        await client.query(
          `
            SELECT *
            FROM customer_password_reset_tokens
            WHERE token_hash = $1
              AND used_at IS NULL
              AND expires_at >
                CURRENT_TIMESTAMP
            LIMIT 1
            FOR UPDATE
          `,
          [tokenHash]
        );

      if (!tokenResult.rows.length) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message:
            "Password reset link is invalid or expired",
        });
      }

      const resetRecord =
        tokenResult.rows[0];

      const customerResult =
        await client.query(
          `
            SELECT password_hash
            FROM customer_profiles
            WHERE id = $1
              AND is_active = TRUE
              AND deleted_at IS NULL
            LIMIT 1
            FOR UPDATE
          `,
          [
            resetRecord
              .customer_profile_id,
          ]
        );

      if (!customerResult.rows.length) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(404).json({
          success: false,
          message:
            "Customer account not found",
        });
      }

      const currentHash =
        customerResult.rows[0]
          .password_hash;

      if (
        currentHash &&
        await bcrypt.compare(
          password,
          currentHash
        )
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message:
            "New password must be different from the current password",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      await client.query(
        `
          UPDATE customer_profiles
          SET
            password_hash = $1,
            password_changed_at =
              CURRENT_TIMESTAMP,
            failed_login_attempts = 0,
            locked_until = NULL,
            account_status =
              CASE
                WHEN account_status =
                  'LOCKED'
                  THEN 'ACTIVE'
                ELSE account_status
              END,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $2
        `,
        [
          passwordHash,
          resetRecord
            .customer_profile_id,
        ]
      );

      await client.query(
        `
          UPDATE customer_password_reset_tokens
          SET used_at =
            CURRENT_TIMESTAMP
          WHERE customer_profile_id =
            $1
            AND used_at IS NULL
        `,
        [
          resetRecord
            .customer_profile_id,
        ]
      );

      await client.query(
        `
          UPDATE customer_otps
          SET expires_at =
            CURRENT_TIMESTAMP
          WHERE customer_profile_id =
            $1
            AND purpose =
              'FORGOT_PASSWORD'
            AND verified_at IS NULL
        `,
        [
          resetRecord
            .customer_profile_id,
        ]
      );

      await client.query("COMMIT");
      transactionStarted = false;

      return res.json({
        success: true,
        message:
          "Password reset successfully. Please login with your new password.",
      });
    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query(
            "ROLLBACK"
          );
        } catch {}
      }

      console.error(
        "Customer password reset failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Password reset failed",
      });
    } finally {
      client.release();
    }
  };

const changeCustomerPassword =
  async (req, res) => {
    try {
      const customerId = Number(
        req.customer?.id
      );

      const currentPassword =
        req.body.current_password;

      const newPassword =
        req.body.new_password;

      const confirmPassword =
        req.body.confirm_password;

      if (
        !Number.isInteger(customerId) ||
        customerId <= 0
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Valid customer account is required",
        });
      }

      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Current password is required",
        });
      }

      if (
        !isValidPassword(
          newPassword
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password must contain at least 8 characters, one letter and one number",
        });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password and confirm password do not match",
        });
      }

      const customerResult =
        await pool.query(
          `
            SELECT *
            FROM customer_profiles
            WHERE id = $1
              AND is_active = TRUE
              AND deleted_at IS NULL
            LIMIT 1
          `,
          [customerId]
        );

      if (!customerResult.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Customer account not found",
        });
      }

      const customer =
        customerResult.rows[0];

      const currentMatches =
        await bcrypt.compare(
          currentPassword,
          customer.password_hash
        );

      if (!currentMatches) {
        return res.status(400).json({
          success: false,
          message:
            "Current password is incorrect",
        });
      }

      const samePassword =
        await bcrypt.compare(
          newPassword,
          customer.password_hash
        );

      if (samePassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from the current password",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      const updatedResult =
        await pool.query(
          `
            UPDATE customer_profiles
            SET
              password_hash = $1,
              password_changed_at =
                CURRENT_TIMESTAMP,
              failed_login_attempts = 0,
              locked_until = NULL,
              updated_at =
                CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `,
          [
            passwordHash,
            customerId,
          ]
        );

      await pool.query(
        `
          UPDATE customer_password_reset_tokens
          SET used_at =
            CURRENT_TIMESTAMP
          WHERE customer_profile_id =
            $1
            AND used_at IS NULL
        `,
        [customerId]
      );

      const updatedCustomer =
        updatedResult.rows[0];

      const token =
        createCustomerAccessToken(
          updatedCustomer
        );

      return res.json({
        success: true,
        message:
          "Password changed successfully",
        token,
      });
    } catch (error) {
      console.error(
        "Change customer password failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Password change failed",
      });
    }
  };

module.exports = {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetCustomerPassword,
  changeCustomerPassword,
};
