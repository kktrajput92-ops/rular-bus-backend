const pool = require("../config/db");

const Counter = {

  async getAll() {
    const result = await pool.query(
      "SELECT * FROM counters ORDER BY id DESC"
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM counters WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      region_id,
      branch_id,
      office_id,
      counter_code,
      counter_name,
      counter_type,
      operator_name,
      mobile,
      email,
      address
    } = data;

    const result = await pool.query(
      `
      INSERT INTO counters
      (
        company_id,
        region_id,
        branch_id,
        office_id,
        counter_code,
        counter_name,
        counter_type,
        operator_name,
        mobile,
        email,
        address
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      RETURNING *
      `,
      [
        company_id,
        region_id,
        branch_id,
        office_id,
        counter_code,
        counter_name,
        counter_type,
        operator_name,
        mobile,
        email,
        address
      ]
    );

    return result.rows[0];
  }

};

module.exports = Counter;
