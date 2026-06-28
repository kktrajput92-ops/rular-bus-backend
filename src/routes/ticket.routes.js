const express = require("express");

const router = express.Router();

const {
  createTicket,
  getAllTickets,
  deleteTicket,
} = require("../controllers/ticket.controller");

router.post("/", createTicket);
router.get("/", getAllTickets);
router.delete("/:id", deleteTicket);

module.exports = router;
