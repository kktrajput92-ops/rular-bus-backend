BEGIN;

ALTER TABLE coupon_codes
ADD COLUMN IF NOT EXISTS audience_type VARCHAR(30) NOT NULL DEFAULT 'ALL_USERS',
ADD COLUMN IF NOT EXISTS new_user_days INTEGER,
ADD COLUMN IF NOT EXISTS applicable_weekdays SMALLINT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::SMALLINT[],
ADD COLUMN IF NOT EXISTS payment_methods TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS booking_channels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS passenger_categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS bus_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS operator_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS combinable BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;

ALTER TABLE coupon_codes
DROP CONSTRAINT IF EXISTS coupon_codes_audience_type_check;

ALTER TABLE coupon_codes
ADD CONSTRAINT coupon_codes_audience_type_check
CHECK (
  audience_type IN (
    'ALL_USERS',
    'NEW_USERS',
    'FIRST_BOOKING',
    'EXISTING_USERS',
    'SELECTED_USERS'
  )
);

ALTER TABLE coupon_codes
DROP CONSTRAINT IF EXISTS coupon_codes_new_user_days_check;

ALTER TABLE coupon_codes
ADD CONSTRAINT coupon_codes_new_user_days_check
CHECK (
  new_user_days IS NULL
  OR new_user_days > 0
);

ALTER TABLE coupon_codes
DROP CONSTRAINT IF EXISTS coupon_codes_priority_check;

ALTER TABLE coupon_codes
ADD CONSTRAINT coupon_codes_priority_check
CHECK (priority >= 0);

ALTER TABLE coupon_codes
DROP CONSTRAINT IF EXISTS coupon_codes_weekdays_check;

ALTER TABLE coupon_codes
ADD CONSTRAINT coupon_codes_weekdays_check
CHECK (
  applicable_weekdays <@ ARRAY[0,1,2,3,4,5,6]::SMALLINT[]
);

CREATE UNIQUE INDEX IF NOT EXISTS coupon_codes_code_upper_unique
ON coupon_codes (UPPER(code));

CREATE INDEX IF NOT EXISTS coupon_codes_active_dates_idx
ON coupon_codes (is_active, valid_from, valid_to);

CREATE INDEX IF NOT EXISTS coupon_codes_audience_type_idx
ON coupon_codes (audience_type);

CREATE INDEX IF NOT EXISTS coupon_codes_priority_idx
ON coupon_codes (priority DESC);

CREATE TABLE IF NOT EXISTS coupon_selected_users (
  id BIGSERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL
    REFERENCES coupon_codes(id)
    ON DELETE CASCADE,
  user_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (coupon_id, user_id)
);

CREATE INDEX IF NOT EXISTS coupon_selected_users_user_idx
ON coupon_selected_users (user_id);

CREATE TABLE IF NOT EXISTS coupon_routes (
  id BIGSERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL
    REFERENCES coupon_codes(id)
    ON DELETE CASCADE,
  route_id INTEGER NOT NULL
    REFERENCES routes(id)
    ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (coupon_id, route_id)
);

CREATE INDEX IF NOT EXISTS coupon_routes_route_idx
ON coupon_routes (route_id);

CREATE TABLE IF NOT EXISTS coupon_fare_categories (
  id BIGSERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL
    REFERENCES coupon_codes(id)
    ON DELETE CASCADE,
  fare_category_id INTEGER NOT NULL
    REFERENCES fare_categories(id)
    ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (coupon_id, fare_category_id)
);

CREATE INDEX IF NOT EXISTS coupon_fare_categories_category_idx
ON coupon_fare_categories (fare_category_id);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id BIGSERIAL PRIMARY KEY,

  coupon_id INTEGER NOT NULL
    REFERENCES coupon_codes(id)
    ON DELETE RESTRICT,

  user_id INTEGER
    REFERENCES users(id)
    ON DELETE SET NULL,

  passenger_id INTEGER
    REFERENCES passengers(id)
    ON DELETE SET NULL,

  booking_id INTEGER
    REFERENCES bookings(id)
    ON DELETE SET NULL,

  coupon_code VARCHAR(100) NOT NULL,

  original_fare NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL,
  final_fare NUMERIC(12,2) NOT NULL,

  route_id INTEGER
    REFERENCES routes(id)
    ON DELETE SET NULL,

  bus_id INTEGER
    REFERENCES buses(id)
    ON DELETE SET NULL,

  fare_category_id INTEGER
    REFERENCES fare_categories(id)
    ON DELETE SET NULL,

  payment_method VARCHAR(50),
  booking_channel VARCHAR(50),
  passenger_category VARCHAR(50),
  journey_date DATE,

  status VARCHAR(20) NOT NULL DEFAULT 'APPLIED',

  redeemed_at TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  CONSTRAINT coupon_redemptions_original_fare_check
    CHECK (original_fare >= 0),

  CONSTRAINT coupon_redemptions_discount_amount_check
    CHECK (discount_amount >= 0),

  CONSTRAINT coupon_redemptions_final_fare_check
    CHECK (final_fare >= 0),

  CONSTRAINT coupon_redemptions_status_check
    CHECK (
      status IN (
        'APPLIED',
        'CONFIRMED',
        'CANCELLED',
        'REFUNDED'
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_booking_active_unique
ON coupon_redemptions (booking_id)
WHERE booking_id IS NOT NULL
  AND status IN ('APPLIED', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_idx
ON coupon_redemptions (coupon_id);

CREATE INDEX IF NOT EXISTS coupon_redemptions_user_idx
ON coupon_redemptions (user_id);

CREATE INDEX IF NOT EXISTS coupon_redemptions_passenger_idx
ON coupon_redemptions (passenger_id);

CREATE INDEX IF NOT EXISTS coupon_redemptions_booking_idx
ON coupon_redemptions (booking_id);

CREATE INDEX IF NOT EXISTS coupon_redemptions_redeemed_at_idx
ON coupon_redemptions (redeemed_at DESC);

CREATE INDEX IF NOT EXISTS coupon_redemptions_route_idx
ON coupon_redemptions (route_id);

CREATE INDEX IF NOT EXISTS coupon_redemptions_status_idx
ON coupon_redemptions (status);

CREATE OR REPLACE VIEW coupon_analytics AS
SELECT
  c.id AS coupon_id,
  c.code,
  c.name,
  c.audience_type,
  c.discount_type,
  c.discount_value,
  c.valid_from,
  c.valid_to,
  c.is_active,

  COUNT(cr.id) FILTER (
    WHERE cr.status IN ('APPLIED', 'CONFIRMED')
  ) AS total_redemptions,

  COUNT(DISTINCT cr.user_id) FILTER (
    WHERE cr.status IN ('APPLIED', 'CONFIRMED')
  ) AS unique_users,

  COUNT(DISTINCT cr.passenger_id) FILTER (
    WHERE cr.status IN ('APPLIED', 'CONFIRMED')
  ) AS unique_passengers,

  COALESCE(
    SUM(cr.original_fare) FILTER (
      WHERE cr.status IN ('APPLIED', 'CONFIRMED')
    ),
    0
  ) AS gross_fare,

  COALESCE(
    SUM(cr.discount_amount) FILTER (
      WHERE cr.status IN ('APPLIED', 'CONFIRMED')
    ),
    0
  ) AS total_discount,

  COALESCE(
    SUM(cr.final_fare) FILTER (
      WHERE cr.status IN ('APPLIED', 'CONFIRMED')
    ),
    0
  ) AS net_fare,

  COALESCE(
    AVG(cr.discount_amount) FILTER (
      WHERE cr.status IN ('APPLIED', 'CONFIRMED')
    ),
    0
  ) AS average_discount,

  MIN(cr.redeemed_at) FILTER (
    WHERE cr.status IN ('APPLIED', 'CONFIRMED')
  ) AS first_redemption_at,

  MAX(cr.redeemed_at) FILTER (
    WHERE cr.status IN ('APPLIED', 'CONFIRMED')
  ) AS last_redemption_at

FROM coupon_codes c
LEFT JOIN coupon_redemptions cr
  ON cr.coupon_id = c.id
GROUP BY
  c.id,
  c.code,
  c.name,
  c.audience_type,
  c.discount_type,
  c.discount_value,
  c.valid_from,
  c.valid_to,
  c.is_active;

COMMIT;

