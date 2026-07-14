const pool = require("../config/db");

const Attendance = {

  async getAll() {
    const result = await pool.query(`
      SELECT
        a.*,
        s.full_name
      FROM attendance a
      LEFT JOIN staff s
      ON a.staff_id = s.id
      ORDER BY attendance_date DESC
    `);

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM attendance WHERE id=$1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      staff_id,
      attendance_date,
      check_in,
      check_out,
      attendance_status,
      working_hours,
      remarks
    } = data;

    const result = await pool.query(
      `
      INSERT INTO attendance
      (
        company_id,
        staff_id,
        attendance_date,
        check_in,
        check_out,
        attendance_status,
        working_hours,
        remarks
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        company_id,
        staff_id,
        attendance_date,
        check_in,
        check_out,
        attendance_status,
        working_hours,
        remarks
      ]
    );

    return result.rows[0];
  }

};

module.exports = Attendance;

