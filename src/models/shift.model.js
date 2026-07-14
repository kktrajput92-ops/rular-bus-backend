const pool = require("../config/db");

const Shift = {

  async getAll() {
    const result = await pool.query(`
      SELECT *
      FROM shifts
      ORDER BY id DESC
    `);

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM shifts WHERE id=$1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      shift_code,
      shift_name,
      start_time,
      end_time,
      grace_in_minutes,
      grace_out_minutes,
      weekly_off,
      overtime_allowed
    } = data;

    const result = await pool.query(
      `
      INSERT INTO shifts
      (
        company_id,
        shift_code,
        shift_name,
        start_time,
        end_time,
        grace_in_minutes,
        grace_out_minutes,
        weekly_off,
        overtime_allowed
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        company_id,
        shift_code,
        shift_name,
        start_time,
        end_time,
        grace_in_minutes,
        grace_out_minutes,
        weekly_off,
        overtime_allowed
      ]
    );

    return result.rows[0];
  }

};

module.exports = Shift;
