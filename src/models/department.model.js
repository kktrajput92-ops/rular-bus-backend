const pool = require("../config/db");

const Department = {

 async getAll(officeId) {

  let query = "SELECT * FROM departments";
  const values = [];

  if (officeId) {
    values.push(officeId);
    query += " WHERE office_id = $1";
  }

  query += " ORDER BY id ASC";

  const result = await pool.query(query, values);

  return result.rows;
},

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM departments WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      department_code,
      department_name,
      description
    } = data;

    const result = await pool.query(
      `
      INSERT INTO departments
      (
        company_id,
        department_code,
        department_name,
        description
      )
      VALUES
      (
        $1,$2,$3,$4
      )
      RETURNING *
      `,
      [
        company_id,
        department_code,
        department_name,
        description
      ]
    );

    return result.rows[0];
  }
,

async update(id, data) {

  const {
  department_code,
  department_name,
  description
} = data;

  const result = await pool.query(
    `
    UPDATE departments
SET
  department_code = $1,
  department_name = $2,
  description = $3,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $4
RETURNING *
    `,
    [
  department_code,
  department_name,
  description,
  id
]
  );

  return result.rows[0];
}
,

async delete(id) {

  await pool.query(
    `
    DELETE FROM departments
    WHERE id = $1
    `,
    [id]
  );

}
};

module.exports = Department;
