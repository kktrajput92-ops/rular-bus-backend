const pool = require("../config/db");

const EmployeeDocument = {

  async getAll() {
    const result = await pool.query(`
      SELECT
        d.*,
        s.full_name
      FROM employee_documents d
      LEFT JOIN staff s
      ON d.staff_id = s.id
      ORDER BY d.id DESC
    `);

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM employee_documents WHERE id=$1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      staff_id,
      document_type,
      document_number,
      document_name,
      file_path,
      issue_date,
      expiry_date,
      verification_status,
      remarks
    } = data;

    const result = await pool.query(
      `
      INSERT INTO employee_documents
      (
        company_id,
        staff_id,
        document_type,
        document_number,
        document_name,
        file_path,
        issue_date,
        expiry_date,
        verification_status,
        remarks
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        company_id,
        staff_id,
        document_type,
        document_number,
        document_name,
        file_path,
        issue_date,
        expiry_date,
        verification_status,
        remarks
      ]
    );

    return result.rows[0];
  }

};

module.exports = EmployeeDocument;
