const pool = require("../config/db");

const Region = {

  async getAll() {
    const result = await pool.query(
      "SELECT * FROM regions ORDER BY id DESC"
    );
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

