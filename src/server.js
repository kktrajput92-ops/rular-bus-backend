const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/db");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

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
