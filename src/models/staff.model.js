const pool = require("../config/db");

const Staff = {

  async getAll(filters = {}) {
    const {
  page = 1,
  limit = 10,
  search = "",
  status = ""
} = filters;

const offset = (page - 1) * limit;

let query = `
SELECT
  s.*,
  c.company_name,
  rg.region_name,
  b.branch_name,
  o.office_name,
  d.department_name,
  dg.designation_name,
  r.role_name
FROM staff s
LEFT JOIN companies c ON s.company_id = c.id
LEFT JOIN regions rg ON s.region_id = rg.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN offices o ON s.office_id = o.id
LEFT JOIN departments d ON s.department_id = d.id
LEFT JOIN designations dg ON s.designation_id = dg.id
LEFT JOIN roles r ON s.role_id = r.id
WHERE 1=1
`;

const values = [];

if (search) {
  values.push(`%${search}%`);
  query += `
    AND (
      s.full_name ILIKE $${values.length}
      OR s.employee_code ILIKE $${values.length}
      OR s.mobile ILIKE $${values.length}
    )
  `;
}

if (status) {
  values.push(status);
  query += ` AND s.status = $${values.length}`;
}

values.push(limit);
query += ` LIMIT $${values.length}`;

values.push(offset);
query += ` OFFSET $${values.length}`;

const result = await pool.query(query, values);

return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM staff WHERE id = $1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      region_id,
      branch_id,
      office_id,
      department_id,
      designation_id,
      user_id,
      role_id,
      employee_code,
      full_name,
      mobile,
      email,
      gender,
      date_of_birth,
      joining_date,
      employment_type,
      salary,
      reporting_manager,
      address
    } = data;

    const result = await pool.query(
      `
      INSERT INTO staff
      (
        company_id,
        region_id,
        branch_id,
        office_id,
        department_id,
        designation_id,
        user_id,
        role_id,
        employee_code,
        full_name,
        mobile,
        email,
        gender,
        date_of_birth,
        joining_date,
        employment_type,
        salary,
        reporting_manager,
        address
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      RETURNING *
      `,
      [
        company_id,
        region_id,
        branch_id,
        office_id,
        department_id,
        designation_id,
        user_id,
        role_id,
        employee_code,
        full_name,
        mobile,
        email,
        gender,
        date_of_birth,
        joining_date,
        employment_type,
        salary,
        reporting_manager,
        address
      ]
    );

    return result.rows[0];
  }
,

async update(id, data) {

  const {
    full_name,
    mobile,
    email,
    address
  } = data;

  const result = await pool.query(
    `
    UPDATE staff
    SET
      full_name = $1,
      mobile = $2,
      email = $3,
      address = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
    `,
    [
      full_name,
      mobile,
      email,
      address,
      id
    ]
  );

  return result.rows[0];
}
};

module.exports = Staff;


