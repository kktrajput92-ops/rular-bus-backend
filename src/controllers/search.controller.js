const pool = require("../config/db");

const searchBus = async (req, res) => {
  try {
    const { source, destination } = req.query;

    const result = await pool.query(
      `
      SELECT
        schedules.id AS schedule_id,
        buses.bus_name,
        buses.bus_number,
        buses.total_seats,
        routes.source,
        routes.destination,
        schedules.departure_time,
        schedules.arrival_time,

        (
          SELECT COUNT(*)
          FROM bookings
          WHERE bookings.schedule_id=schedules.id
          AND bookings.booking_status='confirmed'
        )::INTEGER AS booked_seats

      FROM schedules

      JOIN buses
      ON schedules.bus_id=buses.id

      JOIN routes
      ON schedules.route_id=routes.id

      WHERE
      LOWER(routes.source)=LOWER($1)
      AND LOWER(routes.destination)=LOWER($2)

      ORDER BY schedules.departure_time
      `,
      [source, destination]
    );

    const buses = result.rows.map(bus => ({
      ...bus,
      available_seats:
        bus.total_seats - bus.booked_seats
    }));

    res.json({
      success: true,
      total: buses.length,
      buses
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success:false,
      message:err.message
    });

  }
};

module.exports={
  searchBus
};
