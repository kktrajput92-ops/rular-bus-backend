const pool = require("../config/db");

const parsePositiveInteger = (value) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
};

const calculateDurationMinutes = (
  departureValue,
  arrivalValue
) => {
  const departure =
    new Date(departureValue);

  const arrival =
    new Date(arrivalValue);

  if (
    Number.isNaN(departure.getTime()) ||
    Number.isNaN(arrival.getTime())
  ) {
    return null;
  }

  const durationMinutes =
    Math.round(
      (
        arrival.getTime() -
        departure.getTime()
      ) / 60000
    );

  return durationMinutes > 0
    ? durationMinutes
    : null;
};

const validateSchedulePayload = ({
  bus_id,
  route_id,
  departure_time,
  arrival_time,
}) => {
  const busId =
    parsePositiveInteger(bus_id);

  const routeId =
    parsePositiveInteger(route_id);

  if (!busId) {
    return {
      valid: false,
      message:
        "Valid bus is required.",
    };
  }

  if (!routeId) {
    return {
      valid: false,
      message:
        "Valid route is required.",
    };
  }

  if (
    !departure_time ||
    !arrival_time
  ) {
    return {
      valid: false,
      message:
        "Departure and arrival date-time are required.",
    };
  }

  const durationMinutes =
    calculateDurationMinutes(
      departure_time,
      arrival_time
    );

  if (!durationMinutes) {
    return {
      valid: false,
      message:
        "Arrival date-time must be after departure date-time.",
    };
  }

  return {
    valid: true,
    busId,
    routeId,
    durationMinutes,
  };
};

const addSchedule = async (
  req,
  res
) => {
  try {
    const validation =
      validateSchedulePayload(
        req.body || {}
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const {
      departure_time,
      arrival_time,
    } = req.body;

    const result =
      await pool.query(
        `
          INSERT INTO schedules (
            bus_id,
            route_id,
            departure_time,
            arrival_time,
            duration_minutes
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          RETURNING *
        `,
        [
          validation.busId,
          validation.routeId,
          departure_time,
          arrival_time,
          validation.durationMinutes,
        ]
      );

    return res.status(201).json({
      success: true,
      message:
        "Schedule added successfully.",
      schedule: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Add schedule failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add schedule.",
    });
  }
};

const getAllSchedules = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(`
        SELECT
          schedules.id,
          schedules.bus_id,
          schedules.route_id,

          buses.bus_name,
          buses.bus_number,

          TRIM(routes.source)
            AS source,

          TRIM(routes.destination)
            AS destination,

          routes.distance_km,
          routes.estimated_time,

          schedules.departure_time,
          schedules.arrival_time,

          COALESCE(
            schedules.duration_minutes,

            CASE
              WHEN
                schedules.arrival_time >
                schedules.departure_time
              THEN ROUND(
                EXTRACT(
                  EPOCH FROM (
                    schedules.arrival_time -
                    schedules.departure_time
                  )
                ) / 60
              )::INTEGER
              ELSE NULL
            END
          ) AS duration_minutes,

          CASE
            WHEN
              DATE(
                schedules.arrival_time
              ) >
              DATE(
                schedules.departure_time
              )
            THEN TRUE
            ELSE FALSE
          END AS arrives_next_day

        FROM schedules

        JOIN buses
          ON schedules.bus_id =
            buses.id

        JOIN routes
          ON schedules.route_id =
            routes.id

        ORDER BY schedules.id DESC
      `);

    return res.json({
      success: true,
      schedules: result.rows,
    });
  } catch (error) {
    console.error(
      "Get schedules failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load schedules.",
    });
  }
};

const updateSchedule = async (
  req,
  res
) => {
  try {
    const scheduleId =
      parsePositiveInteger(
        req.params.id
      );

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message:
          "Valid schedule ID is required.",
      });
    }

    const validation =
      validateSchedulePayload(
        req.body || {}
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const {
      departure_time,
      arrival_time,
    } = req.body;

    const result =
      await pool.query(
        `
          UPDATE schedules
          SET
            bus_id = $1,
            route_id = $2,
            departure_time = $3,
            arrival_time = $4,
            duration_minutes = $5
          WHERE id = $6
          RETURNING *
        `,
        [
          validation.busId,
          validation.routeId,
          departure_time,
          arrival_time,
          validation.durationMinutes,
          scheduleId,
        ]
      );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Schedule not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Schedule updated successfully.",
      schedule: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update schedule failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update schedule.",
    });
  }
};

const deleteSchedule = async (
  req,
  res
) => {
  try {
    const scheduleId =
      parsePositiveInteger(
        req.params.id
      );

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message:
          "Valid schedule ID is required.",
      });
    }

    const result =
      await pool.query(
        `
          DELETE FROM schedules
          WHERE id = $1
          RETURNING *
        `,
        [scheduleId]
      );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Schedule not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Schedule deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete schedule failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete schedule.",
    });
  }
};

module.exports = {
  addSchedule,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
};
