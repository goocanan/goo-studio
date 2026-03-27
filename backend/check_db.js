require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(async () => {
    const resU = await client.query("SELECT * FROM \"user\"");
    const resA = await client.query("SELECT * FROM \"account\"");
    console.log('Users:', resU.rows);
    console.log('Accounts:', resA.rows);
    client.end();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
