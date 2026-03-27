require('dotenv').config();
const { Client } = require('pg');
const crypto = require('crypto');

// Better Auth uses scrypt by default for version 1.x
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
  try {
    await client.connect();
    
    // Better Auth v1.x schema
    const userId = crypto.randomBytes(16).toString('hex');
    const email = 'admin@goo.studio';
    const password = 'PasswordAdmin123!';
    const hashed = hashPassword(password);
    const now = new Date();

    console.log('Creating admin user...');
    
    // 1. Create User
    await client.query(
      'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, 'Admin', email, true, now, now]
    );

    // 2. Create Account
    // password hash format in Better Auth might vary, but for manual test we'll see
    await client.query(
      'INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [crypto.randomBytes(16).toString('hex'), email, 'email', userId, hashed, now, now]
    );

    console.log('✅ Admin accounts created successfully!');
    console.log('Email: admin@goo.studio');
    console.log('Password: PasswordAdmin123!');
    
    client.end();
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
