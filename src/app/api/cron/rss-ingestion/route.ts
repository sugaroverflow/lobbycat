import { NextResponse } from "next/server";
import { runRssPipeline } from "@/lib/rss";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/rss-ingestion
 *
 * Daily pull of each company's blogRssUrl + pressRssUrl, with Claude Haiku
 * summarisation. Mirrors the auth model of /api/cron/ats-feeds:
 *   - Vercel cron header (x-vercel-cron: 1), or
 *   - `Authorization: Bearer $CRON_SECRET`
 *
 * Query params:
 *   ?slugs=anthropic,mistral   — restrict to specific company slugs
 *   ?dryRun=1                  — fetch+summarise but do not write
 *   ?max=<n>                   — cap new items summarised per feed (default 10)
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
  const maxParam = url.searchParams.get("max");
  const maxNewPerFeed = maxParam ? Math.max(1, parseInt(maxParam, 10)) : undefined;

  const onlySlugs = slugsParam
    ? slugsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  try {
    const result = await runRssPipeline({ onlySlugs, dryRun, maxNewPerFeed });
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
