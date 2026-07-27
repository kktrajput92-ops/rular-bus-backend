const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/auth.routes");
const customerAuthRoutes = require("./routes/customerAuth.routes");

const busRoutes = require("./routes/bus.routes");
const busCatalogRoutes = require("./routes/busCatalog.routes");
const driverRoutes = require("./routes/driver.routes");
const routeRoutes = require("./routes/route.routes");
const homepageRouteShortcutRoutes = require("./routes/homepageRouteShortcut.routes");
const passengerLocationRoutes = require("./routes/passengerLocation.routes");
const passengerLocationTypeRoutes = require("./routes/passengerLocationType.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const passengerRoutes = require("./routes/passenger.routes");
const savedTravellerRoutes = require("./routes/savedTraveller.routes");
const bookingRoutes = require("./routes/booking.routes");
const ticketRoutes = require("./routes/ticket.routes");
const paymentRoutes = require("./routes/payment.routes");
const razorpayWebhookRoutes = require("./routes/razorpayWebhook.routes");
const seatRoutes = require("./routes/seat.routes");
const searchRoutes = require("./routes/search.routes");
const seatLayoutRoutes = require("./routes/seatLayout.routes");
const stopRoutes = require("./routes/stop.routes");
const journeyRoutes = require("./routes/journey.routes");
const fareCategoryRoutes = require("./routes/fareCategory.routes");
const pricingRuleRoutes = require("./routes/pricingRule.routes");
const pricingEngineRoutes = require("./routes/pricingEngine.routes");
const couponCodeRoutes = require("./routes/couponCode.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const conductorRoutes = require("./routes/conductor.routes");
const seatLockRoutes = require("./routes/seat_lock.routes");
const companyRoutes = require("./routes/company.routes");
const regionRoutes = require("./routes/region.routes");
const branchRoutes = require("./routes/branch.routes");
const officeRoutes = require("./routes/office.routes");
const counterRoutes = require("./routes/counter.routes");
const errorMiddleware = require("./middleware/error.middleware");
const designationRoutes = require("./routes/designation.routes");
const staffRoutes = require("./routes/staff.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const leaveRoutes = require("./routes/leave.routes");
const shiftRoutes = require("./routes/shift.routes");
const payrollRoutes = require("./routes/payroll.routes");
const employeeDocumentRoutes = require("./routes/employeeDocument.routes");
const assetRoutes = require("./routes/asset.routes");
const roleRoutes = require("./routes/role.routes");
const permissionRoutes = require("./routes/permission.routes");
const userRoutes = require("./routes/user.routes");
const departmentRoutes = require("./routes/department.routes");
const rolePermissionRoutes = require("./routes/rolePermission.routes");
const customerAnalyticsRoutes = require("./routes/customerAnalytics.routes");
const adminRefundRoutes = require("./routes/adminRefund.routes");
const path = require("path");
const app = express();

app.use(cors());

/*
 * Razorpay webhook must receive the original raw body.
 * Mount this before express.json().
 */
app.use(
  "/api/webhooks",
  razorpayWebhookRoutes
);

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/customer-auth", customerAuthRoutes);

app.use("/api/buses", busRoutes);
app.use("/api/bus-catalog", busCatalogRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/homepage-route-shortcuts", homepageRouteShortcutRoutes);
app.use("/api/passenger-locations", passengerLocationRoutes);
app.use("/api/passenger-location-types", passengerLocationTypeRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/passengers", passengerRoutes);
app.use("/api/saved-travellers", savedTravellerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/seat-layouts", seatLayoutRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/customer-analytics", customerAnalyticsRoutes);
app.use("/api/admin-refunds", adminRefundRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/journeys", journeyRoutes);
app.use("/api/fare-categories", fareCategoryRoutes);
app.use("/api/pricing-rules", pricingRuleRoutes);
app.use("/api/pricing-engine", pricingEngineRoutes);
app.use("/api/coupon-codes", couponCodeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/conductor", conductorRoutes);
app.use("/api/seat-locks", seatLockRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/offices", officeRoutes);
app.use("/api/counters", counterRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/staff", staffRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/employee-documents", employeeDocumentRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/role-permissions", rolePermissionRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
app.use(errorMiddleware);

const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
