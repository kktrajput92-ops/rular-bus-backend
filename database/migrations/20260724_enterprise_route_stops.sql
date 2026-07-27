BEGIN;

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS location_id INTEGER;

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS display_name VARCHAR(150);

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS stop_type VARCHAR(30) NOT NULL DEFAULT 'STOP';

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS arrival_offset_minutes INTEGER;

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS departure_offset_minutes INTEGER;

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS distance_from_origin_km NUMERIC(10,2);

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS boarding_allowed BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS dropping_allowed BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS landmark VARCHAR(250);

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE stops
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL
DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE stops
DROP CONSTRAINT IF EXISTS stops_location_id_fkey;

ALTER TABLE stops
ADD CONSTRAINT stops_location_id_fkey
FOREIGN KEY (location_id)
REFERENCES passenger_locations(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

ALTER TABLE stops
DROP CONSTRAINT IF EXISTS stops_stop_type_check;

ALTER TABLE stops
ADD CONSTRAINT stops_stop_type_check
CHECK (
  stop_type IN (
    'ORIGIN',
    'CITY',
    'TOWN',
    'VILLAGE',
    'BUS_STAND',
    'PICKUP_POINT',
    'BYPASS',
    'LANDMARK',
    'STOP',
    'DESTINATION'
  )
);

ALTER TABLE stops
DROP CONSTRAINT IF EXISTS stops_stop_order_check;

ALTER TABLE stops
ADD CONSTRAINT stops_stop_order_check
CHECK (stop_order >= 0);

ALTER TABLE stops
DROP CONSTRAINT IF EXISTS stops_arrival_offset_check;

ALTER TABLE stops
ADD CONSTRAINT stops_arrival_offset_check
CHECK (
  arrival_offset_minutes IS NULL
  OR arrival_offset_minutes >= 0
);

ALTER TABLE stops
DROP CONSTRAINT IF EXISTS stops_departure_offset_check;

ALTER TABLE stops
ADD CONSTRAINT stops_departure_offset_check
CHECK (
  departure_offset_minutes IS NULL
  OR departure_offset_minutes >= 0
);

ALTER TABLE stops
DROP CONSTRAINT IF EXISTS stops_distance_from_origin_check;

ALTER TABLE stops
ADD CONSTRAINT stops_distance_from_origin_check
CHECK (
  distance_from_origin_km IS NULL
  OR distance_from_origin_km >= 0
);

ALTER TABLE stops
DROP CONSTRAINT IF EXISTS stops_latitude_check;

ALTER TABLE stops
ADD CONSTRAINT stops_latitude_check
CHECK (
  latitude IS NULL
  OR latitude BETWEEN -90 AND 90
);

ALTER TABLE stops
DROP CONSTRAINT IF EXISTS stops_longitude_check;

ALTER TABLE stops
ADD CONSTRAINT stops_longitude_check
CHECK (
  longitude IS NULL
  OR longitude BETWEEN -180 AND 180
);

CREATE INDEX IF NOT EXISTS stops_route_order_idx
ON stops(route_id, stop_order);

CREATE INDEX IF NOT EXISTS stops_location_idx
ON stops(location_id);

CREATE INDEX IF NOT EXISTS stops_public_route_idx
ON stops(
  route_id,
  is_active,
  stop_order,
  boarding_allowed,
  dropping_allowed
);

UPDATE stops
SET
  display_name = COALESCE(
    NULLIF(TRIM(display_name), ''),
    stop_name
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE display_name IS NULL
   OR TRIM(display_name) = '';

COMMIT;
