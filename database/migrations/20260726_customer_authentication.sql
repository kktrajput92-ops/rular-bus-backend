BEGIN;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) NOT NULL DEFAULT 'hi';

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS registration_source VARCHAR(30) NOT NULL DEFAULT 'WEB';

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE customer_profiles
ADD CONSTRAINT customer_profiles_account_status_check
CHECK (
  account_status IN (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'LOCKED',
    'SUSPENDED',
    'DELETED'
  )
) NOT VALID;

ALTER TABLE customer_profiles
VALIDATE CONSTRAINT customer_profiles_account_status_check;

ALTER TABLE customer_profiles
ADD CONSTRAINT customer_profiles_preferred_language_check
CHECK (
  preferred_language IN ('hi', 'en')
) NOT VALID;

ALTER TABLE customer_profiles
VALIDATE CONSTRAINT customer_profiles_preferred_language_check;

ALTER TABLE customer_profiles
ADD CONSTRAINT customer_profiles_failed_login_attempts_check
CHECK (
  failed_login_attempts >= 0
) NOT VALID;

ALTER TABLE customer_profiles
VALIDATE CONSTRAINT customer_profiles_failed_login_attempts_check;

CREATE UNIQUE INDEX IF NOT EXISTS customer_profiles_email_unique
ON customer_profiles (LOWER(email))
WHERE email IS NOT NULL
  AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_active_phone
ON customer_profiles (phone)
WHERE is_active = TRUE
  AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_account_status
ON customer_profiles (account_status);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_locked_until
ON customer_profiles (locked_until)
WHERE locked_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS customer_otps (
  id BIGSERIAL PRIMARY KEY,

  customer_profile_id INTEGER
    REFERENCES customer_profiles(id)
    ON DELETE CASCADE,

  destination VARCHAR(255) NOT NULL,

  channel VARCHAR(20) NOT NULL,

  purpose VARCHAR(30) NOT NULL,

  otp_hash TEXT NOT NULL,

  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,

  verified_at TIMESTAMP WITHOUT TIME ZONE,

  attempts INTEGER NOT NULL DEFAULT 0,

  max_attempts INTEGER NOT NULL DEFAULT 5,

  resend_count INTEGER NOT NULL DEFAULT 0,

  request_ip VARCHAR(64),

  user_agent TEXT,

  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT customer_otps_channel_check
  CHECK (
    channel IN ('SMS', 'EMAIL')
  ),

  CONSTRAINT customer_otps_purpose_check
  CHECK (
    purpose IN (
      'REGISTER',
      'LOGIN',
      'FORGOT_PASSWORD',
      'VERIFY_PHONE',
      'VERIFY_EMAIL'
    )
  ),

  CONSTRAINT customer_otps_attempts_check
  CHECK (
    attempts >= 0
    AND max_attempts >= 1
    AND resend_count >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_customer_otps_destination_purpose
ON customer_otps (
  destination,
  purpose,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_customer_otps_customer_profile
ON customer_otps (
  customer_profile_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_customer_otps_active
ON customer_otps (
  destination,
  purpose,
  expires_at
)
WHERE verified_at IS NULL;

CREATE TABLE IF NOT EXISTS customer_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,

  customer_profile_id INTEGER NOT NULL
    REFERENCES customer_profiles(id)
    ON DELETE CASCADE,

  token_hash TEXT NOT NULL UNIQUE,

  device_id VARCHAR(255),

  device_name VARCHAR(255),

  request_ip VARCHAR(64),

  user_agent TEXT,

  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,

  revoked_at TIMESTAMP WITHOUT TIME ZONE,

  revoke_reason VARCHAR(100),

  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  last_used_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_customer_refresh_tokens_customer
ON customer_refresh_tokens (
  customer_profile_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_customer_refresh_tokens_active
ON customer_refresh_tokens (
  customer_profile_id,
  expires_at
)
WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS customer_login_logs (
  id BIGSERIAL PRIMARY KEY,

  customer_profile_id INTEGER
    REFERENCES customer_profiles(id)
    ON DELETE SET NULL,

  login_identifier VARCHAR(255),

  login_method VARCHAR(30) NOT NULL,

  success BOOLEAN NOT NULL,

  failure_reason VARCHAR(100),

  request_ip VARCHAR(64),

  user_agent TEXT,

  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT customer_login_logs_method_check
  CHECK (
    login_method IN (
      'PASSWORD',
      'PHONE_OTP',
      'EMAIL_OTP',
      'REFRESH_TOKEN'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_customer_login_logs_customer
ON customer_login_logs (
  customer_profile_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_customer_login_logs_identifier
ON customer_login_logs (
  login_identifier,
  created_at DESC
);

CREATE TABLE IF NOT EXISTS customer_password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,

  customer_profile_id INTEGER NOT NULL
    REFERENCES customer_profiles(id)
    ON DELETE CASCADE,

  token_hash TEXT NOT NULL UNIQUE,

  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,

  used_at TIMESTAMP WITHOUT TIME ZONE,

  request_ip VARCHAR(64),

  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_password_reset_customer
ON customer_password_reset_tokens (
  customer_profile_id,
  created_at DESC
);

COMMIT;
