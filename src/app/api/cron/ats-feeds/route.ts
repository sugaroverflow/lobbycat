import { NextResponse } from "next/server";
import { runAtsPipeline } from "@/lib/ats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/ats-feeds
 *
 * Daily ATS pull. Vercel cron invokes this with `Authorization: Bearer $CRON_SECRET`.
 * In dev you can hit it directly; in prod CRON_SECRET MUST be set or the route refuses.
 *
 * Query params:
 *   ?slugs=anthropic,mistral   — restrict to specific company slugs (testing)
 *   ?dryRun=1                  — fetch only; do not write
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
    ? slugsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  try {
    const result = await runAtsPipeline({ onlySlugs, dryRun });
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
