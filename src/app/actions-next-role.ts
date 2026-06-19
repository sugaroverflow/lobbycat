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

export type ConcernChangeProposal =
  | { op: "add"; text: string; reason: string }
  | { op: "remove"; text: string; reason: string }
  | { op: "edit"; text: string; from: string; reason: string };

export type NextRoleProposal =
  | {
      ok: true;
      summary: string; // 2-sentence "what changed and why" signed by the cat
      weightChanges: WeightChangeProposal[];
      concernChanges: ConcernChangeProposal[];
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
 * Scope (v0.4 N2 part 2): weights + concerns. Frame scores land in part 3.
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
    "Aadi also has a list of *concerns* — short, plain-language phrases naming things he's wary about or wants to avoid (e.g. \"narrow specialist trap\", \"slow-moving institutions\"). Propose 0–4 itemised concern changes when the note clearly warrants them:",
    "  - { op: 'add', text, reason } — a NEW concern phrase Aadi just named that isn't already in his list. Match phrasing to existing concerns' tone (short, lowercase-ish, plain).",
    "  - { op: 'remove', text, reason } — an existing concern Aadi explicitly says no longer worries him. text must match an existing concern verbatim.",
    "  - { op: 'edit', text, from, reason } — rewording an existing concern. from must match verbatim; text is the replacement.",
    "If the note doesn't clearly warrant any concern changes, return an empty concernChanges array. Don't fish.",
    "Also give a 2-sentence \"summary\" signed off as the cat — 'lobbycat here:' or similar — describing what changed and why, in plain prose.",
    "Return STRICTLY a single JSON object, no prose around it, matching this TypeScript type:",
    "{ \"summary\": string, \"weightChanges\": Array<{ \"key\": string, \"from\": \"low\"|\"medium\"|\"high\"|null, \"to\": \"low\"|\"medium\"|\"high\", \"reason\": string }>, \"concernChanges\": Array<{ \"op\": \"add\"|\"remove\"|\"edit\", \"text\": string, \"from\"?: string, \"reason\": string }> }",
  ].join("\n");

  const user = [
    "CURRENT WEIGHTS:",
    JSON.stringify(currentWeights, null, 2),
    "",
    "CURRENT CONCERNS:",
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

  const concernsRaw = Array.isArray(p.concernChanges) ? p.concernChanges : [];
  const concernChanges: ConcernChangeProposal[] = [];
  const existingConcernsSet = new Set(concerns);
  for (const entry of concernsRaw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const op = typeof e.op === "string" ? e.op.trim().toLowerCase() : "";
    const text = typeof e.text === "string" ? e.text.trim() : "";
    const reason = typeof e.reason === "string" ? e.reason.trim() : "";
    if (!text) continue;
    if (op === "add") {
      if (existingConcernsSet.has(text)) continue; // dedupe — the cat re-proposed something he already has
      concernChanges.push({ op: "add", text, reason });
    } else if (op === "remove") {
      if (!existingConcernsSet.has(text)) continue; // skip phantom removes
      concernChanges.push({ op: "remove", text, reason });
    } else if (op === "edit") {
      const from = typeof e.from === "string" ? e.from.trim() : "";
      if (!from || !existingConcernsSet.has(from)) continue;
      if (from === text) continue;
      concernChanges.push({ op: "edit", text, from, reason });
    }
  }

  return {
    ok: true,
    summary: summary || "lobbycat here: a couple of small nudges, nothing dramatic.",
    weightChanges,
    concernChanges,
  };
}

/**
 * Apply a subset of accepted weight + concern changes to the profile,
 * transactionally (one UPDATE). Each entry has been reviewed in the
 * side-panel; we just merge them in.
 */
export async function applyNextRoleChanges(
  acceptedWeights: Array<{ key: string; to: WeightLevel }>,
  acceptedConcerns: ConcernChangeProposal[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hasWeights = Array.isArray(acceptedWeights) && acceptedWeights.length > 0;
  const hasConcerns = Array.isArray(acceptedConcerns) && acceptedConcerns.length > 0;
  if (!hasWeights && !hasConcerns) {
    return { ok: false, error: "Nothing accepted." };
  }
  const [existing] = await db.select().from(userProfile).limit(1);
  if (!existing) return { ok: false, error: "No profile to update." };

  const nextWeights = { ...((existing.weights as Record<string, unknown>) ?? {}) };
  for (const { key, to } of acceptedWeights ?? []) {
    const k = (key ?? "").trim();
    const v = coerceLevel(to);
    if (!k || !v) continue;
    nextWeights[k] = v;
  }

  let nextConcerns = [...((existing.concerns as string[]) ?? [])];
  for (const change of acceptedConcerns ?? []) {
    if (!change) continue;
    if (change.op === "add") {
      const t = (change.text ?? "").trim();
      if (t && !nextConcerns.includes(t)) nextConcerns.push(t);
    } else if (change.op === "remove") {
      const t = (change.text ?? "").trim();
      nextConcerns = nextConcerns.filter((c) => c !== t);
    } else if (change.op === "edit") {
      const from = (change.from ?? "").trim();
      const to = (change.text ?? "").trim();
      if (!from || !to) continue;
      nextConcerns = nextConcerns.map((c) => (c === from ? to : c));
    }
  }

  await db
    .update(userProfile)
    .set({ weights: nextWeights, concerns: nextConcerns, updatedAt: new Date() })
    .where(eq(userProfile.id, existing.id));

  revalidatePath("/about");
  revalidatePath(`/companies/[slug]`, "page");
  return { ok: true };
}

// Back-compat shim (kept until any cached client bundles roll over).
export async function applyNextRoleWeightChanges(
  accepted: Array<{ key: string; to: WeightLevel }>,
) {
  return applyNextRoleChanges(accepted, []);
}
