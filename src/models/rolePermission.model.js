const pool = require("../config/db");

const RolePermission = {

  async getAll() {
    const result = await pool.query(`
      SELECT
        rp.id,
        r.role_name,
        p.permission_code,
        p.permission_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      ORDER BY rp.id ASC
    `);

    return result.rows;
  },

  async create(role_id, permission_id) {
    const result = await pool.query(
      `
      INSERT INTO role_permissions
      (role_id, permission_id)
      VALUES ($1, $2)
      ON CONFLICT (role_id, permission_id)
      DO NOTHING
      RETURNING *
      `,
      [role_id, permission_id]
    );

    return result.rows[0];
  }

};

module.exports = RolePermission;
