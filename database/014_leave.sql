CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,

    leave_type VARCHAR(30) NOT NULL,

    from_date DATE NOT NULL,
    to_date DATE NOT NULL,

    total_days NUMERIC(5,2) NOT NULL,

    reason TEXT,

    approval_status VARCHAR(20) DEFAULT 'PENDING',

    approved_by BIGINT,

    approved_at TIMESTAMP,

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_leave_company
        FOREIGN KEY(company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_leave_staff
        FOREIGN KEY(staff_id)
        REFERENCES staff(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_leave_approved_by
        FOREIGN KEY(approved_by)
        REFERENCES staff(id)
        ON DELETE SET NULL
);
