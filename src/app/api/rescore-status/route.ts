import { NextResponse } from "next/server";
import { isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { frameScores } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * GET /api/rescore-status
 *
 * Lightweight poll target for the animated rescoring cat (v0.6 step 11.5).
 * Returns the count of (company × frame) cells currently marked stale, plus
 * the distinct frame ids involved so the UI can tell whether one frame edit
 * or several are in flight.
 *
 * No auth — there's no sensitive data on the wire (counts + frame ids).
 */
export async function GET() {
  const stale = await db
    .select({
      companyId: frameScores.companyId,
      frameId: frameScores.frameId,
      staleAt: frameScores.staleAt,
    })
    .from(frameScores)
    .where(isNotNull(frameScores.staleAt));

  const frameIds = Array.from(new Set(stale.map((r) => r.frameId))).sort();
  return NextResponse.json(
    {
      pending: stale.length,
      frames: frameIds,
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}
