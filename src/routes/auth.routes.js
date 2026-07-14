const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/auth.controller");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     responses:
 *       201:
 *         description: Registration successful
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", login);

module.exports = router;
