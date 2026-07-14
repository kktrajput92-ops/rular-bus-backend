
-- ===========================================
-- RULAR BUS ERP
-- MASTER SEED DATA
-- Version : v0.4.1
-- ===========================================

INSERT INTO companies
(id, company_code, company_name, legal_name, company_type, email, phone, status)
VALUES
(1,'RB001','Rular Bus','Rular Bus Pvt Ltd','PRIVATE','admin@rularbus.com','9876543210','ACTIVE')
ON CONFLICT (id) DO NOTHING;
-- ===========================
-- REGION
-- ===========================

INSERT INTO regions
(id, company_id, region_code, region_name, status)
VALUES
(1,1,'RG001','North Region','ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- BRANCH
-- ===========================

INSERT INTO branches
(id, company_id, region_id, branch_code, branch_name, status)
VALUES
(1,1,1,'BR001','Gurugram Branch','ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- OFFICE
-- ===========================

INSERT INTO offices
(
    id,
    company_id,
    region_id,
    branch_id,
    office_code,
    office_name,
    office_type,
    manager_name,
    mobile,
    email,
    address,
    city,
    state,
    pincode,
    status
)
VALUES
(
    1,
    1,
    1,
    1,
    'HO001',
    'Head Office',
    'HEAD_OFFICE',
    'Kuldeep Kumar',
    '9876543210',
    'admin@rularbus.com',
    'Rular Bus Head Office',
    'Gurugram',
    'Haryana',
    '122001',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- COUNTER
-- ===========================

INSERT INTO counters
(
    id,
    company_id,
    region_id,
    branch_id,
    office_id,
    counter_code,
    counter_name,
    counter_type,
    operator_name,
    mobile,
    email,
    address,
    status
)
VALUES
(
    1,
    1,
    1,
    1,
    1,
    'CNT001',
    'Head Office Counter',
    'BOOKING',
    'Kuldeep Kumar',
    '9876543210',
    'admin@rularbus.com',
    'Rular Bus Head Office',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

