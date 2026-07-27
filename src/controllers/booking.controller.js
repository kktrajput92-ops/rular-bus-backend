const pool = require("../config/db");

// Add Booking
const addBooking = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  const fail = (status, message, details = null) => {
    const error = new Error(message);
    error.status = status;
    error.details = details;
    throw error;
  };

  try {

    const customerProfileId =

      req.customer?.id

        ? Number(req.customer.id)

        : null;


    if (

      customerProfileId !== null &&

      (

        !Number.isInteger(customerProfileId) ||

        customerProfileId <= 0

      )

    ) {

      return res.status(401).json({

        success: false,

        message:

          "Invalid customer profile identity.",

      });

    }

    const scheduleId = Number(req.body.schedule_id);

    const contactPhone = String(
      req.body.contact_phone || ""
    )
      .replace(/\D/g, "")
      .trim();

    const contactEmail = String(
      req.body.contact_email || ""
    )
      .trim()
      .toLowerCase();

    const requestedPassengers = Array.isArray(
      req.body.passengers
    )
      ? req.body.passengers
      : [];

    if (
      !Number.isInteger(scheduleId) ||
      scheduleId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid schedule ID is required.",
      });
    }

    if (!/^[0-9]{10,15}$/.test(contactPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid booking contact number is required.",
      });
    }

    if (
      contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        contactEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking contact email format is invalid.",
      });
    }

    if (requestedPassengers.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one passenger and seat are required.",
      });
    }

    if (requestedPassengers.length > 20) {
      return res.status(400).json({
        success: false,
        message:
          "A maximum of 20 passengers can be booked at once.",
      });
    }

    const passengers = requestedPassengers.map(
      (item, index) => {
        const passengerId = Number(item.passenger_id);
        const seatNumber = String(
          item.seat_number || ""
        ).trim();

        if (
          !Number.isInteger(passengerId) ||
          passengerId <= 0
        ) {
          fail(
            400,
            `Valid passenger ID is required at position ${
              index + 1
            }.`
          );
        }

        if (
          !seatNumber ||
          seatNumber.length > 40
        ) {
          fail(
            400,
            `Valid seat reference is required at position ${
              index + 1
            }.`
          );
        }

        return {
          passenger_id: passengerId,
          seat_number: seatNumber,
        };
      }
    );

    const passengerIds = passengers.map(
      (item) => item.passenger_id
    );

    const seatNumbers = passengers.map(
      (item) => item.seat_number
    );

    if (
      new Set(passengerIds).size !==
      passengerIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The same passenger cannot be added more than once in one booking.",
      });
    }

    if (
      new Set(seatNumbers).size !==
      seatNumbers.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate seat numbers are not allowed.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    /*
     * Serialize booking creation for one schedule.
     * This prevents two simultaneous requests from
     * passing the seat check for the same seat.
     */
    await client.query(
      "SELECT pg_advisory_xact_lock($1)",
      [scheduleId]
    );

    const scheduleResult = await client.query(
      `SELECT
         s.id,
         s.bus_id,
         s.route_id,
         s.departure_time,
         s.arrival_time,
         bus.bus_name,
         bus.bus_number,
         bus.total_seats,
         TRIM(r.source) AS source,
         TRIM(r.destination) AS destination
       FROM schedules s
       INNER JOIN buses bus
         ON bus.id = s.bus_id
       INNER JOIN routes r
         ON r.id = s.route_id
       WHERE s.id = $1
       FOR UPDATE OF s`,
      [scheduleId]
    );

    if (scheduleResult.rows.length === 0) {
      fail(404, "Schedule not found.");
    }

    const schedule = scheduleResult.rows[0];
    const layoutResult = await client.query(
      `SELECT
         id,
         seat_no,
         seat_type,
         deck,
         fare,
         berth_group,
         private_booking_enabled,
         sharing_booking_enabled,
         sharing_capacity,
         private_fare,
         sharing_fare
       FROM seat_layouts
       WHERE bus_id = $1
         AND UPPER(seat_type) IN (
           'SEAT',
           'SEATER',
           'PUSHBACK_SEAT',
           'SEMI_SLEEPER',
           'LOWER_BERTH',
           'UPPER_BERTH'
         )
       ORDER BY
         CASE
           WHEN UPPER(deck) = 'LOWER' THEN 1
           WHEN UPPER(deck) = 'UPPER' THEN 2
           ELSE 3
         END,
         row_no,
         col_no`,
      [schedule.bus_id]
    );

    if (layoutResult.rows.length === 0) {
      fail(
        400,
        "Seat layout is not configured for this bus."
      );
    }

    const layoutBySeat = new Map(
      layoutResult.rows.map((item) => [
        String(item.seat_no).trim(),
        item,
      ])
    );

    const invalidSeat = seatNumbers.find(
      (seat) => !layoutBySeat.has(seat)
    );

    if (invalidSeat !== undefined) {
      fail(
        400,
        `Seat ${invalidSeat} is not available in the saved bus layout.`
      );
    }

    const passengerResult = await client.query(
      `SELECT
         id,
         full_name,
         phone,
         email,
         gender,
         age
       FROM passengers
       WHERE id = ANY($1::INT[])
       ORDER BY id`,
      [passengerIds]
    );

    if (
      passengerResult.rows.length !==
      passengerIds.length
    ) {
      const foundIds = new Set(
        passengerResult.rows.map(
          (item) => Number(item.id)
        )
      );

      const missingIds = passengerIds.filter(
        (id) => !foundIds.has(id)
      );

      fail(
        404,
        `Passenger not found: ${missingIds.join(", ")}.`
      );
    }

    /*
     * Check both:
     * 1. Legacy primary booking seat
     * 2. booking_passengers multi-seat rows
     */
    const occupiedSeatResult = await client.query(
      `SELECT DISTINCT occupied.seat_number
       FROM (
         SELECT b.seat_number
         FROM bookings b
         WHERE b.schedule_id = $1
           AND LOWER(b.booking_status) = 'confirmed'
           AND b.seat_number = ANY($2::VARCHAR[])

         UNION ALL

         SELECT bp.seat_number
         FROM booking_passengers bp
         INNER JOIN bookings b
           ON b.id = bp.booking_id
         WHERE b.schedule_id = $1
           AND LOWER(b.booking_status) = 'confirmed'
           AND bp.seat_number = ANY($2::VARCHAR[])
       ) occupied
       ORDER BY occupied.seat_number`,
      [scheduleId, seatNumbers]
    );

    if (occupiedSeatResult.rows.length > 0) {
      const occupiedSeats =
        occupiedSeatResult.rows.map(
          (item) => String(item.seat_number)
        );

      fail(
        409,
        `Seat${
          occupiedSeats.length > 1 ? "s" : ""
        } ${occupiedSeats.join(
          ", "
        )} already booked.`,
        {
          occupied_seats: occupiedSeats,
        }
      );
    }

    const normalizedPassengers =
      passengers.map((passenger) => {
        const layoutSeat =
          layoutBySeat.get(
            passenger.seat_number
          );

        const privateFare =
          layoutSeat.private_fare === null ||
          layoutSeat.private_fare === undefined
            ? Number(layoutSeat.fare || 0)
            : Number(
                layoutSeat.private_fare
              );

        return {
          ...passenger,
          seat_layout_id:
            Number(layoutSeat.id),

          seat_type:
            String(
              layoutSeat.seat_type
            ).toUpperCase(),

          deck:
            String(
              layoutSeat.deck ||
                "LOWER"
            ).toUpperCase(),

          berth_group:
            layoutSeat.berth_group ||
            null,

          booking_mode:
            "SEAT",

          fare_amount:
            privateFare,
        };
      });

    const totalFare =
      normalizedPassengers.reduce(
        (sum, passenger) =>
          sum +
          Number(
            passenger.fare_amount || 0
          ),
        0
      );

    const primaryPassenger =
      normalizedPassengers[0];

    const bookingInsert = await client.query(
      `INSERT INTO bookings
       (
         passenger_id,
         schedule_id,
         seat_number,
         booking_status,
         booking_mode,
         berth_group,
         fare_amount,
         currency_code,
         contact_phone,
         contact_email,
         passenger_count,
         customer_profile_id
       )
       VALUES
       (
         $1,
         $2,
         $3,
         'confirmed',
         $4,
         $5,
         $6,
         'INR',
         $7,
         $8,
         $9,
         $10
       )
       RETURNING
         id,
         passenger_id,
         schedule_id,
         seat_number,
         booking_status,
         fare_amount,
         currency_code,
         contact_phone,
         contact_email,
         passenger_count,
         created_at`,
      [
        primaryPassenger.passenger_id,
        scheduleId,
        primaryPassenger.seat_number,
        primaryPassenger.booking_mode,
        primaryPassenger.berth_group,
        totalFare,
        contactPhone,
        contactEmail || null,
        normalizedPassengers.length,
          customerProfileId,
        ]
    );

    const bookingId = bookingInsert.rows[0].id;

    for (
      const passenger of normalizedPassengers
    ) {
      await client.query(
        `INSERT INTO booking_passengers
         (
           booking_id,
           passenger_id,
           seat_number,
           booking_mode,
           seat_layout_id,
           seat_type,
           deck,
           berth_group,
           fare_amount,
           currency_code
         )
         VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8,
           $9,
           'INR'
         )`,
        [
          bookingId,
          passenger.passenger_id,
          passenger.seat_number,
          passenger.booking_mode,
          passenger.seat_layout_id,
          passenger.seat_type,
          passenger.deck,
          passenger.berth_group,
          passenger.fare_amount,
        ]
      );
    }

    const ticketNumber =
      `RB${String(bookingId).padStart(6, "0")}` +
      `${Date.now().toString().slice(-6)}` +
      `${Math.floor(Math.random() * 900 + 100)}`;

    await client.query(
      `INSERT INTO tickets
       (
         booking_id,
         ticket_number,
         qr_code
       )
       VALUES ($1, $2, $3)`,
      [
        bookingId,
        ticketNumber,
        ticketNumber,
      ]
    );

    const bookingResult = await client.query(
      `SELECT
         b.id,
         b.passenger_id,
         b.schedule_id,
         b.seat_number,
         b.booking_status,
         b.fare_amount,
         b.currency_code,
         b.contact_phone,
         b.contact_email,
         b.passenger_count,
         b.created_at,

         s.departure_time,
         s.arrival_time,
         s.duration_minutes,


         bus.id AS bus_id,
         bus.bus_name,
         bus.bus_number,

         r.id AS route_id,
         TRIM(r.source) AS source,
         TRIM(r.destination) AS destination,

         t.ticket_number
       FROM bookings b
       INNER JOIN schedules s
         ON s.id = b.schedule_id
       INNER JOIN buses bus
         ON bus.id = s.bus_id
       INNER JOIN routes r
         ON r.id = s.route_id
       LEFT JOIN tickets t
         ON t.booking_id = b.id
       WHERE b.id = $1`,
      [bookingId]
    );

    const bookedPassengerResult =
      await client.query(
        `SELECT
           bp.id AS booking_passenger_id,
           bp.passenger_id,
           bp.seat_number,
           bp.seat_layout_id,
           bp.seat_type,
           bp.deck,
           bp.berth_group,
           bp.booking_mode,
           bp.fare_amount,
           bp.currency_code,
           p.full_name,
           p.phone,
           p.email,
           p.gender,
           p.age,
           p.passenger_category
         FROM booking_passengers bp
         INNER JOIN passengers p
           ON p.id = bp.passenger_id
         WHERE bp.booking_id = $1
         ORDER BY bp.seat_number`,
        [bookingId]
      );

    await client.query("COMMIT");
    transactionStarted = false;

    const booking = {
      ...bookingResult.rows[0],
      seats: bookedPassengerResult.rows.map(
        (item) => String(item.seat_number)
      ),
      passenger_count:
        bookedPassengerResult.rows.length,
      passengers: bookedPassengerResult.rows,
    };

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking,
    });
  } catch (error) {
    if (transactionStarted) {
      try {


        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Booking rollback failed:",
          rollbackError
        );
      }
    }

    console.error("Create booking failed:", error);

    if (
      error.code === "23505" &&
      error.constraint ===
        "booking_passengers_booking_id_seat_number_key"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "One or more selected seats are duplicated.",
      });
    }

    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to create booking.",
        ...(error.details
          ? { details: error.details }
          : {}),
      });
  } finally {
    client.release();
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
// Get Booking By ID
const getBookingById = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid booking ID is required.",
      });
    }

    const result = await pool.query(
      `SELECT
         b.id,
         b.passenger_id,
         b.schedule_id,
         b.seat_number,
         b.booking_status,
         b.fare_amount,
         b.currency_code,
         b.contact_phone,
         b.contact_email,
         b.passenger_count,
         b.created_at,

         primary_passenger.full_name,
         primary_passenger.phone,
         primary_passenger.email,
         primary_passenger.gender,
         primary_passenger.age,

         s.departure_time,
         s.arrival_time,
         s.duration_minutes,

         bus.id AS bus_id,
         bus.bus_name,
         bus.bus_number,

         r.id AS route_id,
         TRIM(r.source) AS source,
         TRIM(r.destination) AS destination,

         t.ticket_number
       FROM bookings b
       INNER JOIN passengers primary_passenger
         ON primary_passenger.id = b.passenger_id
       INNER JOIN schedules s
         ON s.id = b.schedule_id
       INNER JOIN buses bus
         ON bus.id = s.bus_id
       INNER JOIN routes r
         ON r.id = s.route_id
       LEFT JOIN tickets t
         ON t.booking_id = b.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const passengerResult = await pool.query(
      `SELECT
         bp.id AS booking_passenger_id,
         bp.passenger_id,
         bp.seat_number,
         bp.seat_layout_id,
         bp.seat_type,
         bp.deck,
         bp.berth_group,
         bp.booking_mode,
         bp.fare_amount,
         bp.currency_code,
         p.full_name,
         p.phone,
         p.email,
         p.gender,
         p.age,
         p.passenger_category
       FROM booking_passengers bp
       INNER JOIN passengers p
         ON p.id = bp.passenger_id
       WHERE bp.booking_id = $1
       ORDER BY bp.seat_number`,
      [bookingId]
    );

    const booking = {
      ...result.rows[0],
      seats: passengerResult.rows.map(
        (item) => String(item.seat_number)
      ),
      passenger_count:
        passengerResult.rows.length,
      passengers: passengerResult.rows,
    };

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get booking failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load booking.",
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

module.exports = {
  addBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
};
