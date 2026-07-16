import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const db = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false } //An SSL certificate is a digital identity card for a server.
                                          //rejectUnauthorized: false => the connection remains encrypted, but your app does not verify the server’s identity properly.
                                          //rejectUnauthorized: true may fail unless Node.js trusts the Supabase certificate.
          : undefined,
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

export default db;
