const pool = require("../config/db");

const Permission = {

  async getAll() {
    const result = await pool.query(
      "SELECT * FROM permissions ORDER BY id ASC"
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM permissions WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {

    const {
      permission_code,
      permission_name,
      module_name,
      description
    } = data;

    const result = await pool.query(
      `
      INSERT INTO permissions
      (
        permission_code,
        permission_name,
        module_name,
        description
      )
      VALUES
      (
        $1,$2,$3,$4
      )
      RETURNING *
      `,
      [
        permission_code,
        permission_name,
        module_name,
        description
      ]
    );

    return result.rows[0];
  }

};

module.exports = Permission;
