const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const register = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const checkUser = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR phone=$2",
      [email, phone]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(full_name,email,phone,password)
       VALUES($1,$2,$3,$4)
       RETURNING id,full_name,email,phone`
      ,
      [full_name, email, phone, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

   const result = await pool.query(
  `SELECT
    id,
    company_id,
    role_id,
    full_name,
    username,
    email,
    mobile,
    password_hash
   FROM users
   WHERE email = $1`,
  [email]
);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);


    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
       id: user.id,
company_id: user.company_id,
role_id: user.role_id,
email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: user.id,
full_name: user.full_name,
username: user.username,
email: user.email,
mobile: user.mobile,
role_id: user.role_id,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  register,
  login,
};
