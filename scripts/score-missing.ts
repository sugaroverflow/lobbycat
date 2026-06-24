/**
 * v0.7.2 — Score companies that have zero frame_scores rows.
 *
 * v0.6 seeded 30 new "expansion" companies but never ran a scoring pass over
 * them, so on the company page some cells are filled and some are empty.
 * This script identifies the companies with zero scores and runs the standard
 * scoring engine against each (company × frame) cell. Already-scored
 * companies are skipped entirely — we never touch them.
 *
 * For the 30 expansion companies there is no seeded evidence yet (no
 * publications, no roles), so the engine will produce conservative, low-
 * confidence scores with rationales that say so plainly. That's expected and
 * acceptable; Glyphie will enrich evidence over time and a future rescore
 * will replace these baseline cells.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { writeFileSync, mkdirSync } from "node:fs";
import { db } from "../src/db";
import { companies, frames as framesTable, frameScores } from "../src/db/schema";
import { rescoreCompanyFrame } from "../src/lib/scoring";
import { sql } from "drizzle-orm";

const BATCH = Number(process.env.SCORE_BATCH ?? 4);
const DRY_RUN = process.env.DRY_RUN === "1";

type Row = {
  company: string;
  companyId: number;
  frame: string;
  frameId: number;
  score: number;
  confidence: string;
  fallback: boolean;
  citations: number;
  rationale: string;
  dtMs: number;
  error?: string;
};

async function main() {
  const unscoredQ = await db.execute(sql`
    SELECT c.id, c.slug, c.name
    FROM companies c
    LEFT JOIN frame_scores fs ON c.id = fs.company_id
    GROUP BY c.id, c.slug, c.name
    HAVING COUNT(fs.frame_id) = 0
    ORDER BY c.id
  `);
  const unscored = ((unscoredQ as any).rows ?? unscoredQ) as Array<{ id: number; slug: string; name: string }>;
  const allFrames = await db.select({ id: framesTable.id, name: framesTable.name })
    .from(framesTable).orderBy(framesTable.sortIndex);

  const [{ n: totalCompanies }] = ((await db.execute(sql`SELECT COUNT(*)::int AS n FROM companies`)) as any).rows;
  const [{ n: fsBefore }] = ((await db.execute(sql`SELECT COUNT(*)::int AS n FROM frame_scores`)) as any).rows;

  console.log(`companies total=${totalCompanies}  frames=${allFrames.length}`);
  console.log(`frame_scores BEFORE=${fsBefore}`);
  console.log(`unscored companies=${unscored.length}`);
  for (const c of unscored) console.log(`  • [${c.id}] ${c.slug} — ${c.name}`);

  if (DRY_RUN) {
    console.log("DRY_RUN=1 set — exiting before any scoring.");
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set — refusing to write placeholder scores.");
  }

  const cells = unscored.flatMap(c =>
    allFrames.map(f => ({ companyId: c.id, frameId: f.id, company: c.slug, frame: f.name }))
  );
  console.log(`cells to score=${cells.length} (batch=${BATCH})`);

  const results: Row[] = [];
  const t0 = Date.now();
  let done = 0;
  for (let i = 0; i < cells.length; i += BATCH) {
    const slice = cells.slice(i, i + BATCH);
    const out = await Promise.all(slice.map(async cell => {
      const start = Date.now();
      try {
        const r = await rescoreCompanyFrame(cell.companyId, cell.frameId, { force: true });
        return {
          company: cell.company, companyId: cell.companyId, frame: cell.frame, frameId: cell.frameId,
          score: r.score, confidence: r.confidence, fallback: r.fallback,
          citations: r.citations.length, rationale: r.rationale, dtMs: Date.now() - start,
        } as Row;
      } catch (e: any) {
        return {
          company: cell.company, companyId: cell.companyId, frame: cell.frame, frameId: cell.frameId,
          score: 0, confidence: "error", fallback: true, citations: 0, rationale: "",
          dtMs: Date.now() - start, error: String(e?.message ?? e),
        } as Row;
      }
    }));
    results.push(...out);
    done += out.length;
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[${done}/${cells.length}] ${elapsed}s`);
  }

  const [{ n: fsAfter }] = ((await db.execute(sql`SELECT COUNT(*)::int AS n FROM frame_scores`)) as any).rows;

  mkdirSync("docs", { recursive: true });
  const header = "company,frame,score,confidence,fallback,citations,dt_ms,rationale\n";
  const csv = header + results.map(r => [
    r.company, r.frame, r.score, r.confidence, r.fallback, r.citations, r.dtMs,
    JSON.stringify((r.rationale || "").replace(/\n+/g, " "))
  ].join(",")).join("\n") + "\n";
  writeFileSync("docs/score-missing-v0.7.2.csv", csv);

  const byConf = results.reduce<Record<string, number>>((a, r) => {
    a[r.confidence] = (a[r.confidence] ?? 0) + 1;
    return a;
  }, {});
  const fallbacks = results.filter(r => r.fallback).length;
  const errors = results.filter(r => r.error).length;
  console.log("---");
  console.log("frame_scores BEFORE=", fsBefore, " AFTER=", fsAfter, " delta=", fsAfter - fsBefore);
  console.log("confidence:", byConf);
  console.log("fallbacks:", fallbacks, "errors:", errors);
  console.log(`wrote docs/score-missing-v0.7.2.csv (${results.length} rows)`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
