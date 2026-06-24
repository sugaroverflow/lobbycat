/**
 * v0.7.2 Step 6 — One-off backfill of fit notes for every company.
 *
 * Why: Pre-v0.7.2 fit notes were lazy — Aadi had to click "generate" on each
 * card. Per REFACTOR-v0.7.2.md §4 we pre-generate one for every company on
 * the v0.7.2 deploy so the card empty-state goes away.
 *
 * Behaviour:
 *   - Default mode: skip any company that already has a fit-note newer than
 *     `SKIP_IF_NEWER_HOURS` (default 168h = 7 days). Pass `FORCE=1` to
 *     regenerate everything.
 *   - Batches at `BATCH` companies in parallel (default 4) — keeps Anthropic
 *     happy and the run finishes in a few minutes for 40-70 companies.
 *   - Writes a CSV summary to `docs/backfill-fit-notes-v0.7.2.csv` (rolled
 *     up: timestamp, slug, status, bytes/error).
 *   - Refuses to run unless `ANTHROPIC_API_KEY` is set (no placeholder writes).
 *
 * Cost: ~$0.01-0.02 per company × 40-70 companies ≈ $0.50-$1.50 per pass.
 *
 * Usage:
 *   npx tsx scripts/backfill-fit-notes.ts
 *   FORCE=1 npx tsx scripts/backfill-fit-notes.ts
 *   DRY_RUN=1 npx tsx scripts/backfill-fit-notes.ts
 *   ONLY_SLUGS=anthropic-london,wayve npx tsx scripts/backfill-fit-notes.ts
 *   BATCH=2 SKIP_IF_NEWER_HOURS=24 npx tsx scripts/backfill-fit-notes.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import {
  generateFitNoteForCompany,
  selectCompaniesForGeneration,
  fitNoteFreshnessMap,
} from "../src/lib/fit-notes/generate";

const FORCE = process.env.FORCE === "1";
const DRY_RUN = process.env.DRY_RUN === "1";
const BATCH = Math.max(1, Number(process.env.BATCH ?? "4"));
const SKIP_IF_NEWER_HOURS = Math.max(0, Number(process.env.SKIP_IF_NEWER_HOURS ?? "168"));
const ONLY_SLUGS = (process.env.ONLY_SLUGS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const CSV_PATH = "docs/backfill-fit-notes-v0.7.2.csv";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set — refusing to run.");
    process.exit(1);
  }

  let companies = await selectCompaniesForGeneration({ mode: "all" });
  if (ONLY_SLUGS.length) {
    companies = companies.filter((c) => ONLY_SLUGS.includes(c.slug));
  }

  if (companies.length === 0) {
    console.log("No companies to process. Done.");
    return;
  }

  const freshness = await fitNoteFreshnessMap(companies.map((c) => c.id));
  const skipWindowMs = SKIP_IF_NEWER_HOURS * 60 * 60 * 1000;

  const planned = companies.map((c) => {
    const last = freshness.get(c.id);
    const shouldSkip = !FORCE && last && Date.now() - last.getTime() < skipWindowMs;
    return { ...c, last, shouldSkip: !!shouldSkip };
  });

  const toRun = planned.filter((p) => !p.shouldSkip);
  const skipped = planned.filter((p) => p.shouldSkip);

  console.log(
    `Backfill fit-notes — companies: ${planned.length}, to-run: ${toRun.length}, skipped: ${skipped.length} (FORCE=${FORCE ? "1" : "0"}, SKIP_IF_NEWER_HOURS=${SKIP_IF_NEWER_HOURS}, BATCH=${BATCH})`,
  );

  if (DRY_RUN) {
    console.log("DRY_RUN=1 — listing planned actions, not calling Anthropic:");
    for (const p of planned) {
      const tag = p.shouldSkip ? "SKIP" : "RUN ";
      const last = p.last ? p.last.toISOString() : "never";
      console.log(`  ${tag} ${p.slug.padEnd(36)} last=${last}`);
    }
    return;
  }

  const rows: string[] = ["timestamp,slug,status,bytes_or_error"];
  for (const s of skipped) {
    rows.push(
      `${new Date().toISOString()},${s.slug},skipped-recent,${s.last?.toISOString() ?? ""}`,
    );
  }

  let written = 0;
  let failed = 0;
  const failures: Array<{ slug: string; error: string }> = [];

  for (let i = 0; i < toRun.length; i += BATCH) {
    const batch = toRun.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (p) => {
        try {
          const r = await generateFitNoteForCompany(p.id, { source: "backfill" });
          return { p, r };
        } catch (err) {
          return {
            p,
            r: {
              status: "failed" as const,
              companyId: p.id,
              error: err instanceof Error ? err.message : String(err),
            },
          };
        }
      }),
    );
    for (const { p, r } of results) {
      const ts = new Date().toISOString();
      if (r.status === "written") {
        written += 1;
        rows.push(`${ts},${p.slug},written,${r.bytes}`);
        console.log(`  ✓ ${p.slug} (${r.bytes} bytes)`);
      } else if (r.status === "failed") {
        failed += 1;
        failures.push({ slug: p.slug, error: r.error });
        rows.push(`${ts},${p.slug},failed,"${r.error.replace(/"/g, '""')}"`);
        console.log(`  ✗ ${p.slug} — ${r.error}`);
      } else if (r.status === "skipped-recent") {
        rows.push(`${ts},${p.slug},skipped-recent,${r.lastCreatedAt.toISOString()}`);
        console.log(`  - ${p.slug} (skipped — recent)`);
      } else {
        rows.push(`${ts},${p.slug},${r.status},`);
      }
    }
  }

  mkdirSync(dirname(CSV_PATH), { recursive: true });
  writeFileSync(CSV_PATH, rows.join("\n") + "\n", "utf8");

  console.log("");
  console.log(
    `Done. written=${written}, failed=${failed}, skipped-recent=${skipped.length}. CSV → ${CSV_PATH}`,
  );
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f.slug}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("backfill-fit-notes fatal:", err);
  process.exit(1);
});
