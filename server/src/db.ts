import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Copy server/.env.example to server/.env and set your PostgreSQL password.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
