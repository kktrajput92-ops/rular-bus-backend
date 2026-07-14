CREATE TABLE IF NOT EXISTS staff (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    region_id BIGINT,
    branch_id BIGINT,
    office_id BIGINT,

    department_id BIGINT NOT NULL,
    designation_id BIGINT NOT NULL,

    user_id BIGINT,
    role_id BIGINT NOT NULL,

    employee_code VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,

    mobile VARCHAR(20),
    email VARCHAR(150),

    gender VARCHAR(10),
    date_of_birth DATE,

    joining_date DATE NOT NULL,

    employment_type VARCHAR(30) DEFAULT 'PERMANENT',

    salary NUMERIC(12,2) DEFAULT 0,

    reporting_manager BIGINT,

    address TEXT,

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_staff_company
        FOREIGN KEY (company_id) REFERENCES companies(id),

    CONSTRAINT fk_staff_region
        FOREIGN KEY (region_id) REFERENCES regions(id),

    CONSTRAINT fk_staff_branch
        FOREIGN KEY (branch_id) REFERENCES branches(id),

    CONSTRAINT fk_staff_office
        FOREIGN KEY (office_id) REFERENCES offices(id),

    CONSTRAINT fk_staff_department
        FOREIGN KEY (department_id) REFERENCES departments(id),

    CONSTRAINT fk_staff_designation
        FOREIGN KEY (designation_id) REFERENCES designations(id),

    CONSTRAINT fk_staff_user
        FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT fk_staff_role
        FOREIGN KEY (role_id) REFERENCES roles(id),

    CONSTRAINT fk_staff_manager
        FOREIGN KEY (reporting_manager) REFERENCES staff(id)
);

