const express = require("express");
const router = express.Router();

const {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  uploadStaffPhoto,
} = require("../controllers/staff.controller");

const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const upload = require("../middleware/uploadStaffPhoto");
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
router.get("/", auth, authorize("staff.view"), getStaff);
router.get("/:id", auth, authorize("staff.view"), getStaffById)
router.post("/", auth, authorize("staff.create"), createStaff);
router.put("/:id", auth, authorize("staff.update"), updateStaff);
router.delete("/:id", auth, authorize("staff.delete"), deleteStaff);
router.post(
  "/:id/photo",
  auth,
  authorize("staff.update"),
  upload.single("photo"),
  uploadStaffPhoto
);

module.exports = router;

