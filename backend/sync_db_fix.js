require('dotenv').config();
const { Client } = require('pg');

async function syncDb() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        
        console.log('Dropping weight columns from "parts", "inventory", and "settings" if they exist...');
        
        // This will allow us to cleanup any remaining columns that are not in our schema
        // and causing the Not-Null constraint violations.
        
        await client.query('ALTER TABLE "parts" DROP COLUMN IF EXISTS "weight";');
        await client.query('ALTER TABLE "inventory" DROP COLUMN IF EXISTS "remaining_weight";');
        await client.query('ALTER TABLE "inventory" DROP COLUMN IF EXISTS "initial_weight";');
        await client.query('ALTER TABLE "settings" DROP COLUMN IF EXISTS "weightUnit";');

        console.log('✅ Database sync successful. All weight columns dropped.');
    } catch (err) {
        console.error('❌ Error during database sync:', err);
    } finally {
        await client.end();
    }
}

syncDb();
