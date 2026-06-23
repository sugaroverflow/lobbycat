/**
 * v0.6 Step 13 — full re-curation pass.
 *
 * Rescore every (company × frame) cell using the real Anthropic engine.
 * Runs in small parallel batches to keep latency tolerable without hammering
 * the API. Writes a CSV summary to docs/recuration-v0.6.csv for the audit.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { writeFileSync } from "node:fs";
import { db } from "../src/db";
import { companies, frames } from "../src/db/schema";
import { rescoreCompanyFrame } from "../src/lib/scoring";

const BATCH = Number(process.env.RESCORE_BATCH ?? 6);
const ONLY_FALLBACK = process.env.ONLY_FALLBACK === "1";
const LIMIT = process.env.RESCORE_LIMIT ? Number(process.env.RESCORE_LIMIT) : undefined;

type Row = {
  company: string;
  frame: string;
  companyId: number;
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
  const allCompanies = await db.select({ id: companies.id, slug: companies.slug }).from(companies);
  const allFrames = await db.select({ id: frames.id, name: frames.name }).from(frames);
  console.log(`companies=${allCompanies.length} frames=${allFrames.length} cells=${allCompanies.length * allFrames.length}`);
  const cells: Array<{ companyId: number; frameId: number; company: string; frame: string }> = [];
  for (const c of allCompanies) for (const f of allFrames) {
    cells.push({ companyId: c.id, frameId: f.id, company: c.slug, frame: f.name });
  }
  const work = LIMIT ? cells.slice(0, LIMIT) : cells;
  const results: Row[] = [];
  let done = 0;
  const t0 = Date.now();

  for (let i = 0; i < work.length; i += BATCH) {
    const slice = work.slice(i, i + BATCH);
    const out = await Promise.all(slice.map(async (cell) => {
      const start = Date.now();
      try {
        const r = await rescoreCompanyFrame(cell.companyId, cell.frameId, { force: true });
        return {
          company: cell.company, frame: cell.frame, companyId: cell.companyId, frameId: cell.frameId,
          score: r.score, confidence: r.confidence, fallback: r.fallback,
          citations: r.citations.length, rationale: r.rationale, dtMs: Date.now() - start,
        } as Row;
      } catch (e: any) {
        return {
          company: cell.company, frame: cell.frame, companyId: cell.companyId, frameId: cell.frameId,
          score: 0, confidence: "error", fallback: true, citations: 0, rationale: "", dtMs: Date.now() - start,
          error: String(e?.message ?? e),
        } as Row;
      }
    }));
    results.push(...out);
    done += out.length;
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const rate = (done / (Date.now() - t0) * 1000).toFixed(2);
    console.log(`[${done}/${work.length}] ${elapsed}s @ ${rate} cells/s`);
  }

  // Write CSV
  const header = "company,frame,score,confidence,fallback,citations,dt_ms,rationale\n";
  const csv = header + results.map(r => [
    r.company, r.frame, r.score, r.confidence, r.fallback, r.citations, r.dtMs,
    JSON.stringify((r.rationale || "").replace(/\n+/g, " "))
  ].join(",")).join("\n") + "\n";
  writeFileSync("docs/recuration-v0.6.csv", csv);

  // Summary
  const lowConf = results.filter(r => r.confidence === "low");
  const fallbacks = results.filter(r => r.fallback);
  const errors = results.filter(r => r.error);
  const byConf = results.reduce<Record<string, number>>((a, r) => { a[r.confidence] = (a[r.confidence] ?? 0) + 1; return a; }, {});
  console.log("---");
  console.log("confidence:", byConf);
  console.log("fallbacks:", fallbacks.length, "errors:", errors.length);
  console.log("low-confidence cells (sample 10):");
  for (const r of lowConf.slice(0, 10)) {
    console.log(`  ${r.company} / ${r.frame} → ${r.score} (citations=${r.citations}): ${r.rationale.slice(0, 120)}`);
  }
  console.log(`wrote docs/recuration-v0.6.csv (${results.length} rows)`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
