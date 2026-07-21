const pool = require("../config/db");

// ===============================
// Get Layout
// ===============================
const getLayout = async (req, res) => {
  try {
    const { busId } = req.params;

    const result = await pool.query(
      `SELECT * FROM seat_layouts
       WHERE bus_id = $1
       ORDER BY row_no, col_no`,
      [busId]
    );

    return res.json({
      success: true,
      layout: result.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// ===============================
// Save Layout
// ===============================
const saveLayout = async (req, res) => {
  const client = await pool.connect();

  try {
    const { busId } = req.params;
    const { layout } = req.body;

    if (!Array.isArray(layout)) {
      return res.status(400).json({
        success: false,
        message: "layout must be an array",
      });
    }

    await client.query("BEGIN");

    await client.query(
      "DELETE FROM seat_layouts WHERE bus_id = $1",
      [busId]
    );

    for (const seat of layout) {
      await client.query(
        `INSERT INTO seat_layouts
        (
          bus_id,
          seat_no,
          seat_type,
          deck,
          row_no,
          col_no,
          is_driver,
          is_door,
          is_aisle,
          is_extra
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          busId,
          seat.seat_no,
          seat.seat_type,
          seat.deck,
          seat.row_no,
          seat.col_no,
          seat.is_driver || false,
          seat.is_door || false,
          seat.is_aisle || false,
          seat.is_extra || false,
        ]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Seat layout saved successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    client.release();
  }
};
// ===============================
// Exports
// ===============================
module.exports = {
  getLayout,
  saveLayout,
};
