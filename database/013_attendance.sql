CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,

    attendance_date DATE NOT NULL,

    check_in TIMESTAMP,
    check_out TIMESTAMP,

    attendance_status VARCHAR(20) DEFAULT 'PRESENT',

    working_hours NUMERIC(5,2),

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_staff_attendance
        UNIQUE(staff_id, attendance_date)
);
