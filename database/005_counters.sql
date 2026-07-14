CREATE TABLE IF NOT EXISTS counters (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    region_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    office_id BIGINT NOT NULL,

    counter_code VARCHAR(20) UNIQUE NOT NULL,
    counter_name VARCHAR(150) NOT NULL,

    counter_type VARCHAR(50) DEFAULT 'BOOKING',

    operator_name VARCHAR(120),
    mobile VARCHAR(20),
    email VARCHAR(120),

    address TEXT,

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_by BIGINT,
    updated_by BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_counter_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_counter_region
        FOREIGN KEY (region_id)
        REFERENCES regions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_counter_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_counter_office
        FOREIGN KEY (office_id)
        REFERENCES offices(id)
        ON DELETE CASCADE
);
