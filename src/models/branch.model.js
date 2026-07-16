const pool = require("../config/db");

const Branch = {

  async getAll(regionId) {

  let query = "SELECT * FROM branches";
  const values = [];

  if (regionId) {
    values.push(regionId);
    query += " WHERE region_id = $1";
  }

  query += " ORDER BY id DESC";

  const result = await pool.query(query, values);

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
