const express = require("express");
const router = express.Router();

const {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
} = require("../controllers/staff.controller");

const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff list fetched successfully
 */
/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff by ID
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff details fetched successfully
 */
/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create new staff
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Staff created successfully
 */
router.get("/", auth, authorize(1,2,3), getStaff);
router.get("/:id", auth, authorize(1,2,3), getStaffById);
router.post("/", auth, authorize(1,2), createStaff);
router.put("/:id", auth, authorize(1,2), updateStaff);

module.exports = router;

