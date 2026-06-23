import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  companies as companiesTable,
  frames as framesTable,
  frameScores,
} from "@/db/schema";
import { rescoreCompanyFrame } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/rescore
 *
 * Nightly catch-up: re-score the stalest (company × frame) cells until we hit
 * a per-run budget. Mirrors auth model of the other crons:
 *   - x-vercel-cron: 1, or
 *   - Authorization: Bearer $CRON_SECRET
 *
 * Query params:
 *   ?slugs=anthropic,deepmind   restrict to specific companies
 *   ?max=<n>                    cap rescores this run (default 20)
 *   ?force=1                    ignore evidence-version short-circuit
 *   ?dryRun=1                   list candidates, do not call model/write
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
      return NextResponse.json(
        { ok: false, error: "unauthorised" },
        { status: 401 },
      );
    }
  }

  const url = new URL(request.url);
  const slugsParam = url.searchParams.get("slugs");
  const maxParam = url.searchParams.get("max");
  const dryRun = url.searchParams.get("dryRun") === "1";
  const force = url.searchParams.get("force") === "1";
  const max = Math.max(1, Math.min(200, Number(maxParam) || 20));

  const slugList = slugsParam
    ? slugsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  // Find all (company, frame) pairs and left-join their score; oldest first.
  const allCompanies = await db.select().from(companiesTable);
  const allFrames = await db
    .select()
    .from(framesTable)
    .orderBy(asc(framesTable.sortIndex));

  const candidates: Array<{
    companyId: number;
    companySlug: string;
    frameId: number;
    scoredAt: Date | null;
  }> = [];

  for (const c of allCompanies) {
    if (slugList && !slugList.includes(c.slug)) continue;
    for (const f of allFrames) {
      const [existing] = await db
        .select({ scoredAt: frameScores.scoredAt })
        .from(frameScores)
        .where(
          and(
            eq(frameScores.companyId, c.id),
            eq(frameScores.frameId, f.id),
          ),
        )
        .limit(1);
      candidates.push({
        companyId: c.id,
        companySlug: c.slug,
        frameId: f.id,
        scoredAt: existing?.scoredAt ?? null,
      });
    }
  }

  // Sort: nulls (never-scored) first, then oldest scoredAt.
  candidates.sort((a, b) => {
    if (a.scoredAt === null && b.scoredAt === null) return 0;
    if (a.scoredAt === null) return -1;
    if (b.scoredAt === null) return 1;
    return a.scoredAt.getTime() - b.scoredAt.getTime();
  });

  const batch = candidates.slice(0, max);

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      totalCandidates: candidates.length,
      wouldRescore: batch.length,
      sample: batch.slice(0, 10),
    });
  }

  const results: Array<{
    companySlug: string;
    frameId: number;
    score: number;
    fallback: boolean;
    error?: string;
  }> = [];

  for (const cand of batch) {
    try {
      const r = await rescoreCompanyFrame(cand.companyId, cand.frameId, {
        force,
      });
      results.push({
        companySlug: cand.companySlug,
        frameId: cand.frameId,
        score: r.score,
        fallback: r.fallback,
      });
    } catch (err) {
      results.push({
        companySlug: cand.companySlug,
        frameId: cand.frameId,
        score: 0,
        fallback: true,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    rescored: results.length,
    totalCandidates: candidates.length,
    results,
  });
}
