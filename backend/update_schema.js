require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateSchema() {
    try {
        await client.connect();
        console.log('Updating schema...');
        
        // Add expiresAt to account if missing
        await client.query("ALTER TABLE \"account\" ADD COLUMN IF NOT EXISTS \"expiresAt\" timestamp");
        
        // Add idToken to account if missing (Better Auth sometimes needs it)
        await client.query("ALTER TABLE \"account\" ADD COLUMN IF NOT EXISTS \"idToken\" text");
        
        // Update user table for Better Auth 1.x compliance
        // (already has name, email, emailVerified, image, createdAt, updatedAt)
        
        console.log('✅ Schema updated successfully!');
        client.end();
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
