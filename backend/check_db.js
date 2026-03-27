require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(async () => {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'account'");
    console.log('Columns in account:', res.rows.map(r => `${r.column_name} (${r.data_type})`));
    client.end();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
