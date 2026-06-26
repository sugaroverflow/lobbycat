/**
 * v0.8 step 8 — Welcome-back clarify offer.
 *
 * Decides whether to surface the "want to sit with this for a minute?"
 * CTA on the welcome card. See docs/REFACTOR-v0.8.md §10 step 8 and
 * §3.2 for the design intent ("is there drift worth a clarify?").
 *
 * Heuristic (v0.8 first cut — see ASSUMPTIONS-v0.8.md A8.1):
 *   1. The user is past onboarding (caller already guarantees this).
 *   2. Cap: no `welcome-back`-triggered clarify session in the last
 *      7 days. The spec is "once a week max"; we read that as a hard
 *      cooldown rather than a calendar-week boundary.
 *   3. Drift signal: there is at least one welcome-back diff event at
 *      a company the user scores ≥4 on one of their high-weighted
 *      frames in the last 14 days. ("Worth a clarify" = recent event
 *      on something they care about and rate highly.)
 *
 * If all three hold, we return `{ offer: true, ... }` with a seed
 * company + a seedLine the cat can open on. Otherwise `{ offer: false }`.
 *
 * Deliberately small surface — we do not try to predict drift from
 * scoring patterns yet (that's Step 12's tuning pass against the live
 * skill, with real session data to learn from).
 */

import { and, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { clarifySessions } from "@/db/schema";
import type { WelcomeBackData } from "@/lib/welcome-back";

export type WelcomeBackOffer =
  | { offer: false }
  | {
      offer: true;
      seedCompanyId: number | null;
      seedFrameId: number | null;
      seedLine: string;
    };

const COOLDOWN_DAYS = 7;

export async function buildWelcomeBackOffer({
  welcomeBack,
  companies,
  scores,
  frameWeights,
  frames,
}: {
  welcomeBack: WelcomeBackData;
  companies: Array<{ id: number; slug: string; name: string }>;
  scores: Array<{
    companyId: number;
    frameId: number;
    score: number | null;
  }>;
  frameWeights: Record<string, "low" | "medium" | "high">;
  frames: Array<{ id: number; name: string }>;
}): Promise<WelcomeBackOffer> {
  // Gate 0: we need an available diff with at least one named event to
  // have anything concrete to seed on. The welcome-back card itself
  // degrades gracefully when this isn't true; so does the offer.
  if (!welcomeBack.available || welcomeBack.bullets.length === 0) {
    return { offer: false };
  }

  // Gate 1: cooldown. If there's any welcome-back session in the last
  // 7 days (regardless of outcome), don't offer again.
  const cooldownStart = new Date(
    Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
  );
  const recent = await db
    .select({ id: clarifySessions.id })
    .from(clarifySessions)
    .where(
      and(
        eq(clarifySessions.trigger, "welcome-back"),
        gte(clarifySessions.startedAt, cooldownStart),
      ),
    )
    .orderBy(desc(clarifySessions.startedAt))
    .limit(1);
  if (recent.length > 0) return { offer: false };

  // Gate 2: drift signal. Find the user's high-weighted frames; if none,
  // fall back to the single highest-priority frame (same tie-break the
  // welcome-back builder uses).
  const highFrames = frames.filter(
    (f) => frameWeights[String(f.id)] === "high",
  );
  const priorityFrames =
    highFrames.length > 0
      ? highFrames
      : pickFocusFrame(frames, frameWeights);

  const priorityFrameIds = new Set(priorityFrames.map((f) => f.id));
  if (priorityFrameIds.size === 0) return { offer: false };

  // Map companyId → max score across the priority frames.
  const topScoreByCompany = new Map<number, number>();
  // Map companyId → which priority frame they top out on (for seedLine).
  const topFrameByCompany = new Map<number, number>();
  for (const s of scores) {
    if (s.score === null) continue;
    if (!priorityFrameIds.has(s.frameId)) continue;
    const prev = topScoreByCompany.get(s.companyId);
    if (prev === undefined || s.score > prev) {
      topScoreByCompany.set(s.companyId, s.score);
      topFrameByCompany.set(s.companyId, s.frameId);
    }
  }

  // Walk the welcome-back bullets (already sorted by company priority +
  // recency) and pick the first one whose company crosses the ≥4 bar.
  const frameNameById = new Map(frames.map((f) => [f.id, f.name]));

  for (const bullet of welcomeBack.bullets) {
    if (bullet.kind !== "named") continue;
    // bullet.text is "{companyName} — {summary}". Re-derive the company
    // by prefix match against `companies`; the WelcomeBackData type does
    // not carry a structured company ref. See ASSUMPTIONS A8.2 for the
    // v0.9 plan to expose the slug on the bullet directly.
    const dashIdx = bullet.text.indexOf("—");
    if (dashIdx === -1) continue;
    const companyName = bullet.text.slice(0, dashIdx).trim();
    const companyEntry = companies.find((c) => c.name === companyName);
    if (!companyEntry) continue;
    const companyId = companyEntry.id;
    const top = topScoreByCompany.get(companyId);
    if (top === undefined || top < 4) continue;
    const frameId = topFrameByCompany.get(companyId) ?? null;
    const frameName = frameId ? frameNameById.get(frameId) : null;
    const summary = bullet.text.slice(dashIdx + 1).trim();
    const seedLine = frameName
      ? `Something at ${companyEntry.name} caught my eye since you were last in — about your "${frameName}" frame. ${summary}`
      : `Something at ${companyEntry.name} caught my eye since you were last in. ${summary}`;
    return {
      offer: true,
      seedCompanyId: companyId,
      seedFrameId: frameId,
      seedLine,
    };
  }

  return { offer: false };
}

function pickFocusFrame(
  frames: Array<{ id: number; name: string }>,
  frameWeights: Record<string, "low" | "medium" | "high">,
): Array<{ id: number; name: string }> {
  const weightOrder: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  const sorted = [...frames].sort((a, b) => {
    const aw = weightOrder[frameWeights[String(a.id)] ?? "medium"] ?? 2;
    const bw = weightOrder[frameWeights[String(b.id)] ?? "medium"] ?? 2;
    if (aw !== bw) return bw - aw;
    return a.id - b.id;
  });
  return sorted.slice(0, 1);
}
