CREATE TABLE IF NOT EXISTS employee_documents (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,

    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),

    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,

    issue_date DATE,
    expiry_date DATE,

    verification_status VARCHAR(20) DEFAULT 'PENDING',

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id)
        ON DELETE CASCADE
);
