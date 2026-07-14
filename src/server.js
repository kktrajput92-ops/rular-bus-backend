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
const conductorRoutes = require("./routes/conductor.routes");
const seatLockRoutes = require("./routes/seat_lock.routes");
const companyRoutes = require("./routes/company.routes");
const regionRoutes = require("./routes/region.routes");
const branchRoutes = require("./routes/branch.routes");
const officeRoutes = require("./routes/office.routes");
const counterRoutes = require("./routes/counter.routes");
const app = express();

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

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
app.use("/api/conductor", conductorRoutes);
app.use("/api/seat-locks", seatLockRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/offices", officeRoutes);
app.use("/api/counters", counterRoutes);
// Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚍 Rular Bus Backend Running Successfully"
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    database: "Connected",
    server: "Running",
    version: "2.2.0"
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
