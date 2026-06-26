"use server";

import { db } from "@/db";
import { userProfile, frames as framesTable, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { rescoreCompany } from "@/lib/scoring";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";

/**
 * v0.7 step 4 — wizard server actions.
 *
 * Each step autosaves to `user_profile` so abandonment-then-resume picks
 * up where the user left off. Step 6 (`completeWizard`) is the only one
 * that triggers the rescore — earlier steps are cheap to redo.
 *
 * Steps:
 *   1. Welcome              — no persistence (just a copy beat)
 *   2. Profile              — saveWizardProfile
 *   3. Frames               — frames editor lives on /frames; the wizard
 *                              shows a read-only summary + "edit on /frames"
 *                              link. Add/edit happens via existing actions.
 *   4. Weighing (Must/Should/Could) — saveWizardWeights
 *   5. Open-text thoughts   — saveWizardOpenText
 *   6. The big moment       — completeWizard
 *
 * Everything reads/writes the single `user_profile` row (we don't yet
 * support multi-tenant; the gate is a single shared password).
 */

async function getOrCreateProfile() {
  const [existing] = await db.select().from(userProfile).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(userProfile)
    .values({ displayName: "you" })
    .returning();
  return created;
}

/* ------------------------------------------------------------------ */
/* Step 2 — Profile                                                   */
/* ------------------------------------------------------------------ */

export async function saveWizardProfile(patch: {
  displayName?: string;
  currentRoleOneLiner?: string | null;
  exploringText?: string | null;
  locationPreferences?: {
    uk?: boolean;
    eu?: boolean;
    us?: boolean;
    remoteOk?: boolean;
    notes?: string;
  };
}) {
  const profile = await getOrCreateProfile();
  const next: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.displayName !== undefined) {
    const v = patch.displayName.trim();
    if (v) next.displayName = v;
  }
  if (patch.currentRoleOneLiner !== undefined) {
    next.currentRoleOneLiner = patch.currentRoleOneLiner?.trim() || null;
  }
  if (patch.exploringText !== undefined) {
    next.exploringText = patch.exploringText?.trim() || null;
  }
  if (patch.locationPreferences !== undefined) {
    next.locationPreferences = {
      uk: !!patch.locationPreferences.uk,
      eu: !!patch.locationPreferences.eu,
      us: !!patch.locationPreferences.us,
      remoteOk: !!patch.locationPreferences.remoteOk,
      notes: patch.locationPreferences.notes?.trim() || "",
    };
  }
  await db.update(userProfile).set(next).where(eq(userProfile.id, profile.id));
  revalidatePath("/wizard");
  revalidatePath("/profile");
}

/* ------------------------------------------------------------------ */
/* Step 4 — Weighing (L/M/H per frame, aliased Must/Should/Could)     */
/* ------------------------------------------------------------------ */

export async function saveWizardWeights(
  patch: Record<string, FrameWeightLevel>,
) {
  const profile = await getOrCreateProfile();
  const current = (profile.frameWeights ?? {}) as Record<
    string,
    FrameWeightLevel
  >;
  const next: Record<string, FrameWeightLevel> = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== "low" && v !== "medium" && v !== "high") continue;
    const key = k.trim();
    if (!key) continue;
    next[key] = v;
  }
  await db
    .update(userProfile)
    .set({ frameWeights: next, updatedAt: new Date() })
    .where(eq(userProfile.id, profile.id));
  revalidatePath("/wizard");
  revalidatePath("/frames");
}

/* ------------------------------------------------------------------ */
/* Step 5 — Open-text thoughts                                        */
/* ------------------------------------------------------------------ */

export async function saveWizardOpenText(
  answers: Array<{ question: string; answer: string }>,
) {
  const profile = await getOrCreateProfile();
  const now = new Date().toISOString();
  const cleaned = answers
    .map((a) => ({
      question: (a.question || "").trim(),
      answer: (a.answer || "").trim(),
      answeredAt: now,
    }))
    .filter((a) => a.question.length > 0);
  await db
    .update(userProfile)
    .set({ openTextAnswers: cleaned, updatedAt: new Date() })
    .where(eq(userProfile.id, profile.id));
  revalidatePath("/wizard");
  revalidatePath("/profile");
}

/* ------------------------------------------------------------------ */
/* Step 6 — Complete + rescore                                        */
/* ------------------------------------------------------------------ */

export async function completeWizard(): Promise<{ ok: true; total: number }> {
  const profile = await getOrCreateProfile();
  const allCompanies = await db
    .select({ id: companies.id })
    .from(companies);

  await db
    .update(userProfile)
    .set({
      wizardCompletedAt: new Date(),
      // v0.7.2 step 8 — only legit completion path stamps 'wizard-form'.
      // Anything else leaves the column at its 'seed' default, which the
      // wizard-integrity health route flags.
      completedVia: "wizard-form",
      onboardedAt: profile.onboardedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userProfile.id, profile.id));

  // Fan-out rescore in the background so the user can move on. The
  // wizard step-6 takeover UI loops the firstScoring[] quotes for ~20-30s
  // regardless of how long the real fan-out takes — completion checks
  // wizardCompletedAt, not the rescore itself.
  after(async () => {
    for (const c of allCompanies) {
      try {
        await rescoreCompany(c.id, undefined, { force: true });
      } catch {
        // best-effort; nightly /api/cron/rescore catches anything left.
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/wizard");
  return { ok: true, total: allCompanies.length };
}

/* ------------------------------------------------------------------ */
/* Used by /profile "Replay onboarding"                                 */
/* ------------------------------------------------------------------ */

export async function resetWizard() {
  const profile = await getOrCreateProfile();
  await db
    .update(userProfile)
    .set({ wizardCompletedAt: null, completedVia: "seed", updatedAt: new Date() })
    .where(eq(userProfile.id, profile.id));
  revalidatePath("/");
  revalidatePath("/wizard");
  revalidatePath("/profile");
}

/* ------------------------------------------------------------------ */
/* Frame name update — used by step-3 inline-edit                     */
/* ------------------------------------------------------------------ */

export async function renameWizardFrame(frameId: number, name: string) {
  const v = name.trim();
  if (!v) return;
  await db
    .update(framesTable)
    .set({ name: v })
    .where(eq(framesTable.id, frameId));
  revalidatePath("/wizard");
  revalidatePath("/frames");
}
