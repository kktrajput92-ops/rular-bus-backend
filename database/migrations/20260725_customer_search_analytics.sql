BEGIN;

CREATE TABLE IF NOT EXISTS customer_search_logs (
  id BIGSERIAL PRIMARY KEY,

  anonymous_session_id VARCHAR(120) NOT NULL,
  passenger_id INTEGER,
  booking_id INTEGER,

  channel VARCHAR(30) NOT NULL DEFAULT 'MOBILE_WEB',
  device_type VARCHAR(30),
  operating_system VARCHAR(60),
  browser_name VARCHAR(80),
  app_version VARCHAR(40),

  source_text VARCHAR(180) NOT NULL,
  destination_text VARCHAR(180) NOT NULL,
  journey_date DATE NOT NULL,

  source_location_id INTEGER,
  destination_location_id INTEGER,
  nearest_location_id INTEGER,
  selected_nearest_location_id INTEGER,

  location_permission_status VARCHAR(30)
    NOT NULL DEFAULT 'NOT_REQUESTED',

  result_count INTEGER NOT NULL DEFAULT 0,
  bus_found BOOLEAN NOT NULL DEFAULT FALSE,

  booking_created BOOLEAN NOT NULL DEFAULT FALSE,
  converted_at TIMESTAMP,

  ip_address VARCHAR(100),
  user_agent TEXT,

  searched_at TIMESTAMP
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT customer_search_logs_channel_check
    CHECK (
      channel IN (
        'ANDROID_APP',
        'IOS_APP',
        'MOBILE_WEB',
        'DESKTOP_WEB',
        'COUNTER',
        'AGENT',
        'CONDUCTOR',
        'ADMIN',
        'OTHER'
      )
    ),

  CONSTRAINT customer_search_logs_permission_check
    CHECK (
      location_permission_status IN (
        'NOT_REQUESTED',
        'GRANTED',
        'DENIED',
        'UNAVAILABLE',
        'TIMEOUT'
      )
    ),

  CONSTRAINT customer_search_logs_result_count_check
    CHECK (result_count >= 0)
);

ALTER TABLE customer_search_logs
DROP CONSTRAINT IF EXISTS
customer_search_logs_passenger_id_fkey;

ALTER TABLE customer_search_logs
ADD CONSTRAINT
customer_search_logs_passenger_id_fkey
FOREIGN KEY (passenger_id)
REFERENCES passengers(id)
ON DELETE SET NULL;

ALTER TABLE customer_search_logs
DROP CONSTRAINT IF EXISTS
customer_search_logs_booking_id_fkey;

ALTER TABLE customer_search_logs
ADD CONSTRAINT
customer_search_logs_booking_id_fkey
FOREIGN KEY (booking_id)
REFERENCES bookings(id)
ON DELETE SET NULL;

ALTER TABLE customer_search_logs
DROP CONSTRAINT IF EXISTS
customer_search_logs_source_location_id_fkey;

ALTER TABLE customer_search_logs
ADD CONSTRAINT
customer_search_logs_source_location_id_fkey
FOREIGN KEY (source_location_id)
REFERENCES passenger_locations(id)
ON DELETE SET NULL;

ALTER TABLE customer_search_logs
DROP CONSTRAINT IF EXISTS
customer_search_logs_destination_location_id_fkey;

ALTER TABLE customer_search_logs
ADD CONSTRAINT
customer_search_logs_destination_location_id_fkey
FOREIGN KEY (destination_location_id)
REFERENCES passenger_locations(id)
ON DELETE SET NULL;

ALTER TABLE customer_search_logs
DROP CONSTRAINT IF EXISTS
customer_search_logs_nearest_location_id_fkey;

ALTER TABLE customer_search_logs
ADD CONSTRAINT
customer_search_logs_nearest_location_id_fkey
FOREIGN KEY (nearest_location_id)
REFERENCES passenger_locations(id)
ON DELETE SET NULL;

ALTER TABLE customer_search_logs
DROP CONSTRAINT IF EXISTS
customer_search_logs_selected_nearest_location_id_fkey;

ALTER TABLE customer_search_logs
ADD CONSTRAINT
customer_search_logs_selected_nearest_location_id_fkey
FOREIGN KEY (selected_nearest_location_id)
REFERENCES passenger_locations(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS
customer_search_logs_searched_at_idx
ON customer_search_logs(searched_at DESC);

CREATE INDEX IF NOT EXISTS
customer_search_logs_session_idx
ON customer_search_logs(
  anonymous_session_id,
  searched_at DESC
);

CREATE INDEX IF NOT EXISTS
customer_search_logs_channel_idx
ON customer_search_logs(
  channel,
  searched_at DESC
);

CREATE INDEX IF NOT EXISTS
customer_search_logs_route_idx
ON customer_search_logs(
  LOWER(source_text),
  LOWER(destination_text),
  searched_at DESC
);

CREATE INDEX IF NOT EXISTS
customer_search_logs_source_location_idx
ON customer_search_logs(
  source_location_id,
  searched_at DESC
);

CREATE INDEX IF NOT EXISTS
customer_search_logs_destination_location_idx
ON customer_search_logs(
  destination_location_id,
  searched_at DESC
);

CREATE INDEX IF NOT EXISTS
customer_search_logs_no_bus_idx
ON customer_search_logs(searched_at DESC)
WHERE bus_found = FALSE;

CREATE TABLE IF NOT EXISTS
customer_location_consent_logs (
  id BIGSERIAL PRIMARY KEY,

  anonymous_session_id VARCHAR(120) NOT NULL,
  passenger_id INTEGER,

  consent_status VARCHAR(30) NOT NULL,

  purpose VARCHAR(100) NOT NULL
    DEFAULT 'NEAREST_PICKUP_LOCATION',

  channel VARCHAR(30),
  nearest_location_id INTEGER,
  accuracy_meters INTEGER,

  ip_address VARCHAR(100),
  user_agent TEXT,

  created_at TIMESTAMP
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT
  customer_location_consent_status_check
    CHECK (
      consent_status IN (
        'GRANTED',
        'DENIED',
        'UNAVAILABLE',
        'TIMEOUT'
      )
    )
);

ALTER TABLE customer_location_consent_logs
DROP CONSTRAINT IF EXISTS
customer_location_consent_logs_passenger_id_fkey;

ALTER TABLE customer_location_consent_logs
ADD CONSTRAINT
customer_location_consent_logs_passenger_id_fkey
FOREIGN KEY (passenger_id)
REFERENCES passengers(id)
ON DELETE SET NULL;

ALTER TABLE customer_location_consent_logs
DROP CONSTRAINT IF EXISTS
customer_location_consent_logs_nearest_location_id_fkey;

ALTER TABLE customer_location_consent_logs
ADD CONSTRAINT
customer_location_consent_logs_nearest_location_id_fkey
FOREIGN KEY (nearest_location_id)
REFERENCES passenger_locations(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS
customer_location_consent_session_idx
ON customer_location_consent_logs(
  anonymous_session_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
customer_location_consent_status_idx
ON customer_location_consent_logs(
  consent_status,
  created_at DESC
);

COMMIT;
