const pool = require("../config/db");

const Staff = {

  async getAll() {
    const result = await pool.query(`
      SELECT
        s.*,
        d.department_name,
        dg.designation_name,
        r.role_name
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN designations dg ON s.designation_id = dg.id
      LEFT JOIN roles r ON s.role_id = r.id
      ORDER BY s.id ASC
    `);

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

};

module.exports = Staff;


