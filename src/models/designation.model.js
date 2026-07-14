const pool = require("../config/db");

const Designation = {

  async getAll() {
    const result = await pool.query(
      "SELECT * FROM designations ORDER BY id ASC"
    );

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM designations WHERE id = $1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      department_id,
      designation_code,
      designation_name,
      description
    } = data;

    const result = await pool.query(
      `
      INSERT INTO designations
      (
        company_id,
        department_id,
        designation_code,
        designation_name,
        description
      )
      VALUES
      (
        $1,$2,$3,$4,$5
      )
      RETURNING *
      `,
      [
        company_id,
        department_id,
        designation_code,
        designation_name,
        description
      ]
    );

    return result.rows[0];
  }

};

module.exports = Designation;

