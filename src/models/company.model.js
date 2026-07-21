const pool = require("../config/db");

const Company = {
  async getAll() {
    const result = await pool.query(
      "SELECT * FROM companies ORDER BY id DESC"
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM companies WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  async create(data) {
    const {
  company_code,
  company_name,
  legal_name,
  company_type,
  gst_number,
  pan_number,
  registration_no,
  email,
  phone,
  alternate_phone,
  website,
  address,
  city,
  state,
  country,
  pincode,
  status,
  short_name,
  primary_color,
  secondary_color,
  logo_url,
  signature_url,
  qr_base_url,
} = data;

    const result = await pool.query(
     `INSERT INTO companies (
  company_code,
  company_name,
  legal_name,
  company_type,
  gst_number,
  pan_number,
  registration_no,
  email,
  phone,
  alternate_phone,
  website,
  address,
  city,
  state,
  country,
  pincode,
  status,
  short_name,
  primary_color,
  secondary_color,
  logo_url,
  signature_url,
  qr_base_url
)
VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
  $11,$12,$13,$14,$15,$16,$17,$18,
  $19,$20,$21,$22,$23
)
RETURNING *`,
[
  company_code,
  company_name,
  legal_name,
  company_type,
  gst_number,
  pan_number,
  registration_no,
  email,
  phone,
  alternate_phone,
  website,
  address,
  city,
  state,
  country,
  pincode,
  status,
  short_name,
  primary_color,
  secondary_color,
  logo_url,
  signature_url,
  qr_base_url,
]
    );

    return result.rows[0];
  },

  async update(id, data) {
    const {
  company_name,
  legal_name,
  company_type,
  gst_number,
  pan_number,
  registration_no,
  email,
  phone,
  alternate_phone,
  website,
  logo_url,
  address,
  city,
  state,
  country,
  pincode,
  status,
  short_name,
  primary_color,
  secondary_color,
  signature_url,
  qr_base_url,
} = data;

    const result = await pool.query(
  `UPDATE companies
   SET
    company_name = $1,
    legal_name = $2,
    company_type = $3,
    gst_number = $4,
    pan_number = $5,
    registration_no = $6,
    email = $7,
    phone = $8,
    alternate_phone = $9,
    website = $10,
    logo_url = $11,
    address = $12,
    city = $13,
    state = $14,
    country = $15,
    pincode = $16,
    status = $17,
    short_name = $18,
    primary_color = $19,
    secondary_color = $20,
    signature_url = $21,
    qr_base_url = $22,
    updated_at = CURRENT_TIMESTAMP
   WHERE id = $23
   RETURNING *`,
  [
    company_name,
    legal_name,
    company_type,
    gst_number,
    pan_number,
    registration_no,
    email,
    phone,
    alternate_phone,
    website,
    logo_url,
    address,
    city,
    state,
    country,
    pincode,
    status,
    short_name,
    primary_color,
    secondary_color,
    signature_url,
    qr_base_url,
    id,
  ]
);
    

    return result.rows[0];
   },
  async updateBranding(id, logo_url, signature_url) {
  const result = await pool.query(
    `UPDATE companies
     SET logo_url = COALESCE($1, logo_url),
         signature_url = COALESCE($2, signature_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [logo_url, signature_url, id]
  );

  return result.rows[0];
}, 
 
};

module.exports = Company;
