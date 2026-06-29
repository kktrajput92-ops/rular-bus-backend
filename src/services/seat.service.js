const pool = require("../config/db");

const isSeatAvailable = async (schedule_id, seat_number) => {

  const result = await pool.query(
    `SELECT id
     FROM bookings
     WHERE schedule_id=$1
     AND seat_number=$2
     AND booking_status='confirmed'`,
    [schedule_id, seat_number]
  );

  return result.rows.length === 0;

};

module.exports = {
  isSeatAvailable,
};
