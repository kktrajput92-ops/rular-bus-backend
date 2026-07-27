BEGIN;

CREATE TABLE IF NOT EXISTS passenger_locations (
  id SERIAL PRIMARY KEY,
  location_name VARCHAR(150) NOT NULL,
  display_name VARCHAR(150),
  state_name VARCHAR(120),
  location_type VARCHAR(30) NOT NULL DEFAULT 'CITY',
  allow_source BOOLEAN NOT NULL DEFAULT TRUE,
  allow_destination BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT passenger_locations_type_check
    CHECK (location_type IN ('CITY', 'STOP', 'AREA')),

  CONSTRAINT passenger_locations_sort_order_check
    CHECK (sort_order >= 0),

  CONSTRAINT passenger_locations_name_unique
    UNIQUE (location_name, state_name)
);

CREATE INDEX IF NOT EXISTS passenger_locations_public_idx
ON passenger_locations (
  is_active,
  allow_source,
  allow_destination,
  sort_order,
  id
);

COMMIT;
