"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Mark the single-row user profile as having completed the coachmark
 * onboarding tour (v0.4 N3). Idempotent — if `onboardedAt` is already set,
 * leaves it untouched. If no profile row exists yet, this is a no-op (the
 * coachmark just won't re-fire on next load thanks to the cookie fallback
 * in the client).
 */
export async function markOnboarded(): Promise<{ ok: true }> {
  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) return { ok: true };
  if (profile.onboardedAt) return { ok: true };

  await db
    .update(userProfile)
    .set({ onboardedAt: new Date() })
    .where(eq(userProfile.id, profile.id));

  revalidatePath("/");
  return { ok: true };
}

/**
 * Clear `onboardedAt` so the "show me around again" affordance can re-trigger
 * the tour on the next homepage load.
 */
export async function resetOnboarding(): Promise<{ ok: true }> {
  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) return { ok: true };

  await db
    .update(userProfile)
    .set({ onboardedAt: null })
    .where(eq(userProfile.id, profile.id));

  revalidatePath("/");
  return { ok: true };
}
