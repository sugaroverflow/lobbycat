import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Liveness + DB reachability probe for external uptime monitors.
// Unauthenticated by design (see middleware allowlist).
// Cheap query against the small `frames` table; once Track A merges,
// the db proxy gives us the retry wrapper for free.

export const dynamic = "force-dynamic";

const VERSION = "0.7.2";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const started = Date.now();

  try {
    await db.execute(sql`select count(*) from frames`);
    const dbLatencyMs = Date.now() - started;
    return NextResponse.json(
      { status: "ok", dbLatencyMs, version: VERSION, checkedAt },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const dbLatencyMs = Date.now() - started;
    const errorClass =
      err instanceof Error ? err.constructor.name : typeof err;
    return NextResponse.json(
      {
        status: "down",
        dbLatencyMs,
        version: VERSION,
        checkedAt,
        errorClass,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
