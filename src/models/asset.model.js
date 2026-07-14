const pool = require("../config/db");

const Asset = {

  async getAll() {
    const result = await pool.query(`
      SELECT
        a.*,
        s.full_name
      FROM assets a
      LEFT JOIN staff s
      ON a.staff_id = s.id
      ORDER BY a.id DESC
    `);

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM assets WHERE id=$1",
      [id]
    );

    return result.rows[0];
  },

  async create(data) {

    const {
      company_id,
      staff_id,
      asset_code,
      asset_name,
      asset_category,
      brand,
      model,
      serial_number,
      purchase_date,
      purchase_cost,
      warranty_expiry,
      asset_status,
      assigned_date,
      return_date,
      remarks
    } = data;

    const result = await pool.query(
      `
      INSERT INTO assets
      (
        company_id,
        staff_id,
        asset_code,
        asset_name,
        asset_category,
        brand,
        model,
        serial_number,
        purchase_date,
        purchase_cost,
        warranty_expiry,
        asset_status,
        assigned_date,
        return_date,
        remarks
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
      `,
      [
        company_id,
        staff_id,
        asset_code,
        asset_name,
        asset_category,
        brand,
        model,
        serial_number,
        purchase_date,
        purchase_cost,
        warranty_expiry,
        asset_status,
        assigned_date,
        return_date,
        remarks
      ]
    );

    return result.rows[0];
  }

};

module.exports = Asset;

