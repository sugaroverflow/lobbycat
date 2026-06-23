import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  const slugs = ["anthropic-london", "google-deepmind", "openai-london", "wayve", "helsing", "synthesia", "stability-ai"];
  const rows = await db.execute(sql`
    SELECT c.slug, f.name, fs.score, fs.confidence,
           (SELECT count(*) FROM frame_score_evidence fse
              WHERE fse.company_id=fs.company_id AND fse.frame_id=fs.frame_id) AS citations,
           left(fs.rationale, 220) AS rationale
    FROM frame_scores fs
    JOIN companies c ON c.id=fs.company_id
    JOIN frames f ON f.id=fs.frame_id
    WHERE c.slug IN (${sql.join(slugs.map(s => sql`${s}`), sql`, `)})
    ORDER BY c.slug, f.name;
  `);
  for (const r of rows as any[]) {
    console.log(`\n${r.slug} / ${r.name} → ${r.score} (${r.confidence}, ${r.citations} cites)`);
    console.log(`  ${r.rationale}`);
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
