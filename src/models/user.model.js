const pool = require("../config/db");

const User = {

  async getAll() {
    const result = await pool.query(
      `SELECT
        u.*,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC`
    );

    return result.rows;
  },

  async getByUsername(username) {
    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    return result.rows[0];
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM users WHERE id=$1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      role_id,
      region_id,
      branch_id,
      office_id,
      counter_id,
      full_name,
      username,
      email,
      mobile,
      password_hash
    } = data;

    const result = await pool.query(
      `
      INSERT INTO users
      (
        company_id,
        role_id,
        region_id,
        branch_id,
        office_id,
        counter_id,
        full_name,
        username,
        email,
        mobile,
        password_hash
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      RETURNING *
      `,
      [
        company_id,
        role_id,
        region_id,
        branch_id,
        office_id,
        counter_id,
        full_name,
        username,
        email,
        mobile,
        password_hash
      ]
    );

    return result.rows[0];
  },
   

    async update(id, data) {

      const {
        company_id,
        role_id,
        region_id,
        branch_id,
        office_id,
        counter_id,
        full_name,
        username,
        email,
        mobile
      } = data;

      const result = await pool.query(
        `
        UPDATE users
        SET
          company_id = $1,
          role_id = $2,
          region_id = $3,
          branch_id = $4,
          office_id = $5,
          counter_id = $6,
          full_name = $7,
          username = $8,
          email = $9,
          mobile = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING *
        `,
        [
          company_id,
          role_id,
          region_id,
          branch_id,
          office_id,
          counter_id,
          full_name,
          username,
          email,
          mobile,
          id
        ]
      );

      return result.rows[0];
    }
,

async delete(id) {

  await pool.query(
    `
    DELETE FROM users
    WHERE id = $1
    `,
    [id]
  );

}
};

module.exports = User;

