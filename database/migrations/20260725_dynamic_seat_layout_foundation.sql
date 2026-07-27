BEGIN;

CREATE TABLE IF NOT EXISTS bus_seat_layout_configs (
  id SERIAL PRIMARY KEY,
  bus_id INTEGER NOT NULL UNIQUE
    REFERENCES buses(id) ON DELETE CASCADE,

  layout_mode VARCHAR(40) NOT NULL DEFAULT 'CUSTOM',
  layout_preset VARCHAR(40),

  steering_position VARCHAR(20)
    NOT NULL DEFAULT 'RIGHT_HAND_DRIVE',

  conductor_side VARCHAR(10)
    NOT NULL DEFAULT 'LEFT',

  driver_side VARCHAR(10)
    NOT NULL DEFAULT 'RIGHT',

  lower_deck_enabled BOOLEAN
    NOT NULL DEFAULT TRUE,

  upper_deck_enabled BOOLEAN
    NOT NULL DEFAULT FALSE,

  configuration JSONB
    NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMP
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT bus_seat_layout_configs_mode_check
    CHECK (
      layout_mode IN (
        'FULL_SEATER',
        'FULL_SLEEPER',
        'MIXED_SEATER_SLEEPER',
        'SEMI_SLEEPER',
        'CUSTOM'
      )
    ),

  CONSTRAINT bus_seat_layout_configs_steering_check
    CHECK (
      steering_position = 'RIGHT_HAND_DRIVE'
    ),

  CONSTRAINT bus_seat_layout_configs_conductor_side_check
    CHECK (
      conductor_side = 'LEFT'
    ),

  CONSTRAINT bus_seat_layout_configs_driver_side_check
    CHECK (
      driver_side = 'RIGHT'
    )
);

ALTER TABLE seat_layouts
  ADD COLUMN IF NOT EXISTS side VARCHAR(30);

ALTER TABLE seat_layouts
  ADD COLUMN IF NOT EXISTS position_kind VARCHAR(40);

ALTER TABLE seat_layouts
  ADD COLUMN IF NOT EXISTS berth_group VARCHAR(40);

ALTER TABLE seat_layouts
  ADD COLUMN IF NOT EXISTS private_booking_enabled BOOLEAN
    NOT NULL DEFAULT TRUE;

ALTER TABLE seat_layouts
  ADD COLUMN IF NOT EXISTS sharing_booking_enabled BOOLEAN
    NOT NULL DEFAULT FALSE;

ALTER TABLE seat_layouts
  ADD COLUMN IF NOT EXISTS sharing_capacity INTEGER
    NOT NULL DEFAULT 1;

ALTER TABLE seat_layouts
  ADD COLUMN IF NOT EXISTS private_fare NUMERIC(10,2);

ALTER TABLE seat_layouts
  ADD COLUMN IF NOT EXISTS sharing_fare NUMERIC(10,2);

ALTER TABLE seat_layouts
  DROP CONSTRAINT IF EXISTS seat_layouts_side_check;

ALTER TABLE seat_layouts
  ADD CONSTRAINT seat_layouts_side_check
  CHECK (
    side IS NULL
    OR side IN (
      'CONDUCTOR_LEFT',
      'DRIVER_RIGHT',
      'CENTER',
      'FULL_WIDTH'
    )
  );

ALTER TABLE seat_layouts
  DROP CONSTRAINT IF EXISTS seat_layouts_sharing_capacity_check;

ALTER TABLE seat_layouts
  ADD CONSTRAINT seat_layouts_sharing_capacity_check
  CHECK (
    sharing_capacity >= 1
    AND sharing_capacity <= 10
  );

ALTER TABLE seat_layouts
  DROP CONSTRAINT IF EXISTS seat_layouts_private_fare_check;

ALTER TABLE seat_layouts
  ADD CONSTRAINT seat_layouts_private_fare_check
  CHECK (
    private_fare IS NULL
    OR private_fare >= 0
  );

ALTER TABLE seat_layouts
  DROP CONSTRAINT IF EXISTS seat_layouts_sharing_fare_check;

ALTER TABLE seat_layouts
  ADD CONSTRAINT seat_layouts_sharing_fare_check
  CHECK (
    sharing_fare IS NULL
    OR sharing_fare >= 0
  );

CREATE INDEX IF NOT EXISTS
  idx_seat_layouts_bus_deck_position
ON seat_layouts (
  bus_id,
  deck,
  row_no,
  col_no
);

CREATE INDEX IF NOT EXISTS
  idx_seat_layouts_bus_berth_group
ON seat_layouts (
  bus_id,
  berth_group
)
WHERE berth_group IS NOT NULL;

INSERT INTO bus_seat_layout_configs (
  bus_id,
  layout_mode,
  layout_preset,
  lower_deck_enabled,
  upper_deck_enabled,
  configuration
)
SELECT
  b.id,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM seat_layouts sl
      WHERE sl.bus_id = b.id
        AND sl.seat_type IN (
          'LOWER_BERTH',
          'UPPER_BERTH'
        )
    )
    THEN 'FULL_SLEEPER'
    ELSE 'FULL_SEATER'
  END,
  NULL,
  TRUE,
  EXISTS (
    SELECT 1
    FROM seat_layouts sl
    WHERE sl.bus_id = b.id
      AND sl.deck = 'UPPER'
  ),
  '{}'::jsonb
FROM buses b
WHERE EXISTS (
  SELECT 1
  FROM seat_layouts sl
  WHERE sl.bus_id = b.id
)
ON CONFLICT (bus_id) DO NOTHING;

COMMIT;
