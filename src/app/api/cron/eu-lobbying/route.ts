import { NextResponse } from "next/server";
import { runEuTransparencyPipeline } from "@/lib/eu-transparency";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/eu-lobbying
 *
 * Daily pull of the EU Transparency Register bulk CSV, matched against
 * `companies.name` and upserted as `lobbying_records` rows with
 * `jurisdiction = 'eu'`. Same auth model as the other cron routes.
 *
 * Query params:
 *   ?url=<csv-url>            — override the source URL (testing / when the
 *                               upstream URL rotates)
 *   ?slugs=anthropic,mistral  — restrict matcher to these slugs
 *   ?dryRun=1                 — parse + match but do not write
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
  const urlOverride = url.searchParams.get("url") ?? undefined;
  const dryRun = url.searchParams.get("dryRun") === "1";
  const slugsParam = url.searchParams.get("slugs");
  const onlySlugs = slugsParam
    ? slugsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  try {
    const result = await runEuTransparencyPipeline({
      url: urlOverride,
      dryRun,
      onlySlugs,
    });
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
