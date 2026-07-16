const pool = require("../config/db");

const Designation = {

 async getAll(departmentId) {

  let query = "SELECT * FROM designations";
  const values = [];

  if (departmentId) {
    values.push(departmentId);
    query += " WHERE department_id = $1";
  }

  query += " ORDER BY id ASC";

  const result = await pool.query(query, values);

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
,

  async update(id, data) {

    const {
      designation_code,
      designation_name,
      description
    } = data;

    const result = await pool.query(
      `
      UPDATE designations
      SET
        designation_code = $1,
        designation_name = $2,
        description = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
      `,
      [
        designation_code,
        designation_name,
        description,
        id
      ]
    );

    return result.rows[0];
  }
};

module.exports = Designation;

