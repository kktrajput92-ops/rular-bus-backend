const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Get All Users
const getUsers = async (req, res) => {
  try {
    const users = await User.getAll();

    res.json({
      success: true,
      data: users,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create User
const createUser = async (req, res) => {
  try {

    const password_hash = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      ...req.body,
      password_hash,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Login
const login = async (req, res) => {
  try {

    const { username, password } = req.body;

    const user = await User.getByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  login,
};
