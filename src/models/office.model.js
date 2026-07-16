const pool = require("../config/db");

const Office = {

  async getAll(branchId) {

  let query = "SELECT * FROM offices";
  const values = [];

  if (branchId) {
    values.push(branchId);
    query += " WHERE branch_id = $1";
  }

  query += " ORDER BY id DESC";

  const result = await pool.query(query, values);

  return result.rows;
},

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM offices WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      region_id,
      branch_id,
      office_code,
      office_name,
      office_type,
      manager_name,
      mobile,
      email,
      address,
      city,
      state,
      pincode
    } = data;

    const result = await pool.query(
      `
      INSERT INTO offices
      (
        company_id,
        region_id,
        branch_id,
        office_code,
        office_name,
        office_type,
        manager_name,
        mobile,
        email,
        address,
        city,
        state,
        pincode
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING *
      `,
      [
        company_id,
        region_id,
        branch_id,
        office_code,
        office_name,
        office_type,
        manager_name,
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

module.exports = Office;

