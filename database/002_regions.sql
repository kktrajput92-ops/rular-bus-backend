CREATE TABLE IF NOT EXISTS regions (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    region_code VARCHAR(20) UNIQUE NOT NULL,
    region_name VARCHAR(100) NOT NULL,

    state VARCHAR(100),

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_by BIGINT,
    updated_by BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_region_company
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE CASCADE
);
