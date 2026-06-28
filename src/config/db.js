const { Pool } = require("pg");
require("dotenv").config();

console.log("HOST =", process.env.DB_HOST);
console.log("PORT =", process.env.DB_PORT);
console.log("NAME =", process.env.DB_NAME);
console.log("USER =", process.env.DB_USER);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL Connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL Pool Error:", err);
});

(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database Test Query Success");
  } catch (err) {
    console.error("❌ Database Test Query Failed");
    console.error(err);
  }
})();

module.exports = pool;
