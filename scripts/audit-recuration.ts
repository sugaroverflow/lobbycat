import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/db";
import { frameScores } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const byConf = await db.execute(sql`
    SELECT confidence, count(*) AS n, round(avg(score)::numeric, 2) AS avg_score
    FROM frame_scores GROUP BY confidence ORDER BY confidence;
  `);
  console.log("confidence distribution:", byConf);

  const byCit = await db.execute(sql`
    SELECT count(*) AS cells, sum(c) AS total_citations, avg(c)::numeric(5,2) AS avg_citations
    FROM (
      SELECT fs.company_id, fs.frame_id, count(fse.id) AS c
      FROM frame_scores fs
      LEFT JOIN frame_score_evidence fse ON fse.company_id = fs.company_id AND fse.frame_id = fs.frame_id
      GROUP BY 1, 2
    ) t;
  `);
  console.log("citations:", byCit);

  // Zero-evidence cells
  const noEv = await db.execute(sql`
    SELECT c.slug, f.name, fs.score, fs.confidence
    FROM frame_scores fs
    JOIN companies c ON c.id = fs.company_id
    JOIN frames f ON f.id = fs.frame_id
    WHERE NOT EXISTS (
      SELECT 1 FROM frame_score_evidence fse
      WHERE fse.company_id = fs.company_id AND fse.frame_id = fs.frame_id
    )
    LIMIT 12;
  `);
  console.log(`cells with NO citations (sample 12):`, noEv);

  const noEvCount = await db.execute(sql`
    SELECT count(*) FROM frame_scores fs
    WHERE NOT EXISTS (
      SELECT 1 FROM frame_score_evidence fse
      WHERE fse.company_id = fs.company_id AND fse.frame_id = fs.frame_id
    );
  `);
  console.log("zero-citation cells total:", noEvCount);

  // Score distribution
  const scoreDist = await db.execute(sql`
    SELECT score::numeric AS s, count(*) AS n FROM frame_scores GROUP BY 1 ORDER BY 1;
  `);
  console.log("score histogram:", scoreDist);

  // Frame-level confidence breakdown
  const perFrame = await db.execute(sql`
    SELECT f.name,
           sum(case when confidence='low' then 1 else 0 end) AS low,
           sum(case when confidence='medium' then 1 else 0 end) AS medium,
           sum(case when confidence='high' then 1 else 0 end) AS high,
           round(avg(score)::numeric, 2) AS avg_score
    FROM frame_scores fs JOIN frames f ON f.id = fs.frame_id
    GROUP BY f.name ORDER BY f.name;
  `);
  console.log("per-frame:", perFrame);

  // Stale leftover (should be 0)
  const stale = await db.execute(sql`SELECT count(*) FROM frame_scores WHERE stale_at IS NOT NULL`);
  console.log("stale leftover:", stale);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
