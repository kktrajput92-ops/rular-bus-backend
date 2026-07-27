BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE refund_requests
  ADD COLUMN IF NOT EXISTS approved_refund_amount
    numeric(12,2),

  ADD COLUMN IF NOT EXISTS total_refunded_amount
    numeric(12,2) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS remaining_refund_amount
    numeric(12,2),

  ADD COLUMN IF NOT EXISTS refund_mode
    varchar(40),

  ADD COLUMN IF NOT EXISTS approval_status
    varchar(40) NOT NULL DEFAULT 'NOT_REQUIRED',

  ADD COLUMN IF NOT EXISTS priority
    varchar(20) NOT NULL DEFAULT 'NORMAL',

  ADD COLUMN IF NOT EXISTS assigned_to_user_id
    bigint,

  ADD COLUMN IF NOT EXISTS assigned_team
    varchar(100),

  ADD COLUMN IF NOT EXISTS assigned_at
    timestamp without time zone,

  ADD COLUMN IF NOT EXISTS due_at
    timestamp without time zone,

  ADD COLUMN IF NOT EXISTS sla_status
    varchar(30) NOT NULL DEFAULT 'ON_TIME',

  ADD COLUMN IF NOT EXISTS risk_level
    varchar(20) NOT NULL DEFAULT 'LOW',

  ADD COLUMN IF NOT EXISTS risk_score
    numeric(5,2) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS risk_flags
    jsonb NOT NULL DEFAULT '[]'::jsonb,

  ADD COLUMN IF NOT EXISTS reconciliation_status
    varchar(40) NOT NULL DEFAULT 'NOT_RECONCILED',

  ADD COLUMN IF NOT EXISTS dispute_status
    varchar(40) NOT NULL DEFAULT 'NONE',

  ADD COLUMN IF NOT EXISTS admin_note
    text,

  ADD COLUMN IF NOT EXISTS last_processed_by
    bigint,

  ADD COLUMN IF NOT EXISTS processing_lock_token
    uuid,

  ADD COLUMN IF NOT EXISTS processing_locked_by
    bigint,

  ADD COLUMN IF NOT EXISTS processing_locked_at
    timestamp without time zone,

  ADD COLUMN IF NOT EXISTS processing_lock_expires_at
    timestamp without time zone,

  ADD COLUMN IF NOT EXISTS retry_count
    integer NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS version
    integer NOT NULL DEFAULT 1,

  ADD COLUMN IF NOT EXISTS approved_at
    timestamp without time zone,

  ADD COLUMN IF NOT EXISTS rejected_at
    timestamp without time zone,

  ADD COLUMN IF NOT EXISTS last_activity_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE refund_requests
SET
  approved_refund_amount =
    COALESCE(
      approved_refund_amount,
      refund_amount,
      0
    ),

  total_refunded_amount =
    CASE
      WHEN refund_status = 'SUCCESS'
        THEN COALESCE(refund_amount, 0)
      ELSE COALESCE(
        total_refunded_amount,
        0
      )
    END,

  remaining_refund_amount =
    GREATEST(
      COALESCE(
        approved_refund_amount,
        refund_amount,
        0
      ) -
      CASE
        WHEN refund_status = 'SUCCESS'
          THEN COALESCE(refund_amount, 0)
        ELSE COALESCE(
          total_refunded_amount,
          0
        )
      END,
      0
    ),

  refund_mode =
    COALESCE(
      refund_mode,
      'FULL'
    ),

  last_activity_at =
    COALESCE(
      last_activity_at,
      updated_at,
      requested_at,
      CURRENT_TIMESTAMP
    );

ALTER TABLE refund_requests
  ALTER COLUMN approved_refund_amount
    SET NOT NULL,

  ALTER COLUMN remaining_refund_amount
    SET NOT NULL,

  ALTER COLUMN refund_mode
    SET NOT NULL;

ALTER TABLE refund_requests
  DROP CONSTRAINT IF EXISTS
    refund_requests_status_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_amount_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_refund_mode_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_balance_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_approval_status_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_priority_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_sla_status_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_risk_level_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_reconciliation_status_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_dispute_status_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_retry_count_check,

  DROP CONSTRAINT IF EXISTS
    refund_requests_version_check;

ALTER TABLE refund_requests
  ADD CONSTRAINT
    refund_requests_status_check
  CHECK (
    refund_status IN (
      'NOT_REQUIRED',
      'PENDING',
      'APPROVAL_REQUIRED',
      'APPROVED',
      'ASSIGNED',
      'PROCESSING',
      'PARTIALLY_REFUNDED',
      'SUCCESS',
      'FAILED',
      'REJECTED',
      'DISPUTED',
      'UNDER_REVIEW',
      'RESOLVED'
    )
  ),

  ADD CONSTRAINT
    refund_requests_amount_check
  CHECK (
    original_payment_amount >= 0
    AND refund_amount >= 0
    AND approved_refund_amount >= 0
    AND total_refunded_amount >= 0
    AND remaining_refund_amount >= 0
  ),

  ADD CONSTRAINT
    refund_requests_balance_check
  CHECK (
    total_refunded_amount
      <= approved_refund_amount
    AND remaining_refund_amount
      = approved_refund_amount
        - total_refunded_amount
  ),

  ADD CONSTRAINT
    refund_requests_refund_mode_check
  CHECK (
    refund_mode IN (
      'FULL',
      'PARTIAL_PERCENTAGE',
      'CUSTOM_AMOUNT',
      'NO_REFUND'
    )
  ),

  ADD CONSTRAINT
    refund_requests_approval_status_check
  CHECK (
    approval_status IN (
      'NOT_REQUIRED',
      'PENDING',
      'APPROVED',
      'REJECTED',
      'CANCELLED'
    )
  ),

  ADD CONSTRAINT
    refund_requests_priority_check
  CHECK (
    priority IN (
      'LOW',
      'NORMAL',
      'HIGH',
      'URGENT'
    )
  ),

  ADD CONSTRAINT
    refund_requests_sla_status_check
  CHECK (
    sla_status IN (
      'ON_TIME',
      'DUE_SOON',
      'OVERDUE',
      'PAUSED',
      'COMPLETED'
    )
  ),

  ADD CONSTRAINT
    refund_requests_risk_level_check
  CHECK (
    risk_level IN (
      'LOW',
      'MEDIUM',
      'HIGH',
      'CRITICAL'
    )
  ),

  ADD CONSTRAINT
    refund_requests_reconciliation_status_check
  CHECK (
    reconciliation_status IN (
      'NOT_RECONCILED',
      'PENDING',
      'MATCHED',
      'AMOUNT_MISMATCH',
      'REFERENCE_MISSING',
      'MANUAL_REVIEW'
    )
  ),

  ADD CONSTRAINT
    refund_requests_dispute_status_check
  CHECK (
    dispute_status IN (
      'NONE',
      'OPEN',
      'UNDER_REVIEW',
      'RESOLVED',
      'REJECTED'
    )
  ),

  ADD CONSTRAINT
    refund_requests_retry_count_check
  CHECK (
    retry_count >= 0
  ),

  ADD CONSTRAINT
    refund_requests_version_check
  CHECK (
    version >= 1
  );

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS
    payments_refund_status_check;

ALTER TABLE payments
  ADD CONSTRAINT
    payments_refund_status_check
  CHECK (
    refund_status IN (
      'NOT_REQUESTED',
      'NOT_REQUIRED',
      'PENDING',
      'APPROVAL_REQUIRED',
      'APPROVED',
      'PROCESSING',
      'PARTIALLY_REFUNDED',
      'SUCCESS',
      'FAILED',
      'REJECTED',
      'DISPUTED'
    )
  );

CREATE TABLE IF NOT EXISTS
refund_transactions (
  id bigserial PRIMARY KEY,

  transaction_number
    varchar(50) NOT NULL UNIQUE,

  refund_request_id
    bigint NOT NULL
    REFERENCES refund_requests(id)
    ON DELETE CASCADE,

  booking_id
    integer NOT NULL
    REFERENCES bookings(id)
    ON DELETE CASCADE,

  payment_id
    integer
    REFERENCES payments(id)
    ON DELETE SET NULL,

  attempt_number
    integer NOT NULL DEFAULT 1,

  refund_type
    varchar(40) NOT NULL,

  percentage
    numeric(6,2),

  requested_amount
    numeric(12,2) NOT NULL,

  refund_amount
    numeric(12,2) NOT NULL,

  currency_code
    varchar(10) NOT NULL DEFAULT 'INR',

  transaction_status
    varchar(40) NOT NULL DEFAULT 'PENDING',

  processing_mode
    varchar(30) NOT NULL DEFAULT 'MANUAL',

  refund_method
    varchar(40),

  gateway_name
    varchar(100),

  gateway_payment_id
    varchar(150),

  gateway_refund_id
    varchar(150),

  gateway_status
    varchar(100),

  gateway_fee
    numeric(12,2) NOT NULL DEFAULT 0,

  gateway_response
    jsonb,

  bank_reference
    varchar(150),

  failure_code
    varchar(100),

  failure_reason
    text,

  retry_of_transaction_id
    bigint
    REFERENCES refund_transactions(id)
    ON DELETE SET NULL,

  idempotency_key
    varchar(150) NOT NULL UNIQUE,

  processed_by_user_id
    bigint,

  approved_by_user_id
    bigint,

  admin_note
    text,

  request_ip
    varchar(100),

  user_agent
    text,

  initiated_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  processing_started_at
    timestamp without time zone,

  processed_at
    timestamp without time zone,

  completed_at
    timestamp without time zone,

  failed_at
    timestamp without time zone,

  created_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT
    refund_transactions_type_check
  CHECK (
    refund_type IN (
      'FULL',
      'PARTIAL_PERCENTAGE',
      'CUSTOM_AMOUNT',
      'OVERRIDE'
    )
  ),

  CONSTRAINT
    refund_transactions_status_check
  CHECK (
    transaction_status IN (
      'PENDING',
      'APPROVAL_REQUIRED',
      'APPROVED',
      'PROCESSING',
      'SUCCESS',
      'FAILED',
      'REJECTED',
      'CANCELLED',
      'REVERSED'
    )
  ),

  CONSTRAINT
    refund_transactions_processing_mode_check
  CHECK (
    processing_mode IN (
      'MANUAL',
      'GATEWAY',
      'BANK_TRANSFER',
      'UPI',
      'WALLET',
      'CASH'
    )
  ),

  CONSTRAINT
    refund_transactions_amount_check
  CHECK (
    requested_amount > 0
    AND refund_amount > 0
    AND gateway_fee >= 0
  ),

  CONSTRAINT
    refund_transactions_percentage_check
  CHECK (
    percentage IS NULL
    OR (
      percentage > 0
      AND percentage <= 100
    )
  ),

  CONSTRAINT
    refund_transactions_attempt_check
  CHECK (
    attempt_number >= 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS
refund_transactions_gateway_refund_uidx
ON refund_transactions (
  gateway_name,
  gateway_refund_id
)
WHERE gateway_refund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
idx_refund_transactions_request
ON refund_transactions (
  refund_request_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
idx_refund_transactions_booking
ON refund_transactions (
  booking_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
idx_refund_transactions_status
ON refund_transactions (
  transaction_status,
  created_at DESC
);

CREATE TABLE IF NOT EXISTS
refund_approvals (
  id bigserial PRIMARY KEY,

  refund_request_id
    bigint NOT NULL
    REFERENCES refund_requests(id)
    ON DELETE CASCADE,

  refund_transaction_id
    bigint
    REFERENCES refund_transactions(id)
    ON DELETE SET NULL,

  approval_level
    integer NOT NULL DEFAULT 1,

  approval_role
    varchar(100),

  requested_by_user_id
    bigint,

  approver_user_id
    bigint,

  approval_status
    varchar(30) NOT NULL DEFAULT 'PENDING',

  requested_amount
    numeric(12,2) NOT NULL,

  approved_amount
    numeric(12,2),

  request_reason
    text,

  decision_note
    text,

  requested_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  decided_at
    timestamp without time zone,

  created_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT
    refund_approvals_status_check
  CHECK (
    approval_status IN (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
      'EXPIRED'
    )
  ),

  CONSTRAINT
    refund_approvals_amount_check
  CHECK (
    requested_amount > 0
    AND (
      approved_amount IS NULL
      OR approved_amount >= 0
    )
  ),

  CONSTRAINT
    refund_approvals_level_check
  CHECK (
    approval_level >= 1
  )
);

CREATE INDEX IF NOT EXISTS
idx_refund_approvals_request
ON refund_approvals (
  refund_request_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
idx_refund_approvals_pending
ON refund_approvals (
  approval_status,
  requested_at
)
WHERE approval_status = 'PENDING';

CREATE TABLE IF NOT EXISTS
refund_activity_log (
  id bigserial PRIMARY KEY,

  refund_request_id
    bigint NOT NULL
    REFERENCES refund_requests(id)
    ON DELETE CASCADE,

  refund_transaction_id
    bigint
    REFERENCES refund_transactions(id)
    ON DELETE SET NULL,

  activity_type
    varchar(80) NOT NULL,

  from_status
    varchar(40),

  to_status
    varchar(40),

  actor_type
    varchar(30) NOT NULL DEFAULT 'ADMIN',

  actor_id
    bigint,

  title
    varchar(200) NOT NULL,

  description
    text,

  metadata
    jsonb NOT NULL DEFAULT '{}'::jsonb,

  request_ip
    varchar(100),

  user_agent
    text,

  created_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS
idx_refund_activity_request
ON refund_activity_log (
  refund_request_id,
  created_at DESC
);

CREATE TABLE IF NOT EXISTS
refund_comments (
  id bigserial PRIMARY KEY,

  refund_request_id
    bigint NOT NULL
    REFERENCES refund_requests(id)
    ON DELETE CASCADE,

  parent_comment_id
    bigint
    REFERENCES refund_comments(id)
    ON DELETE CASCADE,

  comment_type
    varchar(30) NOT NULL DEFAULT 'INTERNAL',

  comment_text
    text NOT NULL,

  mentioned_user_ids
    jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_by_user_id
    bigint,

  is_edited
    boolean NOT NULL DEFAULT false,

  created_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT
    refund_comments_type_check
  CHECK (
    comment_type IN (
      'INTERNAL',
      'CUSTOMER_VISIBLE',
      'SYSTEM'
    )
  )
);

CREATE INDEX IF NOT EXISTS
idx_refund_comments_request
ON refund_comments (
  refund_request_id,
  created_at DESC
);

CREATE TABLE IF NOT EXISTS
refund_attachments (
  id bigserial PRIMARY KEY,

  refund_request_id
    bigint NOT NULL
    REFERENCES refund_requests(id)
    ON DELETE CASCADE,

  refund_transaction_id
    bigint
    REFERENCES refund_transactions(id)
    ON DELETE SET NULL,

  attachment_type
    varchar(50) NOT NULL,

  original_filename
    varchar(255) NOT NULL,

  stored_filename
    varchar(255) NOT NULL,

  file_path
    text NOT NULL,

  mime_type
    varchar(150),

  file_size_bytes
    bigint,

  checksum_sha256
    varchar(64),

  uploaded_by_user_id
    bigint,

  created_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT
    refund_attachments_type_check
  CHECK (
    attachment_type IN (
      'REFUND_PROOF',
      'BANK_RECEIPT',
      'CUSTOMER_DOCUMENT',
      'APPROVAL_DOCUMENT',
      'DISPUTE_DOCUMENT',
      'OTHER'
    )
  ),

  CONSTRAINT
    refund_attachments_size_check
  CHECK (
    file_size_bytes IS NULL
    OR file_size_bytes >= 0
  )
);

CREATE INDEX IF NOT EXISTS
idx_refund_attachments_request
ON refund_attachments (
  refund_request_id,
  created_at DESC
);

CREATE TABLE IF NOT EXISTS
refund_disputes (
  id bigserial PRIMARY KEY,

  dispute_number
    varchar(50) NOT NULL UNIQUE,

  refund_request_id
    bigint NOT NULL
    REFERENCES refund_requests(id)
    ON DELETE CASCADE,

  customer_profile_id
    integer
    REFERENCES customer_profiles(id)
    ON DELETE SET NULL,

  dispute_type
    varchar(50) NOT NULL,

  dispute_status
    varchar(40) NOT NULL DEFAULT 'OPEN',

  customer_statement
    text,

  admin_response
    text,

  resolution_type
    varchar(50),

  resolution_note
    text,

  assigned_to_user_id
    bigint,

  opened_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  resolved_at
    timestamp without time zone,

  created_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT
    refund_disputes_status_check
  CHECK (
    dispute_status IN (
      'OPEN',
      'UNDER_REVIEW',
      'WAITING_CUSTOMER',
      'RESOLVED',
      'REJECTED',
      'CLOSED'
    )
  )
);

CREATE INDEX IF NOT EXISTS
idx_refund_disputes_request
ON refund_disputes (
  refund_request_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
idx_refund_disputes_status
ON refund_disputes (
  dispute_status,
  opened_at
);

CREATE TABLE IF NOT EXISTS
refund_reconciliations (
  id bigserial PRIMARY KEY,

  refund_request_id
    bigint NOT NULL
    REFERENCES refund_requests(id)
    ON DELETE CASCADE,

  refund_transaction_id
    bigint
    REFERENCES refund_transactions(id)
    ON DELETE SET NULL,

  reconciliation_date
    date NOT NULL DEFAULT CURRENT_DATE,

  expected_amount
    numeric(12,2) NOT NULL,

  settled_amount
    numeric(12,2),

  currency_code
    varchar(10) NOT NULL DEFAULT 'INR',

  gateway_name
    varchar(100),

  gateway_reference
    varchar(150),

  bank_reference
    varchar(150),

  reconciliation_status
    varchar(40) NOT NULL DEFAULT 'PENDING',

  mismatch_amount
    numeric(12,2),

  note
    text,

  reconciled_by_user_id
    bigint,

  reconciled_at
    timestamp without time zone,

  created_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT
    refund_reconciliations_status_check
  CHECK (
    reconciliation_status IN (
      'PENDING',
      'MATCHED',
      'AMOUNT_MISMATCH',
      'REFERENCE_MISSING',
      'MANUAL_REVIEW',
      'RESOLVED'
    )
  ),

  CONSTRAINT
    refund_reconciliations_amount_check
  CHECK (
    expected_amount >= 0
    AND (
      settled_amount IS NULL
      OR settled_amount >= 0
    )
  )
);

CREATE INDEX IF NOT EXISTS
idx_refund_reconciliations_request
ON refund_reconciliations (
  refund_request_id,
  reconciliation_date DESC
);

CREATE TABLE IF NOT EXISTS
refund_notifications (
  id bigserial PRIMARY KEY,

  refund_request_id
    bigint NOT NULL
    REFERENCES refund_requests(id)
    ON DELETE CASCADE,

  refund_transaction_id
    bigint
    REFERENCES refund_transactions(id)
    ON DELETE SET NULL,

  customer_profile_id
    integer
    REFERENCES customer_profiles(id)
    ON DELETE SET NULL,

  channel
    varchar(30) NOT NULL,

  template_code
    varchar(100) NOT NULL,

  recipient
    varchar(255),

  subject
    varchar(255),

  message_body
    text NOT NULL,

  notification_status
    varchar(30) NOT NULL DEFAULT 'PENDING',

  provider_reference
    varchar(150),

  provider_response
    jsonb,

  attempt_count
    integer NOT NULL DEFAULT 0,

  scheduled_at
    timestamp without time zone,

  sent_at
    timestamp without time zone,

  failed_at
    timestamp without time zone,

  failure_reason
    text,

  created_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at
    timestamp without time zone
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT
    refund_notifications_channel_check
  CHECK (
    channel IN (
      'IN_APP',
      'EMAIL',
      'SMS',
      'WHATSAPP'
    )
  ),

  CONSTRAINT
    refund_notifications_status_check
  CHECK (
    notification_status IN (
      'PENDING',
      'PROCESSING',
      'SENT',
      'FAILED',
      'CANCELLED'
    )
  ),

  CONSTRAINT
    refund_notifications_attempt_check
  CHECK (
    attempt_count >= 0
  )
);

CREATE INDEX IF NOT EXISTS
idx_refund_notifications_pending
ON refund_notifications (
  notification_status,
  scheduled_at,
  created_at
)
WHERE notification_status = 'PENDING';

DROP INDEX IF EXISTS
refund_requests_one_active_per_booking_idx;

CREATE UNIQUE INDEX
refund_requests_one_active_per_booking_idx
ON refund_requests (booking_id)
WHERE refund_status IN (
  'PENDING',
  'APPROVAL_REQUIRED',
  'APPROVED',
  'ASSIGNED',
  'PROCESSING',
  'PARTIALLY_REFUNDED',
  'SUCCESS',
  'DISPUTED',
  'UNDER_REVIEW'
);

CREATE INDEX IF NOT EXISTS
idx_refund_requests_operations_queue
ON refund_requests (
  refund_status,
  priority,
  due_at,
  requested_at
);

CREATE INDEX IF NOT EXISTS
idx_refund_requests_assignment
ON refund_requests (
  assigned_to_user_id,
  refund_status,
  requested_at DESC
);

CREATE INDEX IF NOT EXISTS
idx_refund_requests_sla
ON refund_requests (
  sla_status,
  due_at
);

CREATE INDEX IF NOT EXISTS
idx_refund_requests_risk
ON refund_requests (
  risk_level,
  risk_score DESC
);

CREATE INDEX IF NOT EXISTS
idx_refund_requests_reconciliation
ON refund_requests (
  reconciliation_status,
  updated_at DESC
);

INSERT INTO refund_activity_log (
  refund_request_id,
  activity_type,
  actor_type,
  title,
  description,
  metadata
)
SELECT
  rr.id,
  'MIGRATION_BASELINE',
  'SYSTEM',
  'Enterprise refund workflow initialized',
  'Existing refund request migrated to the enterprise refund architecture.',
  jsonb_build_object(
    'refund_number',
      rr.refund_number,
    'approved_refund_amount',
      rr.approved_refund_amount,
    'total_refunded_amount',
      rr.total_refunded_amount,
    'remaining_refund_amount',
      rr.remaining_refund_amount,
    'refund_status',
      rr.refund_status
  )
FROM refund_requests rr
WHERE NOT EXISTS (
  SELECT 1
  FROM refund_activity_log ral
  WHERE
    ral.refund_request_id = rr.id
    AND ral.activity_type =
      'MIGRATION_BASELINE'
);

COMMIT;
