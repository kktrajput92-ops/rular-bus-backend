CREATE TABLE IF NOT EXISTS payroll (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,

    payroll_month VARCHAR(20) NOT NULL,
    payroll_year INTEGER NOT NULL,

    basic_salary NUMERIC(12,2) NOT NULL,

    hra NUMERIC(12,2) DEFAULT 0,
    da NUMERIC(12,2) DEFAULT 0,
    allowances NUMERIC(12,2) DEFAULT 0,

    deductions NUMERIC(12,2) DEFAULT 0,

    net_salary NUMERIC(12,2) NOT NULL,

    payment_status VARCHAR(20) DEFAULT 'PENDING',

    paid_date DATE,

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payroll_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payroll_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_payroll_month
        UNIQUE (staff_id, payroll_month, payroll_year)
);

