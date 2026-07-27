BEGIN;

CREATE TABLE IF NOT EXISTS booking_cancellations (
  id BIGSERIAL PRIMARY KEY,

  booking_id INTEGER NOT NULL
    REFERENCES bookings(id)
    ON DELETE CASCADE,

  customer_profile_id INTEGER
    REFERENCES customer_profiles(id)
    ON DELETE SET NULL,

  cancellation_number VARCHAR(40)
    NOT NULL
    UNIQUE,

  cancelled_by_type VARCHAR(20)
    NOT NULL
    DEFAULT 'CUSTOMER',

  cancelled_by_id BIGINT,

  reason_code VARCHAR(50)
    NOT NULL,

  reason_text TEXT,

  booking_amount NUMERIC(10,2)
    NOT NULL
    DEFAULT 0,

  cancellation_charge NUMERIC(10,2)
    NOT NULL
    DEFAULT 0,

  refund_percentage NUMERIC(5,2)
    NOT NULL
    DEFAULT 0,

  refundable_amount NUMERIC(10,2)
    NOT NULL
    DEFAULT 0,

  currency_code VARCHAR(10)
    NOT NULL
    DEFAULT 'INR',

  policy_code VARCHAR(50)
    NOT NULL,

  departure_time TIMESTAMP
    NOT NULL,

  hours_before_departure NUMERIC(10,2)
    NOT NULL,

  cancellation_status VARCHAR(30)
    NOT NULL
    DEFAULT 'CONFIRMED',

  request_ip VARCHAR(100),

  user_agent TEXT,

  cancelled_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  created_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT booking_cancellations_actor_check
    CHECK (
      cancelled_by_type IN (
        'CUSTOMER',
        'ADMIN',
        'SYSTEM'
      )
    ),

  CONSTRAINT booking_cancellations_status_check
    CHECK (
      cancellation_status IN (
        'REQUESTED',
        'CONFIRMED',
        'REJECTED',
        'REVERSED'
      )
    ),

  CONSTRAINT booking_cancellations_amount_check
    CHECK (
      booking_amount >= 0
      AND cancellation_charge >= 0
      AND refundable_amount >= 0
    ),

  CONSTRAINT booking_cancellations_percentage_check
    CHECK (
      refund_percentage >= 0
      AND refund_percentage <= 100
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  booking_cancellations_one_active_per_booking_idx
ON booking_cancellations (booking_id)
WHERE cancellation_status IN (
  'REQUESTED',
  'CONFIRMED'
);

CREATE INDEX IF NOT EXISTS
  idx_booking_cancellations_customer
ON booking_cancellations (
  customer_profile_id,
  cancelled_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_booking_cancellations_booking
ON booking_cancellations (booking_id);


CREATE TABLE IF NOT EXISTS refund_requests (
  id BIGSERIAL PRIMARY KEY,

  refund_number VARCHAR(40)
    NOT NULL
    UNIQUE,

  booking_id INTEGER NOT NULL
    REFERENCES bookings(id)
    ON DELETE CASCADE,

  cancellation_id BIGINT NOT NULL
    REFERENCES booking_cancellations(id)
    ON DELETE CASCADE,

  customer_profile_id INTEGER
    REFERENCES customer_profiles(id)
    ON DELETE SET NULL,

  payment_id INTEGER
    REFERENCES payments(id)
    ON DELETE SET NULL,

  original_payment_amount NUMERIC(10,2)
    NOT NULL
    DEFAULT 0,

  refund_amount NUMERIC(10,2)
    NOT NULL
    DEFAULT 0,

  currency_code VARCHAR(10)
    NOT NULL
    DEFAULT 'INR',

  refund_method VARCHAR(30),

  refund_status VARCHAR(30)
    NOT NULL
    DEFAULT 'PENDING',

  gateway_refund_id VARCHAR(150),

  gateway_response JSONB,

  failure_reason TEXT,

  requested_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  processing_started_at TIMESTAMP,

  completed_at TIMESTAMP,

  failed_at TIMESTAMP,

  created_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT refund_requests_status_check
    CHECK (
      refund_status IN (
        'NOT_REQUIRED',
        'PENDING',
        'PROCESSING',
        'SUCCESS',
        'FAILED',
        'REJECTED'
      )
    ),

  CONSTRAINT refund_requests_amount_check
    CHECK (
      original_payment_amount >= 0
      AND refund_amount >= 0
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  refund_requests_one_active_per_booking_idx
ON refund_requests (booking_id)
WHERE refund_status IN (
  'PENDING',
  'PROCESSING',
  'SUCCESS'
);

CREATE INDEX IF NOT EXISTS
  idx_refund_requests_customer
ON refund_requests (
  customer_profile_id,
  requested_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_refund_requests_cancellation
ON refund_requests (cancellation_id);

CREATE INDEX IF NOT EXISTS
  idx_refund_requests_payment
ON refund_requests (payment_id);


ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS
    ticket_status VARCHAR(20)
    NOT NULL
    DEFAULT 'ACTIVE';

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS
    cancelled_at TIMESTAMP;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS
    cancellation_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'tickets_ticket_status_check'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT
        tickets_ticket_status_check
      CHECK (
        ticket_status IN (
          'ACTIVE',
          'CANCELLED',
          'USED',
          'EXPIRED'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'tickets_cancellation_id_fkey'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT
        tickets_cancellation_id_fkey
      FOREIGN KEY (cancellation_id)
      REFERENCES booking_cancellations(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS
  idx_tickets_ticket_status
ON tickets (ticket_status);


ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS
    refund_status VARCHAR(30)
    NOT NULL
    DEFAULT 'NOT_REQUESTED';

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS
    refunded_amount NUMERIC(10,2)
    NOT NULL
    DEFAULT 0;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS
    refunded_at TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'payments_refund_status_check'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT
        payments_refund_status_check
      CHECK (
        refund_status IN (
          'NOT_REQUESTED',
          'NOT_REQUIRED',
          'PENDING',
          'PROCESSING',
          'SUCCESS',
          'FAILED',
          'REJECTED'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'payments_refunded_amount_check'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT
        payments_refunded_amount_check
      CHECK (refunded_amount >= 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS
  idx_payments_refund_status
ON payments (refund_status);


ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS
    cancelled_at TIMESTAMP;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS
    cancellation_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'bookings_cancellation_id_fkey'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT
        bookings_cancellation_id_fkey
      FOREIGN KEY (cancellation_id)
      REFERENCES booking_cancellations(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS
  idx_bookings_cancellation_id
ON bookings (cancellation_id);

COMMIT;
