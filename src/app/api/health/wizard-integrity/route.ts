import { NextResponse } from "next/server";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { userProfile } from "@/db/schema";

/**
 * v0.7.2 step 8 — Wizard auto-fill defense.
 *
 * Returns 503 if any user_profile row has wizard_completed_at set AND
 * completed_via != 'wizard-form'. That's the signal Fatima got bitten by
 * in v0.7.1: wizard_completed_at silently flipping without the user
 * actually going through the wizard. The only path that writes
 * 'wizard-form' is finalizeWizard() in actions-wizard.ts; anything else
 * (seed scripts, manual SQL, future broken auto-fill) leaves the column
 * at its 'seed' default and trips this alert.
 *
 * Plug into any uptime monitor (Better Stack, UptimeRobot, Vercel
 * monitor) the same way as /api/health. Unauthenticated by design
 * (returns counts only, no PII).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const bad = await db
      .select({ id: userProfile.id })
      .from(userProfile)
      .where(
        and(
          isNotNull(userProfile.wizardCompletedAt),
          ne(userProfile.completedVia, "wizard-form"),
        ),
      );

    if (bad.length > 0) {
      // Surfaces in Vercel function logs even without Sentry wired.
      console.error(
        `[wizard-integrity] ${bad.length} profile(s) have wizard_completed_at set but completed_via != 'wizard-form' — auto-fill bypass suspected`,
      );
      return NextResponse.json(
        {
          status: "alert",
          reason: "wizard_completed_at set with non-wizard completed_via",
          count: bad.length,
          checkedAt,
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { status: "ok", count: 0, checkedAt },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const errorClass =
      err instanceof Error ? err.constructor.name : typeof err;
    return NextResponse.json(
      { status: "down", errorClass, checkedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
