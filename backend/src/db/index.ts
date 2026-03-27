import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/goo_studio",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
