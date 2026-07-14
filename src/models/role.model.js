const pool = require("../config/db");

const Role = {

  async getAll() {
    const result = await pool.query(
      "SELECT * FROM roles ORDER BY id ASC"
    );
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

};

module.exports = Role;
