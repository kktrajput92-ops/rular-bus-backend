const pool = require("../config/db");

const Region = {

  async getAll(companyId) {

  let query = "SELECT * FROM regions";
  const values = [];

  if (companyId) {
    values.push(companyId);
    query += " WHERE company_id = $1";
  }

  query += " ORDER BY id DESC";

  const result = await pool.query(query, values);

  return result.rows;
},

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM regions WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      region_code,
      region_name,
      state
    } = data;

    const result = await pool.query(
      `
      INSERT INTO regions
      (
        company_id,
        region_code,
        region_name,
        state
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING *
      `,
      [
        company_id,
        region_code,
        region_name,
        state
      ]
    );

    return result.rows[0];
  }

};

module.exports = Region;

