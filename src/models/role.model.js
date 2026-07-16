const pool = require("../config/db");

const Role = {

  async getAll(departmentId) {

  let query = "SELECT * FROM roles";
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
      "SELECT * FROM roles WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {

    const {
      role_code,
      role_name,
      description
    } = data;

    const result = await pool.query(
      `
      INSERT INTO roles
      (
        role_code,
        role_name,
        description
      )
      VALUES
      (
        $1,$2,$3
      )
      RETURNING *
      `,
      [
        role_code,
        role_name,
        description
      ]
    );

    return result.rows[0];
  }
,

async update(id, data) {

  const {
    role_code,
    role_name,
    description
  } = data;

  const result = await pool.query(
    `
    UPDATE roles
    SET
      role_code = $1,
      role_name = $2,
      description = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
    `,
    [
      role_code,
      role_name,
      description,
      id
    ]
  );

  return result.rows[0];
}
};

module.exports = Role;
