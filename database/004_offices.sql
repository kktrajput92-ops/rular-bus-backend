CREATE TABLE IF NOT EXISTS offices (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    region_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,

    office_code VARCHAR(20) UNIQUE NOT NULL,
    office_name VARCHAR(150) NOT NULL,

    office_type VARCHAR(50) DEFAULT 'MAIN',

    manager_name VARCHAR(120),
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

    CONSTRAINT fk_office_company
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_office_region
      FOREIGN KEY (region_id)
      REFERENCES regions(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_office_branch
      FOREIGN KEY (branch_id)
      REFERENCES branches(id)
      ON DELETE CASCADE
);
