import { NextResponse } from "next/server";
import { runConsultationsPipeline } from "@/lib/consultations";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/cron/consultations
 *
 * Re-ingests `src/db/consultations-seed.json` into `consultation_submissions`.
 * v0.6 evidence pipeline #4 — Step 10.
 *
 * Same auth model as the other cron routes:
 *   - Vercel cron header (x-vercel-cron: 1), or
 *   - `Authorization: Bearer $CRON_SECRET`
 *
 * Query params:
 *   ?slugs=anthropic-london,openai-london   — restrict to specific slugs
 *   ?dryRun=1                               — parse + match but do not write
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
  const dryRun = url.searchParams.get("dryRun") === "1";
  const onlySlugs = slugsParam
    ? slugsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  try {
    const result = await runConsultationsPipeline({ dryRun, onlySlugs });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
