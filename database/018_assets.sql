CREATE TABLE IF NOT EXISTS assets (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    staff_id BIGINT,

    asset_code VARCHAR(30) UNIQUE NOT NULL,
    asset_name VARCHAR(150) NOT NULL,
    asset_category VARCHAR(50) NOT NULL,

    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),

    purchase_date DATE,
    purchase_cost NUMERIC(12,2),

    warranty_expiry DATE,

    asset_status VARCHAR(30) DEFAULT 'AVAILABLE',

    assigned_date DATE,
    return_date DATE,

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_asset_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_asset_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id)
        ON DELETE SET NULL
);

