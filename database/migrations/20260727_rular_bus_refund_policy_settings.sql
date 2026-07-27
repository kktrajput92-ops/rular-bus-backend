BEGIN;

CREATE TABLE IF NOT EXISTS refund_policy_settings (
  id BIGSERIAL PRIMARY KEY,

  policy_code VARCHAR(60) NOT NULL,
  policy_name VARCHAR(150) NOT NULL,

  automatic_refund_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  default_charge_mode VARCHAR(30)
    NOT NULL DEFAULT 'POLICY_CHARGE',

  allow_no_charge_override BOOLEAN
    NOT NULL DEFAULT TRUE,

  allow_custom_charge_override BOOLEAN
    NOT NULL DEFAULT TRUE,

  automatic_refund_processing_mode VARCHAR(30)
    NOT NULL DEFAULT 'GATEWAY',

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_by_user_id BIGINT,
  updated_by_user_id BIGINT,

  created_at TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP WITHOUT TIME ZONE
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT refund_policy_settings_policy_code_key
    UNIQUE (policy_code),

  CONSTRAINT refund_policy_settings_charge_mode_check
    CHECK (
      default_charge_mode IN (
        'POLICY_CHARGE',
        'NO_CHARGE',
        'CUSTOM_CHARGE'
      )
    ),

  CONSTRAINT refund_policy_settings_processing_mode_check
    CHECK (
      automatic_refund_processing_mode IN (
        'GATEWAY'
      )
    )
);

COMMENT ON TABLE refund_policy_settings IS
  'Configuration for the Rular Bus Cancellation Policy and automatic refund behavior.';

COMMENT ON COLUMN refund_policy_settings.automatic_refund_enabled IS
  'When true, eligible customer cancellations initiate a system gateway refund without human approval.';

COMMENT ON COLUMN refund_policy_settings.default_charge_mode IS
  'Default Rular Bus Cancellation Policy charge mode.';

INSERT INTO refund_policy_settings (
  policy_code,
  policy_name,
  automatic_refund_enabled,
  default_charge_mode,
  allow_no_charge_override,
  allow_custom_charge_override,
  automatic_refund_processing_mode,
  is_active
)
VALUES (
  'RULAR_BUS_CANCELLATION_POLICY',
  'Rular Bus Cancellation Policy',
  FALSE,
  'POLICY_CHARGE',
  TRUE,
  TRUE,
  'GATEWAY',
  TRUE
)
ON CONFLICT (policy_code)
DO UPDATE SET
  policy_name = EXCLUDED.policy_name,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO permissions (
  permission_code,
  permission_name,
  module_name,
  status
)
VALUES
  (
    'refund.manual_process',
    'Process Manual Refunds',
    'Refund Management',
    'ACTIVE'
  ),
  (
    'refund.configure_auto',
    'Configure Automatic Refunds',
    'Refund Management',
    'ACTIVE'
  )
ON CONFLICT (permission_code)
DO UPDATE SET
  permission_name = EXCLUDED.permission_name,
  module_name = EXCLUDED.module_name,
  status = 'ACTIVE';

INSERT INTO role_permissions (
  role_id,
  permission_id
)
SELECT
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'SUPER_ADMIN'
  AND r.status = 'ACTIVE'
  AND p.permission_code IN (
    'refund.manual_process',
    'refund.configure_auto'
  )
  AND p.status = 'ACTIVE'
ON CONFLICT (role_id, permission_id)
DO NOTHING;

COMMIT;
