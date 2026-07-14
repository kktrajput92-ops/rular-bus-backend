CREATE TABLE IF NOT EXISTS branches (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    region_id BIGINT NOT NULL,

    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name VARCHAR(150) NOT NULL,

    branch_manager VARCHAR(120),
    mobile VARCHAR(20),
    email VARCHAR(120),

    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_by BIGINT,
    updated_by BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_branch_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_branch_region
        FOREIGN KEY (region_id)
        REFERENCES regions(id)
        ON DELETE CASCADE
);
