const crypto = require("crypto");
const pool = require("../config/db");

const REFUND_MODES = new Set([
  "FULL",
  "PARTIAL_PERCENTAGE",
  "CUSTOM_AMOUNT",
]);

const PROCESSING_MODES = new Set([
  "MANUAL",
  "GATEWAY",
  "BANK_TRANSFER",
  "UPI",
  "WALLET",
  "CASH",
]);

const TERMINAL_STATUSES = new Set([
  "SUCCESS",
  "REJECTED",
  "RESOLVED",
]);

const toPositiveInteger = (value) => {
  const number = Number(value);

  return Number.isInteger(number) &&
    number > 0
    ? number
    : null;
};

const toMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.round(
    (number + Number.EPSILON) * 100
  ) / 100;
};

const normalizeUpper = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const createTransactionNumber = () =>
  `RFT${Date.now()}${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;

const getAdminId = (req) =>
  toPositiveInteger(req.user?.id);

const getRoleId = (req) =>
  toPositiveInteger(req.user?.role_id);

const getRequestMeta = (req) => ({
  requestIp:
    req.ip ||
    req.socket?.remoteAddress ||
    null,

  userAgent:
    req.get("user-agent") || null,
});

const hasRolePermission = async (
  client,
  roleId,
  permissionCode
) => {
  const result = await client.query(
    `
      SELECT 1
      FROM role_permissions rp
      INNER JOIN permissions p
        ON p.id = rp.permission_id
      WHERE
        rp.role_id = $1
        AND p.permission_code = $2
        AND p.status = 'ACTIVE'
      LIMIT 1
    `,
    [roleId, permissionCode]
  );

  return result.rows.length > 0;
};

const requireExtraPermission = async (
  client,
  roleId,
  permissionCode
) => {
  const allowed =
    await hasRolePermission(
      client,
      roleId,
      permissionCode
    );

  if (!allowed) {
    const error = new Error(
      `Permission required: ${permissionCode}`
    );

    error.status = 403;
    throw error;
  }
};

const addActivity = async (
  client,
  {
    refundRequestId,
    refundTransactionId = null,
    activityType,
    fromStatus = null,
    toStatus = null,
    actorId,
    title,
    description = null,
    metadata = {},
    requestIp = null,
    userAgent = null,
  }
) => {
  await client.query(
    `
      INSERT INTO refund_activity_log (
        refund_request_id,
        refund_transaction_id,
        activity_type,
        from_status,
        to_status,
        actor_type,
        actor_id,
        title,
        description,
        metadata,
        request_ip,
        user_agent
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        'ADMIN',
        $6,
        $7,
        $8,
        $9::jsonb,
        $10,
        $11
      )
    `,
    [
      refundRequestId,
      refundTransactionId,
      activityType,
      fromStatus,
      toStatus,
      actorId,
      title,
      description,
      JSON.stringify(metadata),
      requestIp,
      userAgent,
    ]
  );
};

const queueNotification = async (
  client,
  {
    refundRequestId,
    refundTransactionId = null,
    customerProfileId = null,
    templateCode,
    messageBody,
  }
) => {
  await client.query(
    `
      INSERT INTO refund_notifications (
        refund_request_id,
        refund_transaction_id,
        customer_profile_id,
        channel,
        template_code,
        message_body,
        notification_status,
        scheduled_at
      )
      VALUES (
        $1,
        $2,
        $3,
        'IN_APP',
        $4,
        $5,
        'PENDING',
        CURRENT_TIMESTAMP
      )
    `,
    [
      refundRequestId,
      refundTransactionId,
      customerProfileId,
      templateCode,
      messageBody,
    ]
  );
};


const assertRefundApprovalAuthority = async (
  client,
  {
    adminId,
    refundId,
    transactionId,
  }
) => {
  const approvalResult =
    await client.query(
      `
        SELECT
          ra.id,
          ra.approval_level,
          UPPER(
            TRIM(ra.approval_role)
          ) AS approval_role,
          ra.approval_status
        FROM refund_approvals ra
        WHERE
          ra.refund_request_id = $1
          AND ra.refund_transaction_id = $2
          AND ra.approval_status =
            'PENDING'
        FOR UPDATE
      `,
      [
        refundId,
        transactionId,
      ]
    );

  if (!approvalResult.rows.length) {
    const error = new Error(
      "Pending approval record not found."
    );

    error.status = 409;
    throw error;
  }

  const approval =
    approvalResult.rows[0];

  const requiredRole =
    normalizeUpper(
      approval.approval_role
    );

  if (!requiredRole) {
    const error = new Error(
      "Refund approval role is not configured."
    );

    error.status = 409;
    throw error;
  }

  const userResult =
    await client.query(
      `
        SELECT
          u.id,
          u.status AS user_status,
          r.id AS role_id,
          UPPER(
            TRIM(r.role_code)
          ) AS role_code,
          r.status AS role_status,

          EXISTS (
            SELECT 1
            FROM role_permissions rp
            INNER JOIN permissions p
              ON p.id =
                rp.permission_id
            WHERE
              rp.role_id = r.id
              AND p.permission_code =
                'refund.override'
              AND p.status = 'ACTIVE'
          ) AS has_refund_override

        FROM users u

        INNER JOIN roles r
          ON r.id = u.role_id

        WHERE u.id = $1
        LIMIT 1
      `,
      [adminId]
    );

  if (!userResult.rows.length) {
    const error = new Error(
      "Approval decision user was not found."
    );

    error.status = 403;
    throw error;
  }

  const user =
    userResult.rows[0];

  if (
    normalizeUpper(
      user.user_status
    ) !== "ACTIVE" ||
    normalizeUpper(
      user.role_status
    ) !== "ACTIVE"
  ) {
    const error = new Error(
      "Inactive users or roles cannot decide refunds."
    );

    error.status = 403;
    throw error;
  }

  const actualRole =
    normalizeUpper(user.role_code);

  const isRequiredRole =
    actualRole === requiredRole;

  const isSuperAdminOverride =
    actualRole === "SUPER_ADMIN" &&
    user.has_refund_override === true;

  if (
    !isRequiredRole &&
    !isSuperAdminOverride
  ) {
    const error = new Error(
      `This refund requires the ${requiredRole} role.`
    );

    error.status = 403;
    throw error;
  }

  return {
    approvalId:
      Number(approval.id),
    approvalLevel:
      Number(approval.approval_level),
    requiredRole,
    actualRole,
    usedOverride:
      isSuperAdminOverride,
  };
};

const calculateApprovalLevel = (
  amount
) => {
  if (amount <= 1000) {
    return 0;
  }

  if (amount <= 5000) {
    return 1;
  }

  return 2;
};

const calculateRefundAmount = ({
  mode,
  percentage,
  customAmount,
  remainingAmount,
}) => {
  if (mode === "FULL") {
    return remainingAmount;
  }

  if (
    mode === "PARTIAL_PERCENTAGE"
  ) {
    const parsedPercentage =
      toMoney(percentage);

    if (
      parsedPercentage === null ||
      parsedPercentage <= 0 ||
      parsedPercentage > 100
    ) {
      const error = new Error(
        "Percentage must be greater than 0 and less than or equal to 100."
      );

      error.status = 400;
      throw error;
    }

    return toMoney(
      remainingAmount *
        (parsedPercentage / 100)
    );
  }

  const parsedCustomAmount =
    toMoney(customAmount);

  if (
    parsedCustomAmount === null ||
    parsedCustomAmount <= 0
  ) {
    const error = new Error(
      "Valid custom refund amount is required."
    );

    error.status = 400;
    throw error;
  }

  return parsedCustomAmount;
};

const requestRefundProcessing = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const refundId =
      toPositiveInteger(req.params.id);

    const adminId = getAdminId(req);
    const roleId = getRoleId(req);

    const refundMode =
      normalizeUpper(
        req.body.refund_mode
      );

    const processingMode =
      normalizeUpper(
        req.body.processing_mode ||
          "MANUAL"
      );

    const percentage =
      req.body.percentage;

    const customAmount =
      req.body.custom_amount;

    const refundMethod =
      normalizeUpper(
        req.body.refund_method || ""
      ) || null;

    const gatewayName =
      String(
        req.body.gateway_name || ""
      ).trim() || null;

    const gatewayPaymentId =
      String(
        req.body.gateway_payment_id ||
          ""
      ).trim() || null;

    const gatewayRefundId =
      String(
        req.body.gateway_refund_id ||
          ""
      ).trim() || null;

    const bankReference =
      String(
        req.body.bank_reference || ""
      ).trim() || null;

    const adminNote =
      String(
        req.body.admin_note || ""
      ).trim() || null;

    const suppliedIdempotencyKey =
      String(
        req.body.idempotency_key ||
          req.get("idempotency-key") ||
          ""
      ).trim();

    const idempotencyKey =
      suppliedIdempotencyKey ||
      crypto.randomUUID();

    if (!refundId) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund request ID is required.",
      });
    }

    if (!adminId || !roleId) {
      return res.status(401).json({
        success: false,
        message:
          "Valid admin session is required.",
      });
    }

    if (
      !REFUND_MODES.has(refundMode)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Refund mode must be FULL, PARTIAL_PERCENTAGE or CUSTOM_AMOUNT.",
      });
    }

    if (
      !PROCESSING_MODES.has(
        processingMode
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid processing mode.",
      });
    }

    if (
      idempotencyKey.length > 150
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Idempotency key is too long.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const duplicateResult =
      await client.query(
        `
          SELECT
            id,
            transaction_number,
            transaction_status,
            refund_amount
          FROM refund_transactions
          WHERE idempotency_key = $1
          LIMIT 1
        `,
        [idempotencyKey]
      );

    if (duplicateResult.rows.length) {
      await client.query("COMMIT");
      transactionStarted = false;

      return res.status(200).json({
        success: true,
        duplicate: true,
        message:
          "This refund operation was already submitted.",
        transaction:
          duplicateResult.rows[0],
      });
    }

    const refundResult =
      await client.query(
        `
          SELECT
            rr.*,
            p.payment_status,
            p.amount AS payment_amount,
            p.refunded_amount,
            p.refund_status
              AS payment_refund_status,
            p.transaction_id
              AS payment_transaction_id
          FROM refund_requests rr
          LEFT JOIN payments p
            ON p.id = rr.payment_id
          WHERE rr.id = $1
          FOR UPDATE OF rr
        `,
        [refundId]
      );

    if (!refundResult.rows.length) {
      const error = new Error(
        "Refund request not found."
      );

      error.status = 404;
      throw error;
    }

    const refund =
      refundResult.rows[0];

    if (
      TERMINAL_STATUSES.has(
        refund.refund_status
      )
    ) {
      const error = new Error(
        `Refund cannot be processed in ${refund.refund_status} status.`
      );

      error.status = 409;
      throw error;
    }

    const remainingAmount =
      toMoney(
        refund.remaining_refund_amount
      );

    if (
      remainingAmount === null ||
      remainingAmount <= 0
    ) {
      const error = new Error(
        "No refundable balance remains."
      );

      error.status = 409;
      throw error;
    }

    if (
      refund.payment_id &&
      String(
        refund.payment_status || ""
      ).toLowerCase() !== "paid"
    ) {
      const error = new Error(
        "Only a paid payment can be refunded."
      );

      error.status = 409;
      throw error;
    }

    if (
      refundMode ===
      "PARTIAL_PERCENTAGE"
    ) {
      await requireExtraPermission(
        client,
        roleId,
        "refund.partial"
      );
    }

    if (
      refundMode === "CUSTOM_AMOUNT"
    ) {
      await requireExtraPermission(
        client,
        roleId,
        "refund.custom"
      );
    }

    const refundAmount =
      calculateRefundAmount({
        mode: refundMode,
        percentage,
        customAmount,
        remainingAmount,
      });

    if (
      refundAmount === null ||
      refundAmount <= 0
    ) {
      const error = new Error(
        "Calculated refund amount must be greater than zero."
      );

      error.status = 400;
      throw error;
    }

    if (
      refundAmount >
      remainingAmount
    ) {
      const hasOverridePermission =
        await hasRolePermission(
          client,
          roleId,
          "refund.override"
        );

      if (!hasOverridePermission) {
        const error = new Error(
          `Refund amount cannot exceed remaining balance ₹${remainingAmount.toFixed(
            2
          )}.`
        );

        error.status = 409;
        throw error;
      }

      const error = new Error(
        "Override refunds above the approved balance require a separate override workflow."
      );

      error.status = 409;
      throw error;
    }

    if (
      gatewayRefundId &&
      gatewayName
    ) {
      const gatewayDuplicate =
        await client.query(
          `
            SELECT id
            FROM refund_transactions
            WHERE
              gateway_name = $1
              AND gateway_refund_id = $2
            LIMIT 1
          `,
          [
            gatewayName,
            gatewayRefundId,
          ]
        );

      if (
        gatewayDuplicate.rows.length
      ) {
        const error = new Error(
          "Gateway refund reference already exists."
        );

        error.status = 409;
        throw error;
      }
    }

    const approvalLevel =
      calculateApprovalLevel(
        refundAmount
      );

    const needsApproval =
      approvalLevel > 0;

    const transactionStatus =
      needsApproval
        ? "APPROVAL_REQUIRED"
        : "PROCESSING";

    const requestStatus =
      needsApproval
        ? "APPROVAL_REQUIRED"
        : "PROCESSING";

    const transactionNumber =
      createTransactionNumber();

    const attemptResult =
      await client.query(
        `
          SELECT
            COALESCE(
              MAX(attempt_number),
              0
            ) + 1 AS next_attempt
          FROM refund_transactions
          WHERE refund_request_id = $1
        `,
        [refundId]
      );

    const attemptNumber =
      Number(
        attemptResult.rows[0]
          .next_attempt
      );

    const transactionResult =
      await client.query(
        `
          INSERT INTO refund_transactions (
            transaction_number,
            refund_request_id,
            booking_id,
            payment_id,
            attempt_number,
            refund_type,
            percentage,
            requested_amount,
            refund_amount,
            currency_code,
            transaction_status,
            processing_mode,
            refund_method,
            gateway_name,
            gateway_payment_id,
            gateway_refund_id,
            gateway_status,
            bank_reference,
            idempotency_key,
            processed_by_user_id,
            admin_note,
            request_ip,
            user_agent,
            processing_started_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18,
            $19,
            $20,
            $21,
            $22,
            CASE
              WHEN $23::boolean
                THEN CURRENT_TIMESTAMP
              ELSE NULL
            END
          )
          RETURNING *
        `,
        [
          transactionNumber,
          refundId,
          refund.booking_id,
          refund.payment_id,
          attemptNumber,
          refundMode,
          refundMode ===
          "PARTIAL_PERCENTAGE"
            ? toMoney(percentage)
            : null,
          refundAmount,
          refund.currency_code ||
            "INR",
          transactionStatus,
          processingMode,
          refundMethod ||
            refund.refund_method,
          gatewayName,
          gatewayPaymentId ||
            refund.payment_transaction_id,
          gatewayRefundId,
          needsApproval
            ? "AWAITING_APPROVAL"
            : "PROCESSING",
          bankReference,
          idempotencyKey,
          adminId,
          adminNote,
          req.ip ||
            req.socket?.remoteAddress ||
            null,
          req.get("user-agent") ||
            null,
          !needsApproval,
        ]
      );

    const transaction =
      transactionResult.rows[0];

    if (needsApproval) {
      await client.query(
        `
          INSERT INTO refund_approvals (
            refund_request_id,
            refund_transaction_id,
            approval_level,
            approval_role,
            requested_by_user_id,
            approval_status,
            requested_amount,
            request_reason
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            'PENDING',
            $6,
            $7
          )
        `,
        [
          refundId,
          transaction.id,
          approvalLevel,
          approvalLevel === 1
            ? "SUPERVISOR"
            : "FINANCE_MANAGER",
          adminId,
          refundAmount,
          adminNote ||
            "Refund amount requires approval.",
        ]
      );
    }

    await client.query(
      `
        UPDATE refund_requests
        SET
          refund_mode = $1::varchar(40),
          refund_status = $2::varchar(40),
          approval_status = $3::varchar(40),
          processing_started_at =
            CASE
              WHEN $2::varchar(40) = 'PROCESSING'
                THEN COALESCE(
                  processing_started_at,
                  CURRENT_TIMESTAMP
                )
              ELSE processing_started_at
            END,
          processing_lock_token =
            CASE
              WHEN $2::varchar(40) = 'PROCESSING'
                THEN gen_random_uuid()
              ELSE processing_lock_token
            END,
          processing_locked_by =
            CASE
              WHEN $2::varchar(40) = 'PROCESSING'
                THEN $4
              ELSE processing_locked_by
            END,
          processing_locked_at =
            CASE
              WHEN $2::varchar(40) = 'PROCESSING'
                THEN CURRENT_TIMESTAMP
              ELSE processing_locked_at
            END,
          processing_lock_expires_at =
            CASE
              WHEN $2::varchar(40) = 'PROCESSING'
                THEN CURRENT_TIMESTAMP
                  + INTERVAL '15 minutes'
              ELSE
                processing_lock_expires_at
            END,
          last_processed_by = $4,
          admin_note =
            COALESCE($5, admin_note),
          last_activity_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $6
      `,
      [
        refundMode,
        requestStatus,
        needsApproval
          ? "PENDING"
          : "NOT_REQUIRED",
        adminId,
        adminNote,
        refundId,
      ]
    );

    const {
      requestIp,
      userAgent,
    } = getRequestMeta(req);

    await addActivity(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transaction.id,
      activityType: needsApproval
        ? "REFUND_APPROVAL_REQUESTED"
        : "REFUND_PROCESSING_STARTED",
      fromStatus:
        refund.refund_status,
      toStatus: requestStatus,
      actorId: adminId,
      title: needsApproval
        ? "Refund approval requested"
        : "Refund processing started",
      description: needsApproval
        ? `₹${refundAmount.toFixed(
            2
          )} refund requires level ${approvalLevel} approval.`
        : `₹${refundAmount.toFixed(
            2
          )} refund processing started.`,
      metadata: {
        transaction_number:
          transactionNumber,
        refund_mode: refundMode,
        refund_amount:
          refundAmount,
        percentage:
          refundMode ===
          "PARTIAL_PERCENTAGE"
            ? toMoney(percentage)
            : null,
        processing_mode:
          processingMode,
        approval_level:
          approvalLevel,
        idempotency_key:
          idempotencyKey,
      },
      requestIp,
      userAgent,
    });

    if (needsApproval) {
      await queueNotification(
        client,
        {
          refundRequestId: refundId,
          refundTransactionId:
            transaction.id,
          customerProfileId:
            refund.customer_profile_id,
          templateCode:
            "REFUND_APPROVAL_PENDING",
          messageBody:
            `Your refund of ₹${refundAmount.toFixed(
              2
            )} is under approval review.`,
        }
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,

      message: needsApproval
        ? "Refund submitted for approval."
        : "Refund processing started.",

      approval_required:
        needsApproval,

      approval_level:
        approvalLevel,

      transaction,
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Refund processing rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Request refund processing failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Refund processing request failed.",
      });
  } finally {
    client.release();
  }
};


const rejectRefundTransaction = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const refundId =
      toPositiveInteger(req.params.id);

    const transactionId =
      toPositiveInteger(
        req.params.transactionId
      );

    const adminId = getAdminId(req);

    const rejectionReason =
      String(
        req.body.rejection_reason ||
        req.body.decision_note ||
        ""
      ).trim();

    if (
      !refundId ||
      !transactionId ||
      !adminId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund, transaction and admin IDs are required.",
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required.",
      });
    }

    if (rejectionReason.length > 2000) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is too long.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const result =
      await client.query(
        `
          SELECT
            rt.*,

            rr.refund_status,
            rr.approval_status
              AS request_approval_status,
            rr.customer_profile_id,
            rr.payment_id,
            rr.approved_refund_amount,
            rr.total_refunded_amount,
            rr.remaining_refund_amount,

            p.payment_status,
            p.refund_status
              AS payment_refund_status,
            p.refunded_amount

          FROM refund_transactions rt

          INNER JOIN refund_requests rr
            ON rr.id =
              rt.refund_request_id

          LEFT JOIN payments p
            ON p.id = rr.payment_id

          WHERE
            rt.id = $1
            AND rt.refund_request_id = $2

          FOR UPDATE OF rt, rr
        `,
        [
          transactionId,
          refundId,
        ]
      );

    if (!result.rows.length) {
      const error = new Error(
        "Refund transaction not found."
      );

      error.status = 404;
      throw error;
    }

    const transaction =
      result.rows[0];

    if (
      transaction.transaction_status !==
      "APPROVAL_REQUIRED"
    ) {
      const error = new Error(
        "Only approval-required transactions can be rejected."
      );

      error.status = 409;
      throw error;
    }

    if (
      transaction.refund_status !==
        "APPROVAL_REQUIRED" ||
      transaction.request_approval_status !==
        "PENDING"
    ) {
      const error = new Error(
        "Refund request is not awaiting approval."
      );

      error.status = 409;
      throw error;
    }

    if (
      Number(
        transaction.total_refunded_amount
      ) !== 0
    ) {
      const error = new Error(
        "A refund with a posted amount cannot be rejected."
      );

      error.status = 409;
      throw error;
    }


    const approvalAuthority =
      await assertRefundApprovalAuthority(
        client,
        {
          adminId,
          refundId,
          transactionId,
        }
      );

    const approvalResult =
      await client.query(
        `
          UPDATE refund_approvals
          SET
            approval_status =
              'REJECTED',
            approver_user_id = $1,
            approved_amount = 0,
            decision_note = $2,
            decided_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE
            refund_request_id = $3
            AND refund_transaction_id = $4
            AND approval_status =
              'PENDING'
          RETURNING *
        `,
        [
          adminId,
          rejectionReason,
          refundId,
          transactionId,
        ]
      );

    if (
      !approvalResult.rows.length
    ) {
      const error = new Error(
        "Pending approval record not found."
      );

      error.status = 409;
      throw error;
    }

    await client.query(
      `
        UPDATE refund_transactions
        SET
          transaction_status =
            'REJECTED',
          gateway_status =
            'REJECTED',
          approved_by_user_id = NULL,
          processed_by_user_id =
            COALESCE(
              processed_by_user_id,
              $1
            ),
          admin_note = $2,
          processed_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [
        adminId,
        rejectionReason,
        transactionId,
      ]
    );

    await client.query(
      `
        UPDATE refund_requests
        SET
          refund_status =
            'REJECTED',
          approval_status =
            'REJECTED',
          approved_refund_amount = 0,
          total_refunded_amount = 0,
          remaining_refund_amount = 0,
          rejected_at =
            CURRENT_TIMESTAMP,
          approved_at = NULL,
          failure_reason = NULL,
          failed_at = NULL,
          processing_lock_token = NULL,
          processing_locked_by = NULL,
          processing_locked_at = NULL,
          processing_lock_expires_at =
            NULL,
          sla_status = 'COMPLETED',
          admin_note = $1,
          last_processed_by = $2,
          last_activity_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $3
      `,
      [
        rejectionReason,
        adminId,
        refundId,
      ]
    );

    if (transaction.payment_id) {
      await client.query(
        `
          UPDATE payments
          SET
            refund_status =
              'REJECTED',
            refunded_amount = 0,
            refunded_at = NULL
          WHERE id = $1
        `,
        [transaction.payment_id]
      );
    }

    const {
      requestIp,
      userAgent,
    } = getRequestMeta(req);

    await addActivity(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transactionId,
      activityType:
        "REFUND_REJECTED",
      fromStatus:
        transaction.refund_status,
      toStatus: "REJECTED",
      actorId: adminId,
      title: "Refund rejected",
      description:
        rejectionReason,
      metadata: {
        transaction_number:
          transaction.transaction_number,
        requested_amount:
          transaction.refund_amount,
        rejection_reason:
          rejectionReason,
        approval_id:
          approvalResult.rows[0].id,
        approval_level:
          approvalResult.rows[0]
            .approval_level,
        approval_role:
          approvalResult.rows[0]
            .approval_role,
        required_role:
          approvalAuthority
            .requiredRole,
        actor_role:
          approvalAuthority
            .actualRole,
        override_used:
          approvalAuthority
            .usedOverride,
      },
      requestIp,
      userAgent,
    });

    await queueNotification(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transactionId,
      customerProfileId:
        transaction.customer_profile_id,
      templateCode:
        "REFUND_REJECTED",
      messageBody:
        "Your refund request was not approved.",
    });

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message:
        "Refund request rejected successfully.",
      refund_status: "REJECTED",
      approval_status: "REJECTED",
      transaction_status: "REJECTED",
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Refund rejection rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Reject refund failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to reject refund.",
      });
  } finally {
    client.release();
  }
};

const approveRefundTransaction = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const refundId =
      toPositiveInteger(req.params.id);

    const transactionId =
      toPositiveInteger(
        req.params.transactionId
      );

    const adminId = getAdminId(req);

    const decisionNote =
      String(
        req.body.decision_note || ""
      ).trim() || null;

    if (
      !refundId ||
      !transactionId ||
      !adminId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund, transaction and admin IDs are required.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query(
      `
        SELECT
          rt.*,
          rr.refund_status,
          rr.customer_profile_id
        FROM refund_transactions rt
        INNER JOIN refund_requests rr
          ON rr.id =
            rt.refund_request_id
        WHERE
          rt.id = $1
          AND rt.refund_request_id = $2
        FOR UPDATE OF rt, rr
      `,
      [
        transactionId,
        refundId,
      ]
    );

    if (!result.rows.length) {
      const error = new Error(
        "Refund transaction not found."
      );

      error.status = 404;
      throw error;
    }

    const transaction =
      result.rows[0];

    if (
      transaction.transaction_status !==
      "APPROVAL_REQUIRED"
    ) {
      const error = new Error(
        "Only approval-required transactions can be approved."
      );

      error.status = 409;
      throw error;
    }


    const approvalAuthority =
      await assertRefundApprovalAuthority(
        client,
        {
          adminId,
          refundId,
          transactionId,
        }
      );

    const approvalResult =
      await client.query(
        `
          UPDATE refund_approvals
          SET
            approval_status = 'APPROVED',
            approver_user_id = $1,
            approved_amount =
              requested_amount,
            decision_note = $2,
            decided_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE
            refund_transaction_id = $3
            AND approval_status =
              'PENDING'
          RETURNING *
        `,
        [
          adminId,
          decisionNote,
          transactionId,
        ]
      );

    if (
      !approvalResult.rows.length
    ) {
      const error = new Error(
        "Pending approval record not found."
      );

      error.status = 409;
      throw error;
    }

    await client.query(
      `
        UPDATE refund_transactions
        SET
          transaction_status =
            'PROCESSING',
          approved_by_user_id = $1,
          gateway_status =
            'PROCESSING',
          processing_started_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [adminId, transactionId]
    );

    await client.query(
      `
        UPDATE refund_requests
        SET
          refund_status =
            'PROCESSING',
          approval_status =
            'APPROVED',
          approved_at =
            CURRENT_TIMESTAMP,
          processing_started_at =
            COALESCE(
              processing_started_at,
              CURRENT_TIMESTAMP
            ),
          processing_lock_token =
            gen_random_uuid(),
          processing_locked_by = $1,
          processing_locked_at =
            CURRENT_TIMESTAMP,
          processing_lock_expires_at =
            CURRENT_TIMESTAMP
              + INTERVAL '15 minutes',
          last_processed_by = $1,
          last_activity_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $2
      `,
      [adminId, refundId]
    );

    const {
      requestIp,
      userAgent,
    } = getRequestMeta(req);

    await addActivity(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transactionId,
      activityType:
        "REFUND_APPROVED",
      fromStatus:
        transaction.refund_status,
      toStatus: "PROCESSING",
      actorId: adminId,
      title: "Refund approved",
      description:
        `₹${Number(
          transaction.refund_amount
        ).toFixed(
          2
        )} refund approved and moved to processing.`,
      metadata: {
        transaction_number:
          transaction.transaction_number,
        approved_amount:
          transaction.refund_amount,
        decision_note:
          decisionNote,
        approval_level:
          approvalAuthority
            .approvalLevel,
        required_role:
          approvalAuthority
            .requiredRole,
        actor_role:
          approvalAuthority
            .actualRole,
        override_used:
          approvalAuthority
            .usedOverride,
      },
      requestIp,
      userAgent,
    });

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message:
        "Refund approved and moved to processing.",
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Refund approval rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Approve refund failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to approve refund.",
      });
  } finally {
    client.release();
  }
};

const completeRefundTransaction = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const refundId =
      toPositiveInteger(req.params.id);

    const transactionId =
      toPositiveInteger(
        req.params.transactionId
      );

    const adminId = getAdminId(req);

    const gatewayRefundId =
      String(
        req.body.gateway_refund_id ||
          ""
      ).trim() || null;

    const bankReference =
      String(
        req.body.bank_reference || ""
      ).trim() || null;

    const gatewayResponse =
      req.body.gateway_response || {};

    if (
      !refundId ||
      !transactionId ||
      !adminId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund, transaction and admin IDs are required.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query(
      `
        SELECT
          rt.*,
          rr.approved_refund_amount,
          rr.total_refunded_amount,
          rr.remaining_refund_amount,
          rr.refund_status,
          rr.payment_id,
          rr.customer_profile_id
        FROM refund_transactions rt
        INNER JOIN refund_requests rr
          ON rr.id =
            rt.refund_request_id
        WHERE
          rt.id = $1
          AND rt.refund_request_id = $2
        FOR UPDATE OF rt, rr
      `,
      [
        transactionId,
        refundId,
      ]
    );

    if (!result.rows.length) {
      const error = new Error(
        "Refund transaction not found."
      );

      error.status = 404;
      throw error;
    }

    const transaction =
      result.rows[0];

    if (
      transaction.transaction_status ===
      "SUCCESS"
    ) {
      await client.query("COMMIT");
      transactionStarted = false;

      return res.json({
        success: true,
        duplicate: true,
        message:
          "Refund transaction is already completed.",
      });
    }

    if (
      transaction.transaction_status !==
      "PROCESSING"
    ) {
      const error = new Error(
        "Only processing transactions can be completed."
      );

      error.status = 409;
      throw error;
    }

    const refundAmount =
      toMoney(
        transaction.refund_amount
      );

    const currentTotal =
      toMoney(
        transaction.total_refunded_amount
      );

    const approvedAmount =
      toMoney(
        transaction.approved_refund_amount
      );

    const nextTotal =
      toMoney(
        currentTotal + refundAmount
      );

    if (
      nextTotal > approvedAmount
    ) {
      const error = new Error(
        "Successful refund total would exceed the approved refundable amount."
      );

      error.status = 409;
      throw error;
    }

    const nextRemaining =
      toMoney(
        approvedAmount - nextTotal
      );

    const finalStatus =
      nextRemaining === 0
        ? "SUCCESS"
        : "PARTIALLY_REFUNDED";

    await client.query(
      `
        UPDATE refund_transactions
        SET
          transaction_status =
            'SUCCESS',
          gateway_refund_id =
            COALESCE($1, gateway_refund_id),
          bank_reference =
            COALESCE($2, bank_reference),
          gateway_status =
            'SUCCESS',
          gateway_response =
            $3::jsonb,
          processed_by_user_id = $4,
          processed_at =
            CURRENT_TIMESTAMP,
          completed_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $5
      `,
      [
        gatewayRefundId,
        bankReference,
        JSON.stringify(
          gatewayResponse
        ),
        adminId,
        transactionId,
      ]
    );

    await client.query(
      `
        UPDATE refund_requests
        SET
          total_refunded_amount = $1::numeric(12,2),
          remaining_refund_amount = $2::numeric(12,2),
          refund_status = $3::varchar(40),
          completed_at =
            CASE
              WHEN $3::varchar(40) = 'SUCCESS'
                THEN CURRENT_TIMESTAMP
              ELSE completed_at
            END,
          processing_lock_token = NULL,
          processing_locked_by = NULL,
          processing_locked_at = NULL,
          processing_lock_expires_at =
            NULL,
          last_processed_by = $4,
          reconciliation_status =
            'PENDING',
          sla_status =
            CASE
              WHEN $3::varchar(40) = 'SUCCESS'
                THEN 'COMPLETED'
              ELSE sla_status
            END,
          last_activity_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $5
      `,
      [
        nextTotal,
        nextRemaining,
        finalStatus,
        adminId,
        refundId,
      ]
    );

    if (transaction.payment_id) {
      await client.query(
        `
          UPDATE payments
          SET
            refunded_amount = $1::numeric(12,2),
            refund_status = $2::varchar,
            refunded_at =
              CASE
                WHEN $2::varchar = 'SUCCESS'
                  THEN CURRENT_TIMESTAMP
                ELSE refunded_at
              END,
            payment_status =
              CASE
                WHEN $2::varchar = 'SUCCESS'
                  THEN 'refunded'
                ELSE payment_status
              END
          WHERE id = $3
        `,
        [
          nextTotal,
          finalStatus,
          transaction.payment_id,
        ]
      );
    }

    await client.query(
      `
        INSERT INTO refund_reconciliations (
          refund_request_id,
          refund_transaction_id,
          expected_amount,
          settled_amount,
          currency_code,
          gateway_name,
          gateway_reference,
          bank_reference,
          reconciliation_status
        )
        VALUES (
          $1,
          $2,
          $3,
          $3,
          $4,
          $5,
          $6,
          $7,
          'PENDING'
        )
      `,
      [
        refundId,
        transactionId,
        refundAmount,
        transaction.currency_code ||
          "INR",
        transaction.gateway_name,
        gatewayRefundId ||
          transaction.gateway_refund_id,
        bankReference ||
          transaction.bank_reference,
      ]
    );

    const {
      requestIp,
      userAgent,
    } = getRequestMeta(req);

    await addActivity(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transactionId,
      activityType:
        "REFUND_COMPLETED",
      fromStatus:
        transaction.refund_status,
      toStatus: finalStatus,
      actorId: adminId,
      title:
        finalStatus === "SUCCESS"
          ? "Refund completed"
          : "Partial refund completed",
      description:
        `₹${refundAmount.toFixed(
          2
        )} refunded successfully. Remaining balance ₹${nextRemaining.toFixed(
          2
        )}.`,
      metadata: {
        transaction_number:
          transaction.transaction_number,
        refunded_amount:
          refundAmount,
        total_refunded_amount:
          nextTotal,
        remaining_refund_amount:
          nextRemaining,
        gateway_refund_id:
          gatewayRefundId,
        bank_reference:
          bankReference,
      },
      requestIp,
      userAgent,
    });

    await queueNotification(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transactionId,
      customerProfileId:
        transaction.customer_profile_id,
      templateCode:
        finalStatus === "SUCCESS"
          ? "REFUND_COMPLETED"
          : "REFUND_PARTIALLY_COMPLETED",
      messageBody:
        finalStatus === "SUCCESS"
          ? `Your refund of ₹${refundAmount.toFixed(
              2
            )} has been completed.`
          : `A partial refund of ₹${refundAmount.toFixed(
              2
            )} has been completed. Remaining refundable balance is ₹${nextRemaining.toFixed(
              2
            )}.`,
    });

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message:
        finalStatus === "SUCCESS"
          ? "Refund completed successfully."
          : "Partial refund completed successfully.",

      refund_status: finalStatus,
      refunded_amount:
        refundAmount,
      total_refunded_amount:
        nextTotal,
      remaining_refund_amount:
        nextRemaining,
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Complete refund rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Complete refund failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to complete refund.",
      });
  } finally {
    client.release();
  }
};


const retryRefundTransaction = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const refundId =
      toPositiveInteger(req.params.id);

    const sourceTransactionId =
      toPositiveInteger(
        req.params.transactionId
      );

    const adminId = getAdminId(req);

    const suppliedIdempotencyKey =
      String(
        req.get("Idempotency-Key") ||
        req.body.idempotency_key ||
        ""
      ).trim();

    const idempotencyKey =
      suppliedIdempotencyKey ||
      crypto.randomUUID();

    const processingMode =
      String(
        req.body.processing_mode ||
        "MANUAL"
      )
        .trim()
        .toUpperCase();

    const refundMethod =
      String(
        req.body.refund_method || ""
      ).trim() || null;

    const gatewayName =
      String(
        req.body.gateway_name || ""
      ).trim() || null;

    const gatewayRefundId =
      String(
        req.body.gateway_refund_id || ""
      ).trim() || null;

    const bankReference =
      String(
        req.body.bank_reference || ""
      ).trim() || null;

    const adminNote =
      String(
        req.body.admin_note || ""
      ).trim() || null;

    if (
      !refundId ||
      !sourceTransactionId ||
      !adminId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund, failed transaction and admin IDs are required.",
      });
    }

    if (
      !PROCESSING_MODES.has(
        processingMode
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid processing mode.",
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message:
          "Idempotency key is required.",
      });
    }

    if (idempotencyKey.length > 150) {
      return res.status(400).json({
        success: false,
        message:
          "Idempotency key is too long.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const duplicateResult =
      await client.query(
        `
          SELECT
            id,
            transaction_number,
            refund_request_id,
            retry_of_transaction_id,
            attempt_number,
            transaction_status,
            refund_amount
          FROM refund_transactions
          WHERE idempotency_key = $1
          LIMIT 1
        `,
        [idempotencyKey]
      );

    if (duplicateResult.rows.length) {
      await client.query("COMMIT");
      transactionStarted = false;

      return res.status(200).json({
        success: true,
        duplicate: true,
        message:
          "This refund retry was already submitted.",
        transaction:
          duplicateResult.rows[0],
      });
    }

    const sourceResult =
      await client.query(
        `
          SELECT
            rt.*,

            rr.refund_status,
            rr.approval_status,
            rr.approved_refund_amount,
            rr.total_refunded_amount,
            rr.remaining_refund_amount,
            rr.currency_code,
            rr.refund_method
              AS request_refund_method,
            rr.payment_id
              AS request_payment_id,
            rr.booking_id
              AS request_booking_id,
            rr.customer_profile_id,

            p.payment_status,
            p.transaction_id
              AS payment_transaction_id

          FROM refund_transactions rt

          INNER JOIN refund_requests rr
            ON rr.id =
              rt.refund_request_id

          LEFT JOIN payments p
            ON p.id = rr.payment_id

          WHERE
            rt.id = $1
            AND rt.refund_request_id = $2

          FOR UPDATE OF rt, rr
        `,
        [
          sourceTransactionId,
          refundId,
        ]
      );

    if (!sourceResult.rows.length) {
      const error = new Error(
        "Failed refund transaction not found."
      );

      error.status = 404;
      throw error;
    }

    const source =
      sourceResult.rows[0];

    if (
      source.transaction_status !==
      "FAILED"
    ) {
      const error = new Error(
        "Only failed refund transactions can be retried."
      );

      error.status = 409;
      throw error;
    }

    if (
      source.refund_status !== "FAILED"
    ) {
      const error = new Error(
        "Refund request must be in FAILED status before retry."
      );

      error.status = 409;
      throw error;
    }

    const remainingAmount =
      toMoney(
        source.remaining_refund_amount
      );

    const retryAmount =
      toMoney(source.refund_amount);

    if (
      remainingAmount === null ||
      remainingAmount <= 0
    ) {
      const error = new Error(
        "No refundable balance remains."
      );

      error.status = 409;
      throw error;
    }

    if (
      retryAmount === null ||
      retryAmount <= 0
    ) {
      const error = new Error(
        "Failed transaction has an invalid refund amount."
      );

      error.status = 409;
      throw error;
    }

    if (retryAmount > remainingAmount) {
      const error = new Error(
        `Retry amount ₹${retryAmount.toFixed(
          2
        )} exceeds remaining balance ₹${remainingAmount.toFixed(
          2
        )}.`
      );

      error.status = 409;
      throw error;
    }

    if (
      source.request_payment_id &&
      String(
        source.payment_status || ""
      ).toLowerCase() !== "paid"
    ) {
      const error = new Error(
        "Only a paid payment can be retried for refund."
      );

      error.status = 409;
      throw error;
    }

    const activeRetryResult =
      await client.query(
        `
          SELECT
            id,
            transaction_number,
            transaction_status
          FROM refund_transactions
          WHERE
            retry_of_transaction_id = $1
            AND transaction_status IN (
              'PENDING',
              'APPROVAL_REQUIRED',
              'PROCESSING'
            )
          LIMIT 1
        `,
        [sourceTransactionId]
      );

    if (activeRetryResult.rows.length) {
      const error = new Error(
        "An active retry already exists for this failed transaction."
      );

      error.status = 409;
      throw error;
    }

    if (
      gatewayRefundId &&
      gatewayName
    ) {
      const gatewayDuplicate =
        await client.query(
          `
            SELECT id
            FROM refund_transactions
            WHERE
              gateway_name = $1
              AND gateway_refund_id = $2
            LIMIT 1
          `,
          [
            gatewayName,
            gatewayRefundId,
          ]
        );

      if (
        gatewayDuplicate.rows.length
      ) {
        const error = new Error(
          "Gateway refund reference already exists."
        );

        error.status = 409;
        throw error;
      }
    }

    const attemptResult =
      await client.query(
        `
          SELECT
            COALESCE(
              MAX(attempt_number),
              0
            ) + 1 AS next_attempt
          FROM refund_transactions
          WHERE refund_request_id = $1
        `,
        [refundId]
      );

    const attemptNumber =
      Number(
        attemptResult.rows[0]
          .next_attempt
      );

    const transactionNumber =
      createTransactionNumber();

    const transactionResult =
      await client.query(
        `
          INSERT INTO refund_transactions (
            transaction_number,
            refund_request_id,
            booking_id,
            payment_id,
            attempt_number,
            refund_type,
            percentage,
            requested_amount,
            refund_amount,
            currency_code,
            transaction_status,
            processing_mode,
            refund_method,
            gateway_name,
            gateway_payment_id,
            gateway_refund_id,
            gateway_status,
            bank_reference,
            retry_of_transaction_id,
            idempotency_key,
            processed_by_user_id,
            admin_note,
            request_ip,
            user_agent,
            processing_started_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $8,
            $9,
            'PROCESSING',
            $10,
            $11,
            $12,
            $13,
            $14,
            'PROCESSING',
            $15,
            $16,
            $17,
            $18,
            $19,
            $20,
            $21,
            CURRENT_TIMESTAMP
          )
          RETURNING *
        `,
        [
          transactionNumber,
          refundId,
          source.request_booking_id,
          source.request_payment_id,
          attemptNumber,
          source.refund_type,
          source.percentage,
          retryAmount,
          source.currency_code ||
            "INR",
          processingMode,
          refundMethod ||
            source.refund_method ||
            source.request_refund_method,
          gatewayName ||
            source.gateway_name,
          source.gateway_payment_id ||
            source.payment_transaction_id,
          gatewayRefundId,
          bankReference,
          sourceTransactionId,
          idempotencyKey,
          adminId,
          adminNote ||
            `Retry of failed refund transaction ${source.transaction_number}`,
          req.ip ||
            req.socket?.remoteAddress ||
            null,
          req.get("user-agent") ||
            null,
        ]
      );

    const transaction =
      transactionResult.rows[0];

    await client.query(
      `
        UPDATE refund_requests
        SET
          refund_status =
            'PROCESSING',
          approval_status =
            'NOT_REQUIRED',
          failure_reason = NULL,
          failed_at = NULL,
          completed_at = NULL,
          processing_started_at =
            CURRENT_TIMESTAMP,
          processing_lock_token =
            gen_random_uuid(),
          processing_locked_by = $1,
          processing_locked_at =
            CURRENT_TIMESTAMP,
          processing_lock_expires_at =
            CURRENT_TIMESTAMP
            + INTERVAL '15 minutes',
          last_processed_by = $1,
          admin_note =
            COALESCE($2, admin_note),
          last_activity_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $3
      `,
      [
        adminId,
        adminNote,
        refundId,
      ]
    );

    const {
      requestIp,
      userAgent,
    } = getRequestMeta(req);

    await addActivity(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transaction.id,
      activityType:
        "REFUND_RETRY_STARTED",
      fromStatus: "FAILED",
      toStatus: "PROCESSING",
      actorId: adminId,
      title:
        "Refund retry started",
      description:
        `Retry attempt ${attemptNumber} started for ₹${retryAmount.toFixed(
          2
        )}.`,
      metadata: {
        source_transaction_id:
          sourceTransactionId,
        source_transaction_number:
          source.transaction_number,
        retry_transaction_id:
          transaction.id,
        retry_transaction_number:
          transactionNumber,
        attempt_number:
          attemptNumber,
        refund_amount:
          retryAmount,
        idempotency_key:
          idempotencyKey,
      },
      requestIp,
      userAgent,
    });

    await queueNotification(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transaction.id,
      customerProfileId:
        source.customer_profile_id,
      templateCode:
        "REFUND_RETRY_STARTED",
      messageBody:
        `Your refund of ₹${retryAmount.toFixed(
          2
        )} is being retried.`,
    });

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message:
        "Refund retry processing started.",
      source_transaction_id:
        sourceTransactionId,
      transaction,
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Refund retry rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Retry refund failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to retry refund.",
      });
  } finally {
    client.release();
  }
};

const failRefundTransaction = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const refundId =
      toPositiveInteger(req.params.id);

    const transactionId =
      toPositiveInteger(
        req.params.transactionId
      );

    const adminId = getAdminId(req);

    const failureReason =
      String(
        req.body.failure_reason || ""
      ).trim();

    const failureCode =
      String(
        req.body.failure_code || ""
      ).trim() || null;

    if (
      !refundId ||
      !transactionId ||
      !adminId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund, transaction and admin IDs are required.",
      });
    }

    if (!failureReason) {
      return res.status(400).json({
        success: false,
        message:
          "Failure reason is required.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query(
      `
        SELECT
          rt.*,
          rr.refund_status,
          rr.customer_profile_id
        FROM refund_transactions rt
        INNER JOIN refund_requests rr
          ON rr.id =
            rt.refund_request_id
        WHERE
          rt.id = $1
          AND rt.refund_request_id = $2
        FOR UPDATE OF rt, rr
      `,
      [
        transactionId,
        refundId,
      ]
    );

    if (!result.rows.length) {
      const error = new Error(
        "Refund transaction not found."
      );

      error.status = 404;
      throw error;
    }

    const transaction =
      result.rows[0];

    if (
      ![
        "PROCESSING",
        "APPROVAL_REQUIRED",
      ].includes(
        transaction.transaction_status
      )
    ) {
      const error = new Error(
        "Only active refund transactions can be failed."
      );

      error.status = 409;
      throw error;
    }

    await client.query(
      `
        UPDATE refund_transactions
        SET
          transaction_status =
            'FAILED',
          gateway_status =
            'FAILED',
          failure_code = $1,
          failure_reason = $2,
          failed_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [
        failureCode,
        failureReason,
        transactionId,
      ]
    );

    await client.query(
      `
        UPDATE refund_requests
        SET
          refund_status = 'FAILED',
          approval_status =
            CASE
              WHEN approval_status =
                'PENDING'
                THEN 'CANCELLED'
              ELSE approval_status
            END,
          failure_reason = $1,
          failed_at =
            CURRENT_TIMESTAMP,
          retry_count =
            retry_count + 1,
          processing_lock_token = NULL,
          processing_locked_by = NULL,
          processing_locked_at = NULL,
          processing_lock_expires_at =
            NULL,
          last_processed_by = $2,
          last_activity_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $3
      `,
      [
        failureReason,
        adminId,
        refundId,
      ]
    );

    const {
      requestIp,
      userAgent,
    } = getRequestMeta(req);

    await addActivity(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transactionId,
      activityType:
        "REFUND_FAILED",
      fromStatus:
        transaction.refund_status,
      toStatus: "FAILED",
      actorId: adminId,
      title: "Refund processing failed",
      description: failureReason,
      metadata: {
        transaction_number:
          transaction.transaction_number,
        failure_code:
          failureCode,
        failure_reason:
          failureReason,
      },
      requestIp,
      userAgent,
    });

    await queueNotification(client, {
      refundRequestId: refundId,
      refundTransactionId:
        transactionId,
      customerProfileId:
        transaction.customer_profile_id,
      templateCode:
        "REFUND_FAILED",
      messageBody:
        "Your refund could not be completed and is under review.",
    });

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message:
        "Refund transaction marked as failed.",
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Fail refund rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Fail refund failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to update refund failure.",
      });
  } finally {
    client.release();
  }
};

module.exports = {
  requestRefundProcessing,
  rejectRefundTransaction,
  approveRefundTransaction,
  completeRefundTransaction,
  retryRefundTransaction,
  failRefundTransaction,
};
