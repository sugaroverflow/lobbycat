import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";

async function main() {
  const which = process.argv.slice(2);
  if (which.length === 0) {
    console.error("usage: apply-migrations.ts <file1.sql> [file2.sql ...]");
    process.exit(2);
  }
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, ssl: "require" });
  for (const file of which) {
    console.log("applying", file);
    const txt = readFileSync(`drizzle/${file}`, "utf8");
    const stmts = txt.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
    for (const s of stmts) {
      console.log("  →", s.slice(0, 90).replace(/\s+/g, " "));
      try { await sql.unsafe(s); } catch (e: any) {
        if (String(e?.message ?? "").match(/already exists|duplicate/i)) {
          console.log("    (skip: already exists)");
        } else throw e;
      }
    }
  }
  await sql.end();
  console.log("OK");
}
main().catch(e => { console.error(e); process.exit(1); });
