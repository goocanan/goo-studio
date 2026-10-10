const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.FLOW_DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function check() {
  try {
    // Check inventory columns
    const cols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'inventory' AND column_name IN ('current_weight', 'initial_weight')
    `);
    console.log("inventory weight columns:", cols.rows);
    
    // Check inventory_transactions table
    const txTable = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'inventory_transactions'
    `);
    console.log("inventory_transactions exists:", txTable.rows.length > 0);
    
    // Sample inventory data
    const inv = await pool.query("SELECT id, sku, brand, color, current_weight, initial_weight FROM inventory LIMIT 3");
    console.log("sample inventory:", inv.rows);
    
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    pool.end();
  }
}

check();
