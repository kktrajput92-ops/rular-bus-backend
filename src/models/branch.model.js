const pool = require("../config/db");

const Branch = {

  async getAll() {
    const result = await pool.query(
      "SELECT * FROM branches ORDER BY id DESC"
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM branches WHERE id=$1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      region_id,
      branch_code,
      branch_name,
      branch_manager,
      mobile,
      email,
      address,
      city,
      state,
      pincode
    } = data;

    const result = await pool.query(
      `
      INSERT INTO branches
      (
        company_id,
        region_id,
        branch_code,
        branch_name,
        branch_manager,
        mobile,
        email,
        address,
        city,
        state,
        pincode
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
        branch_code,
        branch_name,
        branch_manager,
        mobile,
        email,
        address,
        city,
        state,
        pincode
      ]
    );

    return result.rows[0];
  }

};

module.exports = Branch;
