const express = require("express");

const router = express.Router();

const {
  createTicket,
  getAllTickets,
  deleteTicket,
  verifyTicket,
} = require("../controllers/ticket.controller");

// Create Ticket
router.post("/", createTicket);

// Get All Tickets
router.get("/", getAllTickets);

// Verify Ticket
router.get("/verify/:ticket_number", verifyTicket);

// Delete Ticket
router.delete("/:id", deleteTicket);

module.exports = router;

