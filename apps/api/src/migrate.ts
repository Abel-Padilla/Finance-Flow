import { pool } from "./db";
import { readFileSync } from "node:fs";
async function main() {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(723104)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
    );
    const r = await c.query(
      "SELECT 1 FROM schema_migrations WHERE name='0001_initial'",
    );
    if (!r.rowCount) {
      await c.query(readFileSync("migrations/0001_initial.sql", "utf8"));
      await c.query(
        "INSERT INTO schema_migrations(name) VALUES('0001_initial')",
      );
    }
    await c.query("COMMIT");
    console.log("Migrations applied successfully");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
