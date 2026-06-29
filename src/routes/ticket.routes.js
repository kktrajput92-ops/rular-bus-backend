const express = require("express");

const router = express.Router();

const {
  createTicket,
  getAllTickets,
  verifyTicket,
  downloadTicket,
  deleteTicket,
} = require("../controllers/ticket.controller");

// Create Ticket
router.post("/", createTicket);

// Get All Tickets
router.get("/", getAllTickets);

// Verify Ticket
router.get("/verify/:ticket_number", verifyTicket);

// Download PDF
router.get("/pdf/:ticket_number", downloadTicket);

// Delete Ticket
router.delete("/:id", deleteTicket);

module.exports = router;
