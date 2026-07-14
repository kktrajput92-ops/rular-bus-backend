const pool = require("../config/db");

const Payroll = {

  async getAll() {
    const result = await pool.query(`
      SELECT
        p.*,
        s.full_name
      FROM payroll p
      LEFT JOIN staff s
      ON p.staff_id = s.id
      ORDER BY p.id DESC
    `);

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM payroll WHERE id=$1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      staff_id,
      payroll_month,
      payroll_year,
      basic_salary,
      hra,
      da,
      allowances,
      deductions,
      net_salary,
      payment_status,
      paid_date,
      remarks
    } = data;

    const result = await pool.query(
      `
      INSERT INTO payroll
      (
        company_id,
        staff_id,
        payroll_month,
        payroll_year,
        basic_salary,
        hra,
        da,
        allowances,
        deductions,
        net_salary,
        payment_status,
        paid_date,
        remarks
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
      `,
      [
        company_id,
        staff_id,
        payroll_month,
        payroll_year,
        basic_salary,
        hra,
        da,
        allowances,
        deductions,
        net_salary,
        payment_status,
        paid_date,
        remarks
      ]
    );

    return result.rows[0];
  }

};

module.exports = Payroll;

