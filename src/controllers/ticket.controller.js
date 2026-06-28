const pool = require("../config/db");
const QRCode = require("qrcode");

// Create Ticket
const createTicket = async (req, res) => {
  try {
    const { booking_id } = req.body;

    const check = await pool.query(
      "SELECT * FROM tickets WHERE booking_id=$1",
      [booking_id]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ticket already generated",
      });
    }

    const count = await pool.query(
      "SELECT COUNT(*) FROM tickets"
    );

    const ticket_number =
      "RB2026" +
      String(Number(count.rows[0].count) + 1).padStart(5, "0");

    const qr_code = await QRCode.toDataURL(
      JSON.stringify({
        ticket_number,
        booking_id,
      })
    );

    const result = await pool.query(
      `INSERT INTO tickets
      (booking_id,ticket_number,qr_code)
      VALUES($1,$2,$3)
      RETURNING *`,
      [booking_id, ticket_number, qr_code]
    );

    res.json({
      success: true,
      message: "Ticket Generated Successfully",
      ticket: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Tickets
const getAllTickets = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
      tickets.id,
      tickets.ticket_number,
      tickets.qr_code,
      passengers.full_name,
      passengers.phone,
      routes.source,
      routes.destination,
      bookings.seat_number,
      bookings.booking_status,
      schedules.departure_time

      FROM tickets

      JOIN bookings
      ON tickets.booking_id=bookings.id

      JOIN passengers
      ON bookings.passenger_id=passengers.id

      JOIN schedules
      ON bookings.schedule_id=schedules.id

      JOIN routes
      ON schedules.route_id=routes.id

      ORDER BY tickets.id DESC
    `);

    res.json({
      success: true,
      tickets: result.rows,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Verify Ticket
const verifyTicket = async (req, res) => {
  try {

    const { ticket_number } = req.params;

    const result = await pool.query(`
      SELECT
      tickets.ticket_number,
      passengers.full_name,
      passengers.phone,
      routes.source,
      routes.destination,
      bookings.seat_number,
      bookings.booking_status,
      schedules.departure_time

      FROM tickets

      JOIN bookings
      ON tickets.booking_id=bookings.id

      JOIN passengers
      ON bookings.passenger_id=passengers.id

      JOIN schedules
      ON bookings.schedule_id=schedules.id

      JOIN routes
      ON schedules.route_id=routes.id

      WHERE tickets.ticket_number=$1
    `,[ticket_number]);

    if(result.rows.length===0){
      return res.status(404).json({
        success:false,
        message:"Invalid Ticket"
      });
    }

    res.json({
      success:true,
      message:"Valid Ticket",
      ticket:result.rows[0]
    });

  } catch(err){

    console.error(err);

    res.status(500).json({
      success:false,
      message:err.message
    });

  }
};

// Delete Ticket
const deleteTicket = async (req,res)=>{
  try{

    const {id}=req.params;

    const result=await pool.query(
      "DELETE FROM tickets WHERE id=$1 RETURNING *",
      [id]
    );

    if(result.rows.length===0){
      return res.status(404).json({
        success:false,
        message:"Ticket not found"
      });
    }

    res.json({
      success:true,
      message:"Ticket Deleted Successfully"
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      success:false,
      message:err.message
    });

  }
};

module.exports={
  createTicket,
  getAllTickets,
  verifyTicket,
  deleteTicket,
};
