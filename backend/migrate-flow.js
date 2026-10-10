const { Pool } = require("pg");
const fs = require("fs");
require("dotenv").config();

const sql = fs.readFileSync("src/db/migrations/0003_purple_stone_men.sql", "utf8");

const pool = new Pool({
  connectionString: process.env.FLOW_DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.query(sql, (err, res) => {
  if (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
  console.log("Migration applied:", res);
  pool.end();
});
