require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clean() {
    await client.connect();
    await client.query("DELETE FROM \"session\"");
    await client.query("DELETE FROM \"account\"");
    await client.query("DELETE FROM \"user\"");
    console.log('Database Cleaned');
    client.end();
}

clean();
