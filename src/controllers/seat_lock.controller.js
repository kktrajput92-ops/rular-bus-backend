const pool = require("../config/db");

// ======================================
// LOCK SEAT
// ======================================
const lockSeat = async (req, res) => {

  try {

    const {

      schedule_id,
      journey_id,
      seat_number,
      passenger_name,
      passenger_phone

    } = req.body;

    // Remove Expired Locks

    await pool.query(

      `DELETE
       FROM seat_locks
       WHERE expires_at IS NOT NULL
       AND expires_at < NOW()`

    );

    // Check Existing Lock

    const existing = await pool.query(

      `SELECT *
       FROM seat_locks
       WHERE schedule_id=$1
       AND journey_id=$2
       AND seat_number=$3
       AND status='locked'`,

      [

        schedule_id,
        journey_id,
        seat_number

      ]

    );

    if (existing.rows.length > 0) {

      return res.status(409).json({

        success: false,

        message: "Seat already locked"

      });

    }

    // Lock expires after 5 minutes

    const expires_at = new Date(

      Date.now() + (5 * 60 * 1000)

    );

    // Insert Lock

    const result = await pool.query(

      `INSERT INTO seat_locks
      (
        schedule_id,
        journey_id,
        seat_number,
        passenger_name,
        passenger_phone,
        status,
        expires_at
      )
      VALUES
      (
        $1,$2,$3,$4,$5,
        'locked',
        $6
      )
      RETURNING *`,

      [

        schedule_id,
        journey_id,
        seat_number,
        passenger_name,
        passenger_phone,
        expires_at

      ]

    );

    return res.status(201).json({

      success: true,

      message: "Seat locked successfully",

      seat_lock: result.rows[0]

    });

  }

  catch(err){

    console.error(err);

    return res.status(500).json({

      success:false,

      message:err.message

    });

  }

};

// ======================================
// GET LOCKED SEATS
// ======================================

const getLockedSeats = async(req,res)=>{

  try{

    const {schedule_id}=req.params;

    await pool.query(

      `DELETE
       FROM seat_locks
       WHERE expires_at IS NOT NULL
       AND expires_at < NOW()`

    );

    const result=await pool.query(

      `SELECT *
       FROM seat_locks
       WHERE schedule_id=$1
       AND status='locked'
       ORDER BY seat_number`,

      [schedule_id]

    );

    return res.json({

      success:true,

      total:result.rows.length,

      seats:result.rows

    });

  }

  catch(err){

    console.error(err);

    return res.status(500).json({

      success:false,

      message:err.message

    });

  }

};
// ======================================
// UNLOCK SEAT
// ======================================

const unlockSeat = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(

      `DELETE
       FROM seat_locks
       WHERE id = $1
       RETURNING *`,

      [id]

    );

    if (result.rows.length === 0) {

      return res.status(404).json({

        success: false,

        message: "Seat lock not found"

      });

    }

    return res.json({

      success: true,

      message: "Seat unlocked successfully",

      seat_lock: result.rows[0]

    });

  }

  catch(err){

    console.error(err);

    return res.status(500).json({

      success:false,

      message:err.message

    });

  }

};

// ======================================
// CLEANUP EXPIRED LOCKS
// ======================================

const cleanupExpiredLocks = async (req, res) => {

  try {

    const result = await pool.query(

      `DELETE
       FROM seat_locks
       WHERE expires_at IS NOT NULL
       AND expires_at < NOW()
       RETURNING *`

    );

    return res.json({

      success: true,

      message: "Expired locks removed",

      deleted: result.rowCount

    });

  }

  catch(err){

    console.error(err);

    return res.status(500).json({

      success:false,

      message:err.message

    });

  }

};

// ======================================
// MODULE EXPORTS
// ======================================

module.exports = {

  lockSeat,

  getLockedSeats,

  unlockSeat,

  cleanupExpiredLocks

};
