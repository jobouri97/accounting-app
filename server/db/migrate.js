import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import db from "./index.js";

const migrationsDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations"
);

export async function runMigrations() {
  const client = await db.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((filename) => filename.endsWith(".sql"))
      .sort();

    for (const filename of migrationFiles) {
      const appliedMigration = await client.query(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        [filename]
      );

      if (appliedMigration.rowCount > 0) continue;

      const sql = await readFile(path.join(migrationsDirectory, filename), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename]
        );
        await client.query("COMMIT");
        console.log(`Applied database migration: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

