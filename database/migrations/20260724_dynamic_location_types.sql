BEGIN;

CREATE TABLE IF NOT EXISTS passenger_location_types (
  id SERIAL PRIMARY KEY,
  type_code VARCHAR(60) NOT NULL UNIQUE,
  type_name VARCHAR(120) NOT NULL,
  display_name VARCHAR(120),
  icon VARCHAR(40),
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT passenger_location_types_code_check
    CHECK (type_code ~ '^[A-Z0-9_]+$'),

  CONSTRAINT passenger_location_types_sort_order_check
    CHECK (sort_order >= 0)
);

INSERT INTO passenger_location_types
(
  type_code,
  type_name,
  display_name,
  icon,
  sort_order
)
VALUES
  ('CITY', 'City', 'शहर', '🏙️', 1),
  ('TOWN', 'Town', 'कस्बा', '🏘️', 2),
  ('VILLAGE', 'Village', 'गाँव', '🏡', 3),
  ('AREA', 'Area', 'क्षेत्र', '📍', 4),
  ('STOP', 'General Stop', 'सामान्य स्टॉप', '🚏', 5),
  ('BUS_STAND', 'Bus Stand', 'बस अड्डा', '🚌', 6),
  ('BYPASS', 'Bypass', 'बाईपास', '🛣️', 7),
  ('PICKUP_POINT', 'Pickup Point', 'चढ़ने का स्थान', '⬆️', 8),
  ('DROP_POINT', 'Drop Point', 'उतरने का स्थान', '⬇️', 9),
  ('LANDMARK', 'Landmark', 'पहचान वाली जगह', '📌', 10),
  ('TOLL_PLAZA', 'Toll Plaza', 'टोल प्लाज़ा', '🚧', 11),
  ('DHABA', 'Dhaba', 'ढाबा', '🍛', 12),
  ('RESTAURANT', 'Restaurant', 'रेस्टोरेंट', '🍽️', 13),
  ('OTHER', 'Other', 'अन्य', '📍', 99)
ON CONFLICT (type_code) DO NOTHING;

ALTER TABLE passenger_locations
ADD COLUMN IF NOT EXISTS location_type_id INTEGER;

UPDATE passenger_locations pl
SET location_type_id = plt.id
FROM passenger_location_types plt
WHERE plt.type_code = pl.location_type
  AND pl.location_type_id IS NULL;

ALTER TABLE passenger_locations
DROP CONSTRAINT IF EXISTS passenger_locations_type_check;

ALTER TABLE passenger_locations
DROP CONSTRAINT IF EXISTS passenger_locations_location_type_id_fkey;

ALTER TABLE passenger_locations
ADD CONSTRAINT passenger_locations_location_type_id_fkey
FOREIGN KEY (location_type_id)
REFERENCES passenger_location_types(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS passenger_locations_type_id_idx
ON passenger_locations(location_type_id);

CREATE INDEX IF NOT EXISTS passenger_location_types_public_idx
ON passenger_location_types(is_active, sort_order, id);

COMMIT;
