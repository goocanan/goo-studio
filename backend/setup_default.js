require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDefault() {
    try {
        await client.connect();
        const now = new Date();
        const defaultUserId = 'default-user';

        // 1. Ensure default user exists
        const userCheck = await client.query('SELECT id FROM "user" WHERE id = $1', [defaultUserId]);
        if (userCheck.rows.length === 0) {
            console.log('Creating default user...');
            await client.query(
                'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
                [defaultUserId, 'Guest', 'guest@local.host', true, now, now]
            );
        }

        console.log('✅ Default environment ready!');
        client.end();
    } catch (err) {
        console.error('Error in setup:', err);
        process.exit(1);
    }
}

setupDefault();
