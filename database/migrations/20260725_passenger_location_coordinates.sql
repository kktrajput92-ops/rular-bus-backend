BEGIN;

ALTER TABLE passenger_locations
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);

ALTER TABLE passenger_locations
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

ALTER TABLE passenger_locations
ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER NOT NULL DEFAULT 5000;

ALTER TABLE passenger_locations
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE passenger_locations
ADD COLUMN IF NOT EXISTS landmark VARCHAR(250);

ALTER TABLE passenger_locations
DROP CONSTRAINT IF EXISTS passenger_locations_latitude_check;

ALTER TABLE passenger_locations
ADD CONSTRAINT passenger_locations_latitude_check
CHECK (
  latitude IS NULL OR
  latitude BETWEEN -90 AND 90
);

ALTER TABLE passenger_locations
DROP CONSTRAINT IF EXISTS passenger_locations_longitude_check;

ALTER TABLE passenger_locations
ADD CONSTRAINT passenger_locations_longitude_check
CHECK (
  longitude IS NULL OR
  longitude BETWEEN -180 AND 180
);

ALTER TABLE passenger_locations
DROP CONSTRAINT IF EXISTS passenger_locations_geofence_radius_check;

ALTER TABLE passenger_locations
ADD CONSTRAINT passenger_locations_geofence_radius_check
CHECK (
  geofence_radius_meters BETWEEN 100 AND 100000
);

CREATE INDEX IF NOT EXISTS passenger_locations_coordinates_idx
ON passenger_locations(latitude, longitude)
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND is_active = TRUE;

COMMIT;
