const pool = require("../config/db");

const Audit = {

  async create(data) {

    const {
      company_id,
      user_id,
      module_name,
      action,
      record_id,
      ip_address,
      user_agent
    } = data;

    const result = await pool.query(
      `INSERT INTO audit_logs
      (
        company_id,
        user_id,
        module_name,
        action,
        record_id,
        ip_address,
        user_agent
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        company_id,
        user_id,
        module_name,
        action,
        record_id,
        ip_address,
        user_agent
      ]
    );

    return result.rows[0];
  }

};

module.exports = Audit;

