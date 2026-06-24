import { NextResponse } from "next/server";
import {
  generateFitNoteForCompany,
  selectCompaniesForGeneration,
  fitNoteFreshnessMap,
} from "@/lib/fit-notes/generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/fit-notes
 *
 * v0.7.2 Step 6 — Glyphie-nightly companion. Re-generates fit notes for
 * companies that either (a) have no fit note yet, or (b) had new evidence
 * land within the lookback window (default 26h, which covers a missed
 * daily run).
 *
 * Designed to run AFTER `/api/cron/feeds-sync` (09:00 UTC) and
 * `/api/cron/rescore` (08:00 UTC) so the new fit note can incorporate the
 * day's research. We slot in at 09:30 UTC in vercel.json.
 *
 * Auth model matches the other lobbycat crons:
 *   - Vercel cron header (x-vercel-cron: 1), or
 *   - `Authorization: Bearer $CRON_SECRET`
 *
 * Query params:
 *   ?lookbackHours=26     — override the changed-since window
 *   ?skipIfNewerHours=20  — skip companies whose latest fit note is fresher
 *                            than this (default 20h; lets the same company
 *                            still get a fresh note if real evidence landed)
 *   ?max=10               — cap the run size as a budget guard (default 25)
 *   ?dryRun=1             — list, don't write
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (process.env.NODE_ENV === "production") {
    if (!expected) {
      return NextResponse.json(
        { ok: false, error: "CRON_SECRET not configured" },
        { status: 500 },
      );
    }
    if (!isVercelCron && auth !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const lookbackHours = Math.max(1, Number(url.searchParams.get("lookbackHours") ?? "26"));
  const skipIfNewerHours = Math.max(
    0,
    Number(url.searchParams.get("skipIfNewerHours") ?? "20"),
  );
  const max = Math.max(1, Number(url.searchParams.get("max") ?? "25"));
  const dryRun = url.searchParams.get("dryRun") === "1";

  const candidates = await selectCompaniesForGeneration({
    mode: "missing-or-changed",
    changedSinceMs: lookbackHours * 60 * 60 * 1000,
  });

  const freshness = await fitNoteFreshnessMap(candidates.map((c) => c.id));
  const skipWindowMs = skipIfNewerHours * 60 * 60 * 1000;

  // Prefer companies with no fit-note ever, then oldest-fit-note first.
  const ranked = candidates
    .map((c) => ({ c, last: freshness.get(c.id) ?? null }))
    .sort((a, b) => {
      if (!a.last && b.last) return -1;
      if (a.last && !b.last) return 1;
      if (!a.last && !b.last) return a.c.id - b.c.id;
      return a.last!.getTime() - b.last!.getTime();
    });

  const eligible = ranked
    .filter(({ last }) => !last || Date.now() - last.getTime() >= skipWindowMs)
    .slice(0, max);
  const skippedRecent = ranked.length - eligible.length;

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      mode: "dryRun",
      candidates: candidates.length,
      eligible: eligible.length,
      skippedRecent,
      plan: eligible.map((e) => ({
        slug: e.c.slug,
        last: e.last?.toISOString() ?? null,
      })),
    });
  }

  const results: Array<{
    slug: string;
    status: string;
    bytes?: number;
    error?: string;
  }> = [];
  let written = 0;
  let failed = 0;

  // Sequential — the cron has a max of `max` companies, ~3-4s per call.
  // Anthropic happier than burst-parallel from a serverless function.
  for (const { c } of eligible) {
    try {
      const r = await generateFitNoteForCompany(c.id, { source: "nightly" });
      if (r.status === "written") {
        written += 1;
        results.push({ slug: c.slug, status: "written", bytes: r.bytes });
      } else if (r.status === "failed") {
        failed += 1;
        results.push({ slug: c.slug, status: "failed", error: r.error });
      } else {
        results.push({ slug: c.slug, status: r.status });
      }
    } catch (err) {
      failed += 1;
      results.push({
        slug: c.slug,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    eligible: eligible.length,
    written,
    failed,
    skippedRecent,
    results,
  });
}
