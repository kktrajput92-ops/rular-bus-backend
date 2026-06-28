const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/db");

const authRoutes = require("./routes/auth.routes");
const busRoutes = require("./routes/bus.routes");
const driverRoutes = require("./routes/driver.routes");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/drivers", driverRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚍 Rular Bus Backend Running Successfully"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    database: "Connected",
    server: "Running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
