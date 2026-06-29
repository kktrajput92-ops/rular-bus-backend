const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/db");

const authRoutes = require("./routes/auth.routes");
const busRoutes = require("./routes/bus.routes");
const driverRoutes = require("./routes/driver.routes");
const routeRoutes = require("./routes/route.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const passengerRoutes = require("./routes/passenger.routes");
const bookingRoutes = require("./routes/booking.routes");
const ticketRoutes = require("./routes/ticket.routes");
const paymentRoutes = require("./routes/payment.routes");
const seatRoutes = require("./routes/seat.routes");
const searchRoutes = require("./routes/search.routes");
const stopRoutes = require("./routes/stop.routes");
const journeyRoutes = require("./routes/journey.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const seatLockRoutes = require("./routes/seat_lock.routes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/passengers", passengerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/journeys", journeyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/seat-locks", seatLockRoutes);

// Root
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚍 Rular Bus Backend Running Successfully"
  });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    database: "Connected",
    server: "Running",
    version: "2.2.0"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
