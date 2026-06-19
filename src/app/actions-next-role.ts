"use server";

import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type WeightLevel = "low" | "medium" | "high";

export type WeightChangeProposal = {
  key: string; // existing weight key (or new key the cat is suggesting)
  from: WeightLevel | null; // null when this is a new key
  to: WeightLevel;
  reason: string;
};

export type NextRoleProposal =
  | {
      ok: true;
      summary: string; // 2-sentence "what changed and why" signed by the cat
      weightChanges: WeightChangeProposal[];
    }
  | { ok: false; error: string };

const VALID_LEVELS: WeightLevel[] = ["low", "medium", "high"];

function coerceLevel(v: unknown): WeightLevel | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  return (VALID_LEVELS as string[]).includes(s) ? (s as WeightLevel) : null;
}

/**
 * Send Aadi's free-text "what I'm looking for in my next role" to Claude,
 * along with his current weights + concerns, and get back itemised
 * proposed weight changes plus a short signed summary. Apply step is
 * a separate action so Aadi can accept/reject per item first.
 *
 * Scope (v0.4 N2 part 1): weights only. Concerns + frame scores land in part 2.
 */
export async function proposeNextRoleChanges(
  text: string,
): Promise<NextRoleProposal> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { ok: false, error: "Tell the cat what you're after first." };
  if (trimmed.length > 4000) {
    return { ok: false, error: "Keep it under ~4000 characters for now." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "The cat needs an ANTHROPIC_API_KEY in the Vercel env vars to read your note. Ping Fatima.",
    };
  }

  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) return { ok: false, error: "No profile to update." };

  const currentWeights = (profile.weights as Record<string, unknown>) ?? {};
  const concerns = (profile.concerns as string[]) ?? [];

  const system = [
    "You are lobbycat — a thoughtful, slightly playful assistant helping Aadi figure out his next policy/AI-policy role.",
    "Aadi has a set of *weights* on his profile: each weight is a short label (e.g. \"big firm vs. founding\", \"UK pigeonhole risk\") with a level of low | medium | high. These weights shape how the dashboard scores companies for him.",
    "Read what Aadi says he's looking for. Propose 1–6 itemised changes to his weights. Each change must be one of:",
    "  - an UPDATE to an existing weight (use its existing key verbatim; from = current level)",
    "  - a NEW weight (a key that doesn't yet exist; from = null) — only when the note clearly names a new dimension Aadi cares about that none of the existing weights cover.",
    "For each change give a one-sentence reason that quotes or paraphrases what Aadi said. Be specific. Don't invent facts.",
    "Also give a 2-sentence \"summary\" signed off as the cat — 'lobbycat here:' or similar — describing what changed and why, in plain prose.",
    "Return STRICTLY a single JSON object, no prose around it, matching this TypeScript type:",
    "{ \"summary\": string, \"weightChanges\": Array<{ \"key\": string, \"from\": \"low\"|\"medium\"|\"high\"|null, \"to\": \"low\"|\"medium\"|\"high\", \"reason\": string }> }",
  ].join("\n");

  const user = [
    "CURRENT WEIGHTS:",
    JSON.stringify(currentWeights, null, 2),
    "",
    "CURRENT CONCERNS (for context, do not change in this pass):",
    JSON.stringify(concerns, null, 2),
    "",
    "AADI'S NOTE ABOUT WHAT HE'S LOOKING FOR:",
    trimmed,
  ].join("\n");

  let raw: string;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Claude refused (${res.status}). ${body.slice(0, 200)}`,
      };
    }
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    raw = (json.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\n")
      .trim();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error talking to Claude.",
    };
  }

  // Claude sometimes wraps JSON in ```json fences; strip if present.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return { ok: false, error: "Claude didn't return clean JSON. Try again." };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Claude didn't return an object." };
  }
  const p = parsed as Record<string, unknown>;
  const summary = typeof p.summary === "string" ? p.summary.trim() : "";
  const arr = Array.isArray(p.weightChanges) ? p.weightChanges : [];
  const weightChanges: WeightChangeProposal[] = [];
  for (const entry of arr) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const key = typeof e.key === "string" ? e.key.trim() : "";
    const to = coerceLevel(e.to);
    if (!key || !to) continue;
    const from = e.from === null || e.from === undefined ? null : coerceLevel(e.from);
    const reason = typeof e.reason === "string" ? e.reason.trim() : "";
    weightChanges.push({ key, from, to, reason });
  }

  return { ok: true, summary: summary || "lobbycat here: a couple of small nudges, nothing dramatic.", weightChanges };
}

/**
 * Apply a subset of accepted weight changes to the profile. Each entry
 * has been reviewed in the side-panel; we just merge them in.
 */
export async function applyNextRoleWeightChanges(
  accepted: Array<{ key: string; to: WeightLevel }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Array.isArray(accepted) || accepted.length === 0) {
    return { ok: false, error: "Nothing accepted." };
  }
  const [existing] = await db.select().from(userProfile).limit(1);
  if (!existing) return { ok: false, error: "No profile to update." };

  const current = { ...((existing.weights as Record<string, unknown>) ?? {}) };
  for (const { key, to } of accepted) {
    const k = (key ?? "").trim();
    const v = coerceLevel(to);
    if (!k || !v) continue;
    current[k] = v;
  }

  await db
    .update(userProfile)
    .set({ weights: current, updatedAt: new Date() })
    .where(eq(userProfile.id, existing.id));

  revalidatePath("/about");
  revalidatePath(`/companies/[slug]`, "page");
  return { ok: true };
}
