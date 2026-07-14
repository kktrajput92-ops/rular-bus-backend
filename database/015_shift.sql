CREATE TABLE IF NOT EXISTS shifts (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    shift_code VARCHAR(20) UNIQUE NOT NULL,
    shift_name VARCHAR(100) NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    grace_in_minutes INTEGER DEFAULT 15,
    grace_out_minutes INTEGER DEFAULT 15,

    weekly_off VARCHAR(20) DEFAULT 'SUNDAY',

    overtime_allowed BOOLEAN DEFAULT TRUE,

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shift_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
);
