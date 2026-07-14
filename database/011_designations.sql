CREATE TABLE IF NOT EXISTS designations (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,

    designation_code VARCHAR(30) UNIQUE NOT NULL,
    designation_name VARCHAR(100) NOT NULL,

    description TEXT,

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_designation_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_designation_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE CASCADE
);

