const pool = require("../config/db");

// Add Booking
const addBooking = async (req, res) => {
  try {

    const {
  passenger_id,
  schedule_id,
  journey_id,
  seat_number
} = req.body;
    const passenger = await pool.query(
      "SELECT id FROM passengers WHERE id=$1",
      [passenger_id]
    );

    if (passenger.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Passenger not found",
      });
    }

    // Schedule + Total Seats
    const schedule = await pool.query(`
      SELECT buses.total_seats
      FROM schedules
      JOIN buses
      ON schedules.bus_id=buses.id
      WHERE schedules.id=$1
    `,[schedule_id]);

    if(schedule.rows.length===0){
      return res.status(404).json({
        success:false,
        message:"Schedule not found",
      });
    }

    const totalSeats = schedule.rows[0].total_seats;

    if(seat_number < 1 || seat_number > totalSeats){
      return res.status(400).json({
        success:false,
        message:`Seat must be between 1 and ${totalSeats}`,
      });
    }

    // Duplicate Seat
    const seatCheck = await pool.query(
      `SELECT id
       FROM bookings
       WHERE schedule_id=$1
       AND seat_number=$2
       AND booking_status='confirmed'`,
      [schedule_id, seat_number]
    );

    if(seatCheck.rows.length>0){
      return res.status(400).json({
        success:false,
        message:"Seat already booked",
      });
    }

    const result = await pool.query(
      `INSERT INTO bookings
      (passenger_id,schedule_id,seat_number)
      VALUES($1,$2,$3)
      RETURNING *`,
      [passenger_id,schedule_id,seat_number]
    );

    res.json({
      success:true,
      message:"Booking Created Successfully",
      booking:result.rows[0],
    });

  } catch(err){

    console.error(err);

    res.status(500).json({
      success:false,
      message:err.message,
    });

  }
};

// Get All Bookings
const getAllBookings = async (req,res)=>{
  try{

    const result=await pool.query(`
      SELECT
      bookings.id,
      passengers.full_name,
      passengers.phone,
      routes.source,
      routes.destination,
      bookings.seat_number,
      bookings.booking_status,
      schedules.departure_time

      FROM bookings

      JOIN passengers
      ON bookings.passenger_id=passengers.id

      JOIN schedules
      ON bookings.schedule_id=schedules.id

      JOIN routes
      ON schedules.route_id=routes.id

      ORDER BY bookings.id DESC
    `);

    res.json({
      success:true,
      bookings:result.rows,
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      success:false,
      message:err.message,
    });

  }
};

// Update Booking
const updateBooking = async (req,res)=>{
  try{

    const {id}=req.params;
    const {schedule_id,seat_number}=req.body;

    const schedule=await pool.query(`
      SELECT buses.total_seats
      FROM schedules
      JOIN buses
      ON schedules.bus_id=buses.id
      WHERE schedules.id=$1
    `,[schedule_id]);

    if(schedule.rows.length===0){
      return res.status(404).json({
        success:false,
        message:"Schedule not found",
      });
    }

    const totalSeats=schedule.rows[0].total_seats;

    if(seat_number<1 || seat_number>totalSeats){
      return res.status(400).json({
        success:false,
        message:`Seat must be between 1 and ${totalSeats}`,
      });
    }

    const seatCheck=await pool.query(
      `SELECT id
       FROM bookings
       WHERE schedule_id=$1
       AND seat_number=$2
       AND id<>$3
       AND booking_status='confirmed'`,
      [schedule_id,seat_number,id]
    );

    if(seatCheck.rows.length>0){
      return res.status(400).json({
        success:false,
        message:"Seat already booked",
      });
    }

    const result=await pool.query(
      `UPDATE bookings
       SET schedule_id=$1,
           seat_number=$2
       WHERE id=$3
       RETURNING *`,
      [schedule_id,seat_number,id]
    );

    if(result.rows.length===0){
      return res.status(404).json({
        success:false,
        message:"Booking not found",
      });
    }

    res.json({
      success:true,
      message:"Booking Updated Successfully",
      booking:result.rows[0],
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      success:false,
      message:err.message,
    });

  }
};

// Cancel Booking
const cancelBooking = async (req,res)=>{
  try{

    const {id}=req.params;

    const result=await pool.query(
      `UPDATE bookings
       SET booking_status='cancelled'
       WHERE id=$1
       RETURNING *`,
      [id]
    );

    if(result.rows.length===0){
      return res.status(404).json({
        success:false,
        message:"Booking not found",
      });
    }

    res.json({
      success:true,
      message:"Booking Cancelled Successfully",
      booking:result.rows[0],
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      success:false,
      message:err.message,
    });

  }
};

module.exports={
  addBooking,
  getAllBookings,
  updateBooking,
  cancelBooking,
};
