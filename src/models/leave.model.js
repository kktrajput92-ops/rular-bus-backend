const pool = require("../config/db");

const Leave = {

  async getAll() {
    const result = await pool.query(`
      SELECT
        l.*,
        s.full_name
      FROM leave_requests l
      LEFT JOIN staff s
      ON l.staff_id = s.id
      ORDER BY l.created_at DESC
    `);

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM leave_requests WHERE id=$1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      staff_id,
      leave_type,
      from_date,
      to_date,
      total_days,
      reason
    } = data;

    const result = await pool.query(
      `
      INSERT INTO leave_requests
      (
        company_id,
        staff_id,
        leave_type,
        from_date,
        to_date,
        total_days,
        reason
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        company_id,
        staff_id,
        leave_type,
        from_date,
        to_date,
        total_days,
        reason
      ]
    );

    return result.rows[0];
  }

};

module.exports = Leave;

