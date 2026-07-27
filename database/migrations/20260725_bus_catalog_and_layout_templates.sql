BEGIN;

-- =========================================================
-- 1. BUS MANUFACTURERS
-- =========================================================

CREATE TABLE IF NOT EXISTS bus_manufacturers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(50) NOT NULL,
  country VARCHAR(80),
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bus_manufacturers_code
  ON bus_manufacturers (LOWER(code));

CREATE UNIQUE INDEX IF NOT EXISTS uq_bus_manufacturers_name
  ON bus_manufacturers (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_bus_manufacturers_active
  ON bus_manufacturers (is_active, sort_order, name);


-- =========================================================
-- 2. BUS MODELS
-- One manufacturer can have many models/chassis/platforms.
-- =========================================================

CREATE TABLE IF NOT EXISTS bus_models (
  id SERIAL PRIMARY KEY,
  manufacturer_id INTEGER NOT NULL
    REFERENCES bus_manufacturers(id)
    ON DELETE CASCADE,

  name VARCHAR(140) NOT NULL,
  code VARCHAR(70) NOT NULL,

  model_category VARCHAR(40) NOT NULL DEFAULT 'COACH',
  fuel_type VARCHAR(30),
  axle_type VARCHAR(40),
  length_meters NUMERIC(6,2),

  description TEXT,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT bus_models_category_check
    CHECK (
      model_category IN (
        'CITY_BUS',
        'INTERCITY',
        'COACH',
        'SCHOOL_BUS',
        'STAFF_BUS',
        'MINI_BUS',
        'CHASSIS',
        'ELECTRIC_BUS',
        'CUSTOM'
      )
    ),

  CONSTRAINT bus_models_length_check
    CHECK (
      length_meters IS NULL
      OR length_meters > 0
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bus_models_manufacturer_code
  ON bus_models (manufacturer_id, LOWER(code));

CREATE UNIQUE INDEX IF NOT EXISTS uq_bus_models_manufacturer_name
  ON bus_models (manufacturer_id, LOWER(name));

CREATE INDEX IF NOT EXISTS idx_bus_models_manufacturer
  ON bus_models (manufacturer_id, is_active, sort_order, name);


-- =========================================================
-- 3. BODY / COACH VARIANTS
-- Same model can have Seater, Sleeper, Semi-Sleeper etc.
-- =========================================================

CREATE TABLE IF NOT EXISTS bus_body_variants (
  id SERIAL PRIMARY KEY,

  model_id INTEGER NOT NULL
    REFERENCES bus_models(id)
    ON DELETE CASCADE,

  name VARCHAR(160) NOT NULL,
  code VARCHAR(80) NOT NULL,

  body_type VARCHAR(40) NOT NULL,
  layout_mode VARCHAR(40) NOT NULL,

  deck_type VARCHAR(30) NOT NULL DEFAULT 'LOWER_ONLY',

  is_ac BOOLEAN NOT NULL DEFAULT FALSE,
  is_sleeper BOOLEAN NOT NULL DEFAULT FALSE,

  default_capacity INTEGER,
  default_preset VARCHAR(80),

  description TEXT,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT bus_body_variants_body_type_check
    CHECK (
      body_type IN (
        'STANDARD_SEATER',
        'PUSHBACK_SEATER',
        'PREMIUM_RECLINER',
        'SEMI_SLEEPER',
        'FULL_SLEEPER',
        'MIXED_SEATER_SLEEPER',
        'PRIVATE_SLEEPER',
        'PRIVATE_SHARING_SLEEPER',
        'CUSTOM'
      )
    ),

  CONSTRAINT bus_body_variants_layout_mode_check
    CHECK (
      layout_mode IN (
        'FULL_SEATER',
        'PUSHBACK_SEATER',
        'SEMI_SLEEPER',
        'FULL_SLEEPER',
        'MIXED_SEATER_SLEEPER',
        'CUSTOM'
      )
    ),

  CONSTRAINT bus_body_variants_deck_type_check
    CHECK (
      deck_type IN (
        'LOWER_ONLY',
        'LOWER_UPPER',
        'CUSTOM'
      )
    ),

  CONSTRAINT bus_body_variants_capacity_check
    CHECK (
      default_capacity IS NULL
      OR default_capacity >= 0
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bus_body_variants_model_code
  ON bus_body_variants (model_id, LOWER(code));

CREATE UNIQUE INDEX IF NOT EXISTS uq_bus_body_variants_model_name
  ON bus_body_variants (model_id, LOWER(name));

CREATE INDEX IF NOT EXISTS idx_bus_body_variants_model
  ON bus_body_variants (model_id, is_active, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_bus_body_variants_layout
  ON bus_body_variants (layout_mode, body_type);


-- =========================================================
-- 4. REUSABLE SEAT LAYOUT TEMPLATES
-- =========================================================

CREATE TABLE IF NOT EXISTS seat_layout_templates (
  id SERIAL PRIMARY KEY,

  manufacturer_id INTEGER
    REFERENCES bus_manufacturers(id)
    ON DELETE SET NULL,

  model_id INTEGER
    REFERENCES bus_models(id)
    ON DELETE SET NULL,

  body_variant_id INTEGER
    REFERENCES bus_body_variants(id)
    ON DELETE SET NULL,

  name VARCHAR(180) NOT NULL,
  code VARCHAR(100) NOT NULL,

  layout_mode VARCHAR(40) NOT NULL,
  layout_preset VARCHAR(80),

  steering_position VARCHAR(20)
    NOT NULL DEFAULT 'RIGHT_HAND_DRIVE',

  conductor_side VARCHAR(10)
    NOT NULL DEFAULT 'LEFT',

  driver_side VARCHAR(10)
    NOT NULL DEFAULT 'RIGHT',

  lower_deck_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  upper_deck_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  passenger_capacity INTEGER NOT NULL DEFAULT 0,

  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,

  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT seat_layout_templates_mode_check
    CHECK (
      layout_mode IN (
        'FULL_SEATER',
        'PUSHBACK_SEATER',
        'SEMI_SLEEPER',
        'FULL_SLEEPER',
        'MIXED_SEATER_SLEEPER',
        'CUSTOM'
      )
    ),

  CONSTRAINT seat_layout_templates_steering_check
    CHECK (
      steering_position = 'RIGHT_HAND_DRIVE'
    ),

  CONSTRAINT seat_layout_templates_conductor_side_check
    CHECK (
      conductor_side = 'LEFT'
    ),

  CONSTRAINT seat_layout_templates_driver_side_check
    CHECK (
      driver_side = 'RIGHT'
    ),

  CONSTRAINT seat_layout_templates_capacity_check
    CHECK (
      passenger_capacity >= 0
    ),

  CONSTRAINT seat_layout_templates_layout_array_check
    CHECK (
      jsonb_typeof(layout) = 'array'
    ),

  CONSTRAINT seat_layout_templates_configuration_object_check
    CHECK (
      jsonb_typeof(configuration) = 'object'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_seat_layout_templates_code
  ON seat_layout_templates (LOWER(code));

CREATE INDEX IF NOT EXISTS idx_seat_layout_templates_catalog
  ON seat_layout_templates (
    manufacturer_id,
    model_id,
    body_variant_id,
    is_active
  );

CREATE INDEX IF NOT EXISTS idx_seat_layout_templates_mode
  ON seat_layout_templates (layout_mode, is_active);


-- =========================================================
-- 5. CONNECT CATALOG TO BUSES
-- =========================================================

ALTER TABLE buses
  ADD COLUMN IF NOT EXISTS manufacturer_id INTEGER,
  ADD COLUMN IF NOT EXISTS model_id INTEGER,
  ADD COLUMN IF NOT EXISTS body_variant_id INTEGER,
  ADD COLUMN IF NOT EXISTS seat_layout_template_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'buses_manufacturer_id_fkey'
  ) THEN
    ALTER TABLE buses
      ADD CONSTRAINT buses_manufacturer_id_fkey
      FOREIGN KEY (manufacturer_id)
      REFERENCES bus_manufacturers(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'buses_model_id_fkey'
  ) THEN
    ALTER TABLE buses
      ADD CONSTRAINT buses_model_id_fkey
      FOREIGN KEY (model_id)
      REFERENCES bus_models(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'buses_body_variant_id_fkey'
  ) THEN
    ALTER TABLE buses
      ADD CONSTRAINT buses_body_variant_id_fkey
      FOREIGN KEY (body_variant_id)
      REFERENCES bus_body_variants(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'buses_seat_layout_template_id_fkey'
  ) THEN
    ALTER TABLE buses
      ADD CONSTRAINT buses_seat_layout_template_id_fkey
      FOREIGN KEY (seat_layout_template_id)
      REFERENCES seat_layout_templates(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_buses_manufacturer
  ON buses (manufacturer_id);

CREATE INDEX IF NOT EXISTS idx_buses_model
  ON buses (model_id);

CREATE INDEX IF NOT EXISTS idx_buses_body_variant
  ON buses (body_variant_id);

CREATE INDEX IF NOT EXISTS idx_buses_layout_template
  ON buses (seat_layout_template_id);


-- =========================================================
-- 6. EXPAND EXISTING SEAT LAYOUT CONFIG MODES
-- =========================================================

ALTER TABLE bus_seat_layout_configs
  DROP CONSTRAINT IF EXISTS bus_seat_layout_configs_mode_check;

ALTER TABLE bus_seat_layout_configs
  ADD CONSTRAINT bus_seat_layout_configs_mode_check
  CHECK (
    layout_mode IN (
      'FULL_SEATER',
      'PUSHBACK_SEATER',
      'SEMI_SLEEPER',
      'FULL_SLEEPER',
      'MIXED_SEATER_SLEEPER',
      'CUSTOM'
    )
  );


-- =========================================================
-- 7. INITIAL MANUFACTURER MASTER
-- Fully editable through Admin CRUD later.
-- =========================================================

INSERT INTO bus_manufacturers (
  name,
  code,
  country,
  sort_order
)
VALUES
  ('Ashok Leyland', 'ASHOK_LEYLAND', 'India', 10),
  ('BharatBenz', 'BHARATBENZ', 'India', 20),
  ('Eicher', 'EICHER', 'India', 30),
  ('Force Motors', 'FORCE_MOTORS', 'India', 40),
  ('Scania', 'SCANIA', 'Sweden', 50),
  ('SML Isuzu', 'SML_ISUZU', 'India', 60),
  ('Tata Motors', 'TATA_MOTORS', 'India', 70),
  ('Volvo', 'VOLVO', 'Sweden', 80),
  ('Custom / Other', 'CUSTOM_OTHER', NULL, 999)
ON CONFLICT DO NOTHING;


-- =========================================================
-- 8. STARTER MODEL CATALOG
-- Editable starter data, not a closed/exhaustive list.
-- =========================================================

INSERT INTO bus_models (
  manufacturer_id,
  name,
  code,
  model_category,
  sort_order
)
SELECT
  manufacturer.id,
  seed.name,
  seed.code,
  seed.model_category,
  seed.sort_order
FROM (
  VALUES
    ('ASHOK_LEYLAND', 'Garud 12M', 'GARUD_12M', 'COACH', 10),
    ('ASHOK_LEYLAND', 'Garud 15M', 'GARUD_15M', 'COACH', 20),
    ('ASHOK_LEYLAND', 'Viking', 'VIKING', 'CHASSIS', 30),
    ('ASHOK_LEYLAND', 'Oyster', 'OYSTER', 'INTERCITY', 40),

    ('BHARATBENZ', '917 Bus Chassis', '917_CHASSIS', 'CHASSIS', 10),
    ('BHARATBENZ', '1017 Bus', '1017_BUS', 'INTERCITY', 20),
    ('BHARATBENZ', '1624 Bus Chassis', '1624_CHASSIS', 'CHASSIS', 30),
    ('BHARATBENZ', '1924 Bus Chassis', '1924_CHASSIS', 'CHASSIS', 40),

    ('EICHER', 'Skyline', 'SKYLINE', 'INTERCITY', 10),
    ('EICHER', 'Skyline Pro', 'SKYLINE_PRO', 'COACH', 20),
    ('EICHER', 'Intercity Coach', 'INTERCITY_COACH', 'COACH', 30),

    ('FORCE_MOTORS', 'Traveller', 'TRAVELLER', 'MINI_BUS', 10),
    ('FORCE_MOTORS', 'Urbania', 'URBANIA', 'MINI_BUS', 20),

    ('SCANIA', 'K-Series Coach', 'K_SERIES_COACH', 'COACH', 10),
    ('SCANIA', 'Touring Coach', 'TOURING_COACH', 'COACH', 20),

    ('SML_ISUZU', 'S7', 'S7', 'INTERCITY', 10),
    ('SML_ISUZU', 'Hiroi', 'HIROI', 'COACH', 20),
    ('SML_ISUZU', 'Executive Coach', 'EXECUTIVE_COACH', 'COACH', 30),

    ('TATA_MOTORS', 'Starbus', 'STARBUS', 'INTERCITY', 10),
    ('TATA_MOTORS', 'Ultra', 'ULTRA', 'INTERCITY', 20),
    ('TATA_MOTORS', 'LPO Chassis', 'LPO_CHASSIS', 'CHASSIS', 30),
    ('TATA_MOTORS', 'Magna Coach', 'MAGNA_COACH', 'COACH', 40),

    ('VOLVO', '9600', '9600', 'COACH', 10),
    ('VOLVO', '9400', '9400', 'COACH', 20),
    ('VOLVO', 'B8R', 'B8R', 'CHASSIS', 30),
    ('VOLVO', 'B11R', 'B11R', 'CHASSIS', 40),

    ('CUSTOM_OTHER', 'Custom Bus', 'CUSTOM_BUS', 'CUSTOM', 10)
) AS seed(
  manufacturer_code,
  name,
  code,
  model_category,
  sort_order
)
JOIN bus_manufacturers manufacturer
  ON manufacturer.code = seed.manufacturer_code
ON CONFLICT DO NOTHING;


-- =========================================================
-- 9. GENERIC BODY VARIANTS FOR EVERY STARTER MODEL
-- Actual row/seat layout remains editable.
-- =========================================================

INSERT INTO bus_body_variants (
  model_id,
  name,
  code,
  body_type,
  layout_mode,
  deck_type,
  is_ac,
  is_sleeper,
  default_preset,
  sort_order
)
SELECT
  model.id,
  variant.name,
  variant.code,
  variant.body_type,
  variant.layout_mode,
  variant.deck_type,
  variant.is_ac,
  variant.is_sleeper,
  variant.default_preset,
  variant.sort_order
FROM bus_models model
CROSS JOIN (
  VALUES
    (
      'Standard Seater 2x2',
      'STANDARD_SEATER_2X2',
      'STANDARD_SEATER',
      'FULL_SEATER',
      'LOWER_ONLY',
      FALSE,
      FALSE,
      'SEATER_2X2',
      10
    ),
    (
      'Pushback Seater 2x2',
      'PUSHBACK_SEATER_2X2',
      'PUSHBACK_SEATER',
      'PUSHBACK_SEATER',
      'LOWER_ONLY',
      TRUE,
      FALSE,
      'PUSHBACK_2X2',
      20
    ),
    (
      'Premium Seater 2x1',
      'PREMIUM_SEATER_2X1',
      'PREMIUM_RECLINER',
      'PUSHBACK_SEATER',
      'LOWER_ONLY',
      TRUE,
      FALSE,
      'PREMIUM_2X1',
      30
    ),
    (
      'Semi Sleeper 2x2',
      'SEMI_SLEEPER_2X2',
      'SEMI_SLEEPER',
      'SEMI_SLEEPER',
      'LOWER_ONLY',
      TRUE,
      FALSE,
      'SEMI_SLEEPER_2X2',
      40
    ),
    (
      'Semi Sleeper 2x1',
      'SEMI_SLEEPER_2X1',
      'SEMI_SLEEPER',
      'SEMI_SLEEPER',
      'LOWER_ONLY',
      TRUE,
      FALSE,
      'SEMI_SLEEPER_2X1',
      50
    ),
    (
      'Full Sleeper',
      'FULL_SLEEPER',
      'FULL_SLEEPER',
      'FULL_SLEEPER',
      'LOWER_UPPER',
      TRUE,
      TRUE,
      'FULL_SLEEPER',
      60
    ),
    (
      'Mixed Seater Sleeper',
      'MIXED_SEATER_SLEEPER',
      'MIXED_SEATER_SLEEPER',
      'MIXED_SEATER_SLEEPER',
      'LOWER_UPPER',
      TRUE,
      TRUE,
      'MIXED_COACH',
      70
    ),
    (
      'Private Sharing Sleeper',
      'PRIVATE_SHARING_SLEEPER',
      'PRIVATE_SHARING_SLEEPER',
      'FULL_SLEEPER',
      'LOWER_UPPER',
      TRUE,
      TRUE,
      'PRIVATE_SHARING_SLEEPER',
      80
    ),
    (
      'Custom Layout',
      'CUSTOM_LAYOUT',
      'CUSTOM',
      'CUSTOM',
      'CUSTOM',
      FALSE,
      FALSE,
      'CUSTOM_GRID',
      999
    )
) AS variant(
  name,
  code,
  body_type,
  layout_mode,
  deck_type,
  is_ac,
  is_sleeper,
  default_preset,
  sort_order
)
ON CONFLICT DO NOTHING;

COMMIT;
