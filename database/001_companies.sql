CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,

    company_code VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(200),

    company_type VARCHAR(50),

    gst_number VARCHAR(20),
    pan_number VARCHAR(20),

    email VARCHAR(150),
    phone VARCHAR(20),
    website VARCHAR(150),

    logo_url TEXT,

    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),

    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(10) DEFAULT 'INR',

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_by BIGINT,
    updated_by BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
