BEGIN;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS gateway_name
    VARCHAR(50),

  ADD COLUMN IF NOT EXISTS gateway_order_id
    VARCHAR(150),

  ADD COLUMN IF NOT EXISTS gateway_payment_id
    VARCHAR(150),

  ADD COLUMN IF NOT EXISTS gateway_signature
    TEXT,

  ADD COLUMN IF NOT EXISTS gateway_status
    VARCHAR(50),

  ADD COLUMN IF NOT EXISTS gateway_response
    JSONB,

  ADD COLUMN IF NOT EXISTS verified_at
    TIMESTAMP WITHOUT TIME ZONE,

  ADD COLUMN IF NOT EXISTS updated_at
    TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS
  payments_gateway_order_uidx
ON payments (
  gateway_name,
  gateway_order_id
)
WHERE gateway_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  payments_gateway_payment_uidx
ON payments (
  gateway_name,
  gateway_payment_id
)
WHERE gateway_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_payments_gateway_status
ON payments (
  gateway_name,
  gateway_status,
  created_at DESC
);

COMMIT;
