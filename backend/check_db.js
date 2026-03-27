require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(async () => {
    // Delete from all auth tables to clear partial states
    await client.query("DELETE FROM \"session\"");
    await client.query("DELETE FROM \"account\"");
    await client.query("DELETE FROM \"verification\"");
    await client.query("DELETE FROM \"user\"");
    console.log('Cleared all auth tables.');
    client.end();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
