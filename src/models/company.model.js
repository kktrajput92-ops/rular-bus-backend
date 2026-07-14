const pool = require("../config/db");

const Company = {
  async getAll() {
    const result = await pool.query(
      "SELECT * FROM companies ORDER BY id DESC"
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM companies WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    const {
      company_code,
      company_name,
      legal_name,
      company_type,
      email,
      phone
    } = data;

    const result = await pool.query(
      `INSERT INTO companies
      (company_code, company_name, legal_name, company_type, email, phone)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        company_code,
        company_name,
        legal_name,
        company_type,
        email,
        phone
      ]
    );

    return result.rows[0];
  }
};

module.exports = Company;
