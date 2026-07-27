const pool = require("../config/db");

const VALID_STATUSES = new Set([
  "PENDING",
  "APPROVAL_REQUIRED",
  "APPROVED",
  "ASSIGNED",
  "PROCESSING",
  "PARTIALLY_REFUNDED",
  "SUCCESS",
  "FAILED",
  "REJECTED",
  "DISPUTED",
  "UNDER_REVIEW",
  "RESOLVED",
]);

const VALID_PRIORITIES = new Set([
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

const toPositiveInteger = (value) => {
  const number = Number(value);

  return Number.isInteger(number) &&
    number > 0
    ? number
    : null;
};

const normalizeUpper = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const getAdminId = (req) =>
  toPositiveInteger(req.user?.id);

const getRequestMeta = (req) => ({
  requestIp:
    req.ip ||
    req.socket?.remoteAddress ||
    null,

  userAgent:
    req.get("user-agent") || null,
});

const addActivity = async (
  client,
  {
    refundRequestId,
    refundTransactionId = null,
    activityType,
    fromStatus = null,
    toStatus = null,
    actorId = null,
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

const getRefundSummary = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `
        SELECT
          COUNT(*)::integer AS total_requests,

          COUNT(*) FILTER (
            WHERE refund_status = 'PENDING'
          )::integer AS pending_count,

          COUNT(*) FILTER (
            WHERE refund_status =
              'APPROVAL_REQUIRED'
          )::integer
            AS approval_required_count,

          COUNT(*) FILTER (
            WHERE refund_status = 'ASSIGNED'
          )::integer AS assigned_count,

          COUNT(*) FILTER (
            WHERE refund_status = 'PROCESSING'
          )::integer AS processing_count,

          COUNT(*) FILTER (
            WHERE refund_status =
              'PARTIALLY_REFUNDED'
          )::integer AS partially_refunded_count,

          COUNT(*) FILTER (
            WHERE refund_status = 'SUCCESS'
          )::integer AS success_count,

          COUNT(*) FILTER (
            WHERE refund_status = 'FAILED'
          )::integer AS failed_count,

          COUNT(*) FILTER (
            WHERE dispute_status IN (
              'OPEN',
              'UNDER_REVIEW'
            )
          )::integer AS active_disputes_count,

          COUNT(*) FILTER (
            WHERE sla_status = 'OVERDUE'
          )::integer AS overdue_count,

          COALESCE(
            SUM(
              remaining_refund_amount
            ) FILTER (
              WHERE refund_status NOT IN (
                'SUCCESS',
                'REJECTED',
                'RESOLVED'
              )
            ),
            0
          )::numeric(12,2)
            AS pending_refund_amount,

          COALESCE(
            SUM(total_refunded_amount),
            0
          )::numeric(12,2)
            AS total_refunded_amount,

          COALESCE(
            SUM(approved_refund_amount),
            0
          )::numeric(12,2)
            AS approved_refund_amount

        FROM refund_requests
      `
    );

    return res.json({
      success: true,
      summary: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Refund summary failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load refund summary.",
    });
  }
};

const getRefundRequests = async (
  req,
  res
) => {
  try {
    const {
      status,
      priority,
      assigned_to,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const parsedPage =
      Math.max(Number(page) || 1, 1);

    const parsedLimit =
      Math.min(
        Math.max(Number(limit) || 20, 1),
        100
      );

    const offset =
      (parsedPage - 1) * parsedLimit;

    const conditions = [];
    const values = [];

    const addValue = (value) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (status) {
      const normalizedStatus =
        normalizeUpper(status);

      if (
        !VALID_STATUSES.has(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid refund status filter.",
        });
      }

      conditions.push(
        `rr.refund_status =
          ${addValue(normalizedStatus)}`
      );
    }

    if (priority) {
      const normalizedPriority =
        normalizeUpper(priority);

      if (
        !VALID_PRIORITIES.has(
          normalizedPriority
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid priority filter.",
        });
      }

      conditions.push(
        `rr.priority =
          ${addValue(normalizedPriority)}`
      );
    }

    if (assigned_to) {
      const assignedUserId =
        toPositiveInteger(assigned_to);

      if (!assignedUserId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assigned admin filter.",
        });
      }

      conditions.push(
        `rr.assigned_to_user_id =
          ${addValue(assignedUserId)}`
      );
    }

    if (search) {
      const term =
        `%${String(search).trim()}%`;

      const placeholder =
        addValue(term);

      conditions.push(
        `(
          rr.refund_number
            ILIKE ${placeholder}
          OR
          rr.booking_id::text
            ILIKE ${placeholder}
          OR
          b.contact_phone
            ILIKE ${placeholder}
          OR
          b.contact_email
            ILIKE ${placeholder}
        )`
      );
    }

    const whereSql =
      conditions.length
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "";

    const countResult =
      await pool.query(
        `
          SELECT
            COUNT(*)::integer AS total
          FROM refund_requests rr
          INNER JOIN bookings b
            ON b.id = rr.booking_id
          ${whereSql}
        `,
        values
      );

    const listValues = [
      ...values,
      parsedLimit,
      offset,
    ];

    const limitPlaceholder =
      `$${values.length + 1}`;

    const offsetPlaceholder =
      `$${values.length + 2}`;

    const result = await pool.query(
      `
        SELECT
          rr.id,
          rr.refund_number,
          rr.booking_id,
          rr.cancellation_id,
          rr.customer_profile_id,
          rr.payment_id,

          rr.original_payment_amount,
          rr.refund_amount,
          rr.approved_refund_amount,
          rr.total_refunded_amount,
          rr.remaining_refund_amount,
          rr.currency_code,

          rr.refund_mode,
          rr.refund_method,
          rr.refund_status,
          rr.approval_status,
          rr.priority,

          rr.assigned_to_user_id,
          rr.assigned_team,
          rr.assigned_at,
          rr.due_at,
          rr.sla_status,

          rr.risk_level,
          rr.risk_score,
          rr.risk_flags,

          rr.reconciliation_status,
          rr.dispute_status,
          rr.retry_count,

          rr.requested_at,
          rr.processing_started_at,
          rr.completed_at,
          rr.failed_at,
          rr.last_activity_at,
          rr.created_at,
          rr.updated_at,

          b.contact_phone,
          b.contact_email,
          b.passenger_count,
          b.fare_amount AS booking_fare,
          b.booking_status,

          p.payment_method,
          p.payment_status,
          p.transaction_id,
          p.refund_status
            AS payment_refund_status,
          p.refunded_amount,

          assigned_user.full_name
            AS assigned_to_name,

          locked_user.full_name
            AS processing_locked_by_name,

          rr.processing_locked_at,
          rr.processing_lock_expires_at,

          COALESCE(
            (
              SELECT COUNT(*)
              FROM refund_transactions rt
              WHERE
                rt.refund_request_id =
                  rr.id
            ),
            0
          )::integer
            AS transaction_count,

          COALESCE(
            (
              SELECT COUNT(*)
              FROM refund_comments rc
              WHERE
                rc.refund_request_id =
                  rr.id
            ),
            0
          )::integer
            AS comment_count

        FROM refund_requests rr

        INNER JOIN bookings b
          ON b.id = rr.booking_id

        LEFT JOIN payments p
          ON p.id = rr.payment_id

        LEFT JOIN users assigned_user
          ON assigned_user.id =
            rr.assigned_to_user_id

        LEFT JOIN users locked_user
          ON locked_user.id =
            rr.processing_locked_by

        ${whereSql}

        ORDER BY
          CASE rr.priority
            WHEN 'URGENT' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'NORMAL' THEN 3
            ELSE 4
          END,
          rr.due_at NULLS LAST,
          rr.requested_at ASC

        LIMIT ${limitPlaceholder}
        OFFSET ${offsetPlaceholder}
      `,
      listValues
    );

    const total =
      countResult.rows[0]?.total || 0;

    return res.json({
      success: true,

      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        total_pages:
          Math.ceil(
            total / parsedLimit
          ),
      },

      refunds: result.rows,
    });
  } catch (error) {
    console.error(
      "Get admin refunds failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load refund requests.",
    });
  }
};

const getRefundRequestById = async (
  req,
  res
) => {
  try {
    const refundId =
      toPositiveInteger(req.params.id);

    if (!refundId) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund request ID is required.",
      });
    }

    const refundResult =
      await pool.query(
        `
          SELECT
            rr.*,

            b.contact_phone,
            b.contact_email,
            b.passenger_count,
            b.fare_amount
              AS booking_fare,
            b.booking_status,

            p.amount
              AS payment_amount,
            p.payment_method,
            p.payment_status,
            p.transaction_id,
            p.refund_status
              AS payment_refund_status,
            p.refunded_amount,
            p.refunded_at,

            assigned_user.full_name
              AS assigned_to_name,

            assigned_user.email
              AS assigned_to_email,

            locked_user.full_name
              AS processing_locked_by_name,

            last_user.full_name
              AS last_processed_by_name

          FROM refund_requests rr

          INNER JOIN bookings b
            ON b.id = rr.booking_id

          LEFT JOIN payments p
            ON p.id = rr.payment_id

          LEFT JOIN users assigned_user
            ON assigned_user.id =
              rr.assigned_to_user_id

          LEFT JOIN users locked_user
            ON locked_user.id =
              rr.processing_locked_by

          LEFT JOIN users last_user
            ON last_user.id =
              rr.last_processed_by

          WHERE rr.id = $1
        `,
        [refundId]
      );

    if (!refundResult.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Refund request not found.",
      });
    }

    const [
      transactionResult,
      activityResult,
      commentResult,
      approvalResult,
      disputeResult,
      reconciliationResult,
      attachmentResult,
    ] = await Promise.all([
      pool.query(
        `
          SELECT
            rt.*,
            processor.full_name
              AS processed_by_name,
            approver.full_name
              AS approved_by_name
          FROM refund_transactions rt
          LEFT JOIN users processor
            ON processor.id =
              rt.processed_by_user_id
          LEFT JOIN users approver
            ON approver.id =
              rt.approved_by_user_id
          WHERE rt.refund_request_id = $1
          ORDER BY rt.id DESC
        `,
        [refundId]
      ),

      pool.query(
        `
          SELECT
            ral.*,
            actor.full_name
              AS actor_name
          FROM refund_activity_log ral
          LEFT JOIN users actor
            ON actor.id = ral.actor_id
          WHERE
            ral.refund_request_id = $1
          ORDER BY ral.id DESC
        `,
        [refundId]
      ),

      pool.query(
        `
          SELECT
            rc.*,
            creator.full_name
              AS created_by_name
          FROM refund_comments rc
          LEFT JOIN users creator
            ON creator.id =
              rc.created_by_user_id
          WHERE
            rc.refund_request_id = $1
          ORDER BY rc.id ASC
        `,
        [refundId]
      ),

      pool.query(
        `
          SELECT
            ra.*,
            requester.full_name
              AS requested_by_name,
            approver.full_name
              AS approver_name
          FROM refund_approvals ra
          LEFT JOIN users requester
            ON requester.id =
              ra.requested_by_user_id
          LEFT JOIN users approver
            ON approver.id =
              ra.approver_user_id
          WHERE
            ra.refund_request_id = $1
          ORDER BY ra.id DESC
        `,
        [refundId]
      ),

      pool.query(
        `
          SELECT *
          FROM refund_disputes
          WHERE refund_request_id = $1
          ORDER BY id DESC
        `,
        [refundId]
      ),

      pool.query(
        `
          SELECT *
          FROM refund_reconciliations
          WHERE refund_request_id = $1
          ORDER BY id DESC
        `,
        [refundId]
      ),

      pool.query(
        `
          SELECT *
          FROM refund_attachments
          WHERE refund_request_id = $1
          ORDER BY id DESC
        `,
        [refundId]
      ),
    ]);

    return res.json({
      success: true,
      refund: refundResult.rows[0],
      transactions:
        transactionResult.rows,
      activity: activityResult.rows,
      comments: commentResult.rows,
      approvals: approvalResult.rows,
      disputes: disputeResult.rows,
      reconciliations:
        reconciliationResult.rows,
      attachments:
        attachmentResult.rows,
    });
  } catch (error) {
    console.error(
      "Get refund detail failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load refund details.",
    });
  }
};

const assignRefundRequest = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const refundId =
      toPositiveInteger(req.params.id);

    const assignedToUserId =
      toPositiveInteger(
        req.body.assigned_to_user_id
      );

    const assignedTeam =
      String(
        req.body.assigned_team || ""
      ).trim() || null;

    const priority =
      normalizeUpper(
        req.body.priority || "NORMAL"
      );

    const dueAt =
      req.body.due_at || null;

    const adminId = getAdminId(req);

    if (!refundId) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund request ID is required.",
      });
    }

    if (!assignedToUserId) {
      return res.status(400).json({
        success: false,
        message:
          "Valid assigned admin is required.",
      });
    }

    if (
      !VALID_PRIORITIES.has(priority)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid refund priority.",
      });
    }

    if (dueAt) {
      const parsedDueAt =
        new Date(dueAt);

      if (
        Number.isNaN(
          parsedDueAt.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid due date-time.",
        });
      }
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const refundResult =
      await client.query(
        `
          SELECT *
          FROM refund_requests
          WHERE id = $1
          FOR UPDATE
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
      [
        "SUCCESS",
        "REJECTED",
        "RESOLVED",
      ].includes(refund.refund_status)
    ) {
      const error = new Error(
        `Refund request cannot be assigned in ${refund.refund_status} status.`
      );

      error.status = 409;
      throw error;
    }

    const userResult =
      await client.query(
        `
          SELECT
            id,
            full_name,
            status
          FROM users
          WHERE id = $1
          FOR SHARE
        `,
        [assignedToUserId]
      );

    if (!userResult.rows.length) {
      const error = new Error(
        "Assigned admin user not found."
      );

      error.status = 404;
      throw error;
    }

    const assignedUser =
      userResult.rows[0];

    if (
      String(
        assignedUser.status || ""
      ).toUpperCase() !== "ACTIVE"
    ) {
      const error = new Error(
        "Refund can only be assigned to an active admin."
      );

      error.status = 409;
      throw error;
    }

    const nextStatus =
      refund.refund_status ===
        "PENDING"
        ? "ASSIGNED"
        : refund.refund_status;

    const updatedResult =
      await client.query(
        `
          UPDATE refund_requests
          SET
            assigned_to_user_id = $1,
            assigned_team = $2,
            assigned_at =
              CURRENT_TIMESTAMP,
            priority = $3,
            due_at = $4,
            refund_status = $5,
            last_activity_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP,
            version = version + 1
          WHERE id = $6
          RETURNING *
        `,
        [
          assignedToUserId,
          assignedTeam,
          priority,
          dueAt,
          nextStatus,
          refundId,
        ]
      );

    const {
      requestIp,
      userAgent,
    } = getRequestMeta(req);

    await addActivity(client, {
      refundRequestId: refundId,
      activityType: "REFUND_ASSIGNED",
      fromStatus:
        refund.refund_status,
      toStatus: nextStatus,
      actorId: adminId,
      title: "Refund request assigned",
      description:
        `Assigned to ${assignedUser.full_name}.`,
      metadata: {
        assigned_to_user_id:
          assignedToUserId,
        assigned_to_name:
          assignedUser.full_name,
        assigned_team: assignedTeam,
        priority,
        due_at: dueAt,
      },
      requestIp,
      userAgent,
    });

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      message:
        "Refund request assigned successfully.",
      refund: updatedResult.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Assign refund rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Assign refund failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to assign refund request.",
      });
  } finally {
    client.release();
  }
};

const addRefundComment = async (
  req,
  res
) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const refundId =
      toPositiveInteger(req.params.id);

    const adminId = getAdminId(req);

    const commentText =
      String(
        req.body.comment_text || ""
      ).trim();

    const commentType =
      normalizeUpper(
        req.body.comment_type ||
          "INTERNAL"
      );

    const validCommentTypes =
      new Set([
        "INTERNAL",
        "CUSTOMER_VISIBLE",
      ]);

    if (!refundId) {
      return res.status(400).json({
        success: false,
        message:
          "Valid refund request ID is required.",
      });
    }

    if (!commentText) {
      return res.status(400).json({
        success: false,
        message:
          "Comment text is required.",
      });
    }

    if (commentText.length > 5000) {
      return res.status(400).json({
        success: false,
        message:
          "Comment cannot exceed 5000 characters.",
      });
    }

    if (
      !validCommentTypes.has(
        commentType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid comment type.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const refundResult =
      await client.query(
        `
          SELECT
            id,
            refund_status
          FROM refund_requests
          WHERE id = $1
          FOR UPDATE
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

    const commentResult =
      await client.query(
        `
          INSERT INTO refund_comments (
            refund_request_id,
            comment_type,
            comment_text,
            created_by_user_id
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          RETURNING *
        `,
        [
          refundId,
          commentType,
          commentText,
          adminId,
        ]
      );

    await client.query(
      `
        UPDATE refund_requests
        SET
          last_activity_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $1
      `,
      [refundId]
    );

    const {
      requestIp,
      userAgent,
    } = getRequestMeta(req);

    await addActivity(client, {
      refundRequestId: refundId,
      activityType:
        "COMMENT_ADDED",
      actorId: adminId,
      title: "Refund comment added",
      description:
        commentType ===
        "CUSTOMER_VISIBLE"
          ? "Customer-visible comment added."
          : "Internal comment added.",
      metadata: {
        comment_id:
          commentResult.rows[0].id,
        comment_type:
          commentType,
      },
      requestIp,
      userAgent,
    });

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message:
        "Refund comment added successfully.",
      comment:
        commentResult.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Comment rollback failed:",
          rollbackError
        );
      }
    }

    console.error(
      "Add refund comment failed:",
      error
    );

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to add refund comment.",
      });
  } finally {
    client.release();
  }
};

module.exports = {
  getRefundSummary,
  getRefundRequests,
  getRefundRequestById,
  assignRefundRequest,
  addRefundComment,
};
