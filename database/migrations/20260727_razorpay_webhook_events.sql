BEGIN;

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGSERIAL PRIMARY KEY,

  gateway_name VARCHAR(50) NOT NULL,
  gateway_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  processing_status VARCHAR(30) NOT NULL
    DEFAULT 'RECEIVED',

  payload JSONB NOT NULL,

  signature_verified BOOLEAN NOT NULL
    DEFAULT FALSE,

  attempt_count INTEGER NOT NULL
    DEFAULT 1,

  payment_id INTEGER,
  booking_id INTEGER,

  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  gateway_refund_id VARCHAR(255),

  error_message TEXT,

  received_at TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  processed_at TIMESTAMP WITHOUT TIME ZONE,

  updated_at TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT payment_webhook_events_gateway_event_unique
    UNIQUE (
      gateway_name,
      gateway_event_id
    ),

  CONSTRAINT payment_webhook_events_status_check
    CHECK (
      processing_status IN (
        'RECEIVED',
        'PROCESSING',
        'PROCESSED',
        'IGNORED',
        'FAILED'
      )
    ),

  CONSTRAINT payment_webhook_events_payment_fkey
    FOREIGN KEY (payment_id)
    REFERENCES payments(id)
    ON DELETE SET NULL,

  CONSTRAINT payment_webhook_events_booking_fkey
    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS
  idx_payment_webhook_events_type
ON payment_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS
  idx_payment_webhook_events_status
ON payment_webhook_events(processing_status);

CREATE INDEX IF NOT EXISTS
  idx_payment_webhook_events_received_at
ON payment_webhook_events(received_at DESC);

CREATE INDEX IF NOT EXISTS
  idx_payment_webhook_events_gateway_order
ON payment_webhook_events(gateway_order_id);

CREATE INDEX IF NOT EXISTS
  idx_payment_webhook_events_gateway_payment
ON payment_webhook_events(gateway_payment_id);

CREATE INDEX IF NOT EXISTS
  idx_payment_webhook_events_gateway_refund
ON payment_webhook_events(gateway_refund_id);

COMMIT;
