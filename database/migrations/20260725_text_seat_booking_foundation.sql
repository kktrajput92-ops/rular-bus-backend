BEGIN;

-- =========================================================
-- 1. NORMALIZE EXISTING SEAT-LAYOUT DECK VALUES
-- Legacy layouts may contain 1 / 2 instead of LOWER / UPPER.
-- =========================================================

UPDATE seat_layouts
SET deck = CASE
  WHEN UPPER(TRIM(deck)) IN ('1', 'LOWER', 'LOWER_DECK')
    THEN 'LOWER'
  WHEN UPPER(TRIM(deck)) IN ('2', 'UPPER', 'UPPER_DECK')
    THEN 'UPPER'
  ELSE UPPER(TRIM(deck))
END;

ALTER TABLE seat_layouts
  DROP CONSTRAINT IF EXISTS seat_layouts_deck_check;

ALTER TABLE seat_layouts
  ADD CONSTRAINT seat_layouts_deck_check
  CHECK (
    deck IN (
      'LOWER',
      'UPPER'
    )
  );


-- =========================================================
-- 2. BOOKINGS: INTEGER SEAT NUMBER → TEXT SEAT REFERENCE
-- Existing numeric values are preserved as strings.
-- =========================================================

ALTER TABLE bookings
  ALTER COLUMN seat_number
  TYPE VARCHAR(40)
  USING seat_number::VARCHAR;

ALTER TABLE booking_passengers
  ALTER COLUMN seat_number
  TYPE VARCHAR(40)
  USING seat_number::VARCHAR;

ALTER TABLE seat_locks
  ALTER COLUMN seat_number
  TYPE VARCHAR(40)
  USING seat_number::VARCHAR;


-- =========================================================
-- 3. BOOKING-LEVEL SNAPSHOT / SEGMENT FOUNDATION
-- =========================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS boarding_stop_id INTEGER,
  ADD COLUMN IF NOT EXISTS dropping_stop_id INTEGER,
  ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20)
    NOT NULL DEFAULT 'SEAT',
  ADD COLUMN IF NOT EXISTS berth_group VARCHAR(40),
  ADD COLUMN IF NOT EXISTS sharing_slot INTEGER,
  ADD COLUMN IF NOT EXISTS fare_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10)
    NOT NULL DEFAULT 'INR';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'bookings_boarding_stop_id_fkey'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT
        bookings_boarding_stop_id_fkey
      FOREIGN KEY (boarding_stop_id)
      REFERENCES stops(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'bookings_dropping_stop_id_fkey'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT
        bookings_dropping_stop_id_fkey
      FOREIGN KEY (dropping_stop_id)
      REFERENCES stops(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS
    bookings_booking_mode_check;

ALTER TABLE bookings
  ADD CONSTRAINT
    bookings_booking_mode_check
  CHECK (
    booking_mode IN (
      'SEAT',
      'PRIVATE',
      'SHARING'
    )
  );

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS
    bookings_sharing_slot_check;

ALTER TABLE bookings
  ADD CONSTRAINT
    bookings_sharing_slot_check
  CHECK (
    sharing_slot IS NULL
    OR sharing_slot >= 1
  );

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS
    bookings_fare_amount_check;

ALTER TABLE bookings
  ADD CONSTRAINT
    bookings_fare_amount_check
  CHECK (
    fare_amount IS NULL
    OR fare_amount >= 0
  );


-- =========================================================
-- 4. PER-PASSENGER SEAT / BERTH SNAPSHOT
-- =========================================================

ALTER TABLE booking_passengers
  ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20)
    NOT NULL DEFAULT 'SEAT',
  ADD COLUMN IF NOT EXISTS seat_layout_id INTEGER,
  ADD COLUMN IF NOT EXISTS seat_type VARCHAR(40),
  ADD COLUMN IF NOT EXISTS deck VARCHAR(20),
  ADD COLUMN IF NOT EXISTS berth_group VARCHAR(40),
  ADD COLUMN IF NOT EXISTS sharing_slot INTEGER,
  ADD COLUMN IF NOT EXISTS fare_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10)
    NOT NULL DEFAULT 'INR';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'booking_passengers_seat_layout_id_fkey'
  ) THEN
    ALTER TABLE booking_passengers
      ADD CONSTRAINT
        booking_passengers_seat_layout_id_fkey
      FOREIGN KEY (seat_layout_id)
      REFERENCES seat_layouts(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

ALTER TABLE booking_passengers
  DROP CONSTRAINT IF EXISTS
    booking_passengers_booking_mode_check;

ALTER TABLE booking_passengers
  ADD CONSTRAINT
    booking_passengers_booking_mode_check
  CHECK (
    booking_mode IN (
      'SEAT',
      'PRIVATE',
      'SHARING'
    )
  );

ALTER TABLE booking_passengers
  DROP CONSTRAINT IF EXISTS
    booking_passengers_deck_check;

ALTER TABLE booking_passengers
  ADD CONSTRAINT
    booking_passengers_deck_check
  CHECK (
    deck IS NULL
    OR deck IN (
      'LOWER',
      'UPPER'
    )
  );

ALTER TABLE booking_passengers
  DROP CONSTRAINT IF EXISTS
    booking_passengers_sharing_slot_check;

ALTER TABLE booking_passengers
  ADD CONSTRAINT
    booking_passengers_sharing_slot_check
  CHECK (
    sharing_slot IS NULL
    OR sharing_slot >= 1
  );

ALTER TABLE booking_passengers
  DROP CONSTRAINT IF EXISTS
    booking_passengers_fare_amount_check;

ALTER TABLE booking_passengers
  ADD CONSTRAINT
    booking_passengers_fare_amount_check
  CHECK (
    fare_amount IS NULL
    OR fare_amount >= 0
  );


-- =========================================================
-- 5. SEAT LOCK FOUNDATION
-- Existing journey_id remains unchanged.
-- =========================================================

ALTER TABLE seat_locks
  ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20)
    NOT NULL DEFAULT 'SEAT',
  ADD COLUMN IF NOT EXISTS seat_layout_id INTEGER,
  ADD COLUMN IF NOT EXISTS deck VARCHAR(20),
  ADD COLUMN IF NOT EXISTS berth_group VARCHAR(40),
  ADD COLUMN IF NOT EXISTS sharing_slot INTEGER,
  ADD COLUMN IF NOT EXISTS fare_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS anonymous_session_id VARCHAR(120);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'seat_locks_seat_layout_id_fkey'
  ) THEN
    ALTER TABLE seat_locks
      ADD CONSTRAINT
        seat_locks_seat_layout_id_fkey
      FOREIGN KEY (seat_layout_id)
      REFERENCES seat_layouts(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

ALTER TABLE seat_locks
  DROP CONSTRAINT IF EXISTS
    seat_locks_booking_mode_check;

ALTER TABLE seat_locks
  ADD CONSTRAINT
    seat_locks_booking_mode_check
  CHECK (
    booking_mode IN (
      'SEAT',
      'PRIVATE',
      'SHARING'
    )
  );

ALTER TABLE seat_locks
  DROP CONSTRAINT IF EXISTS
    seat_locks_deck_check;

ALTER TABLE seat_locks
  ADD CONSTRAINT
    seat_locks_deck_check
  CHECK (
    deck IS NULL
    OR deck IN (
      'LOWER',
      'UPPER'
    )
  );

ALTER TABLE seat_locks
  DROP CONSTRAINT IF EXISTS
    seat_locks_sharing_slot_check;

ALTER TABLE seat_locks
  ADD CONSTRAINT
    seat_locks_sharing_slot_check
  CHECK (
    sharing_slot IS NULL
    OR sharing_slot >= 1
  );

ALTER TABLE seat_locks
  DROP CONSTRAINT IF EXISTS
    seat_locks_fare_amount_check;

ALTER TABLE seat_locks
  ADD CONSTRAINT
    seat_locks_fare_amount_check
  CHECK (
    fare_amount IS NULL
    OR fare_amount >= 0
  );


-- =========================================================
-- 6. NORMALIZE EXISTING LEGACY BOOKING DATA
-- =========================================================

UPDATE bookings
SET
  booking_mode = 'SEAT',
  currency_code = 'INR'
WHERE booking_mode IS NULL
   OR currency_code IS NULL;

UPDATE booking_passengers
SET
  booking_mode = 'SEAT',
  currency_code = 'INR'
WHERE booking_mode IS NULL
   OR currency_code IS NULL;

UPDATE seat_locks
SET booking_mode = 'SEAT'
WHERE booking_mode IS NULL;


-- =========================================================
-- 7. INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS
  idx_bookings_schedule_seat_reference
ON bookings (
  schedule_id,
  seat_number,
  booking_status
);

CREATE INDEX IF NOT EXISTS
  idx_bookings_segment
ON bookings (
  schedule_id,
  boarding_stop_id,
  dropping_stop_id
);

CREATE INDEX IF NOT EXISTS
  idx_booking_passengers_seat_reference
ON booking_passengers (
  seat_number
);

CREATE INDEX IF NOT EXISTS
  idx_booking_passengers_inventory
ON booking_passengers (
  booking_id,
  berth_group,
  booking_mode,
  sharing_slot
);

CREATE INDEX IF NOT EXISTS
  idx_seat_locks_schedule_seat_reference
ON seat_locks (
  schedule_id,
  seat_number,
  status,
  expires_at
);

CREATE INDEX IF NOT EXISTS
  idx_seat_locks_berth_inventory
ON seat_locks (
  schedule_id,
  berth_group,
  booking_mode,
  sharing_slot,
  status
);

COMMIT;
