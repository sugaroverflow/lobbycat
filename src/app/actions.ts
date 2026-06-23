"use server";

import { db } from "@/db";
import {
  companies,
  frameScores,
  fitNotes,
  fitNoteMessages,
  userProfile,
  frames as framesTable,
  tags as tagsTable,
  companyNotes,
} from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type FrameKind = "scale" | "tag" | "question";

function normalizeFrameInput(input: {
  name: string;
  description?: string | null;
  kind: FrameKind;
  scale?: number | null;
  highLabel?: string | null;
  lowLabel?: string | null;
  prompt?: string | null;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Frame name is required.");
  const kind = input.kind;
  if (!(["scale", "tag", "question"] as const).includes(kind)) {
    throw new Error("Invalid frame kind.");
  }
  const description = input.description?.trim() || null;
  if (kind === "scale") {
    const rawScale = Number(input.scale ?? 5);
    const scale = Math.min(Math.max(Number.isFinite(rawScale) ? Math.trunc(rawScale) : 5, 2), 10);
    return {
      name,
      description,
      kind,
      scale,
      highLabel: input.highLabel?.trim() || null,
      lowLabel: input.lowLabel?.trim() || null,
      prompt: null,
    };
  }
  if (kind === "question") {
    const prompt = input.prompt?.trim() || null;
    if (!prompt) throw new Error("Question frames need a prompt.");
    return {
      name,
      description,
      kind,
      scale: 5,
      highLabel: null,
      lowLabel: null,
      prompt,
    };
  }
  // tag-kind: no extra fields, but ensure scale/highLabel/lowLabel/prompt are null-ish
  return {
    name,
    description,
    kind,
    scale: 5,
    highLabel: null,
    lowLabel: null,
    prompt: null,
  };
}

export async function createFrame(input: {
  name: string;
  description?: string | null;
  kind: FrameKind;
  scale?: number | null;
  highLabel?: string | null;
  lowLabel?: string | null;
  prompt?: string | null;
}) {
  const values = normalizeFrameInput(input);
  const existing = await db.select().from(framesTable);
  const maxSort = existing.reduce(
    (m, f) => (f.sortIndex > m ? f.sortIndex : m),
    -1,
  );
  await db
    .insert(framesTable)
    .values({ ...values, sortIndex: maxSort + 1 });
  revalidatePath("/frames");
  revalidatePath("/");
}

export async function updateFrame(input: {
  id: number;
  name: string;
  description?: string | null;
  kind: FrameKind;
  scale?: number | null;
  highLabel?: string | null;
  lowLabel?: string | null;
  prompt?: string | null;
}) {
  const values = normalizeFrameInput(input);
  await db.update(framesTable).set(values).where(eq(framesTable.id, input.id));
  revalidatePath("/frames");
  revalidatePath("/");
  revalidatePath(`/companies/[slug]`, "page");
}

export type SuggestedFrame = {
  name: string;
  description: string | null;
  kind: FrameKind;
  prompt: string | null;
  lowLabel: string | null;
  highLabel: string | null;
  scale: number | null;
  rationale: string;
};

/**
 * Ask the cat (Claude) to propose 2–3 new frames that fill a gap in the
 * user's current evaluation system, grounded in the user profile, the
 * existing frame set, and the universe of company tags/focus areas the
 * dashboard knows about. Returns a structured array the editor can offer
 * as one-click adds — no DB writes happen here.
 */
export async function suggestFrames(): Promise<SuggestedFrame[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) throw new Error("user profile not seeded");

  const allFrames = await db
    .select()
    .from(framesTable)
    .orderBy(framesTable.sortIndex);

  const allTags = await db.select().from(tagsTable);
  const allCompanies = await db.select().from(companies);
  const focusAreas = Array.from(
    new Set(
      allCompanies.flatMap((c) => (c.focusAreas as string[]) ?? []),
    ),
  ).sort();

  const framesContext = allFrames
    .map((f) => {
      if (f.kind === "scale") {
        return `- [scale] ${f.name} (1=${f.lowLabel || "?"} → ${f.scale}=${f.highLabel || "?"})${f.description ? `: ${f.description}` : ""}`;
      }
      if (f.kind === "question") {
        return `- [question] ${f.name}: "${f.prompt}"`;
      }
      return `- [tag] ${f.name}${f.description ? `: ${f.description}` : ""}`;
    })
    .join("\n");

  const system = `You are lobbycat — a thoughtful, slightly catty research familiar helping ${profile.displayName.split(" ")[0]} build out the evaluation system they use to decide between policy-AI roles. Your job is to spot GAPS in the user's current set of evaluation frames and propose new ones that would sharpen their thinking. You return STRICT JSON only — no preamble, no markdown fences, no closing remarks.`;

  const userPrompt = `# User profile

**${profile.displayName}** — ${profile.headline}

${profile.bio}

Stated concerns:
${(profile.concerns as string[]).map((c) => `- ${c}`).join("\n")}

# Existing frames (the user already thinks on these)

${framesContext || "(none)"}

# The company universe these frames are applied to

Tags in use: ${allTags.map((t) => t.label).join(", ") || "(none)"}

Focus areas across companies: ${focusAreas.join(", ") || "(none)"}

# Your task

Propose 2 to 3 NEW frames that fill a real gap in the existing set — questions the user isn't yet asking themselves but probably should, given their stated concerns and the kinds of companies they're evaluating. Bias toward question-kind frames (free-text prompts) because the user is in a thinking-out-loud phase, but include a scale-kind frame if a numeric axis genuinely sharpens the decision. Avoid duplicating any existing frame in spirit.

Return STRICT JSON in this exact shape — an object with a "frames" array. No other keys, no markdown, no prose:

{
  "frames": [
    {
      "name": "short title, max 5 words",
      "kind": "question" | "scale",
      "description": "one-sentence reading guide for the frame",
      "prompt": "the question to ask each company (REQUIRED if kind is question, else null)",
      "lowLabel": "what a 1 means (REQUIRED if kind is scale, else null)",
      "highLabel": "what a 5 means (REQUIRED if kind is scale, else null)",
      "scale": 5 (REQUIRED integer 2-10 if kind is scale, else null),
      "rationale": "one short sentence on why this frame fills a gap in the user's current set"
    }
  ]
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const raw = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  // Be forgiving of stray ```json fences just in case.
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: { frames?: unknown };
  try {
    parsed = JSON.parse(stripped) as { frames?: unknown };
  } catch {
    throw new Error("the cat returned malformed JSON; try again");
  }

  const rawFrames = Array.isArray(parsed.frames) ? parsed.frames : [];
  const out: SuggestedFrame[] = [];
  for (const r of rawFrames) {
    if (!r || typeof r !== "object") continue;
    const obj = r as Record<string, unknown>;
    const name = typeof obj.name === "string" ? obj.name.trim() : "";
    const kind = obj.kind === "scale" ? "scale" : obj.kind === "question" ? "question" : null;
    if (!name || !kind) continue;
    const description =
      typeof obj.description === "string" && obj.description.trim()
        ? obj.description.trim()
        : null;
    const rationale =
      typeof obj.rationale === "string" ? obj.rationale.trim() : "";
    if (kind === "question") {
      const prompt = typeof obj.prompt === "string" ? obj.prompt.trim() : "";
      if (!prompt) continue;
      out.push({
        name,
        description,
        kind,
        prompt,
        lowLabel: null,
        highLabel: null,
        scale: null,
        rationale,
      });
    } else {
      const lowLabel =
        typeof obj.lowLabel === "string" ? obj.lowLabel.trim() : "";
      const highLabel =
        typeof obj.highLabel === "string" ? obj.highLabel.trim() : "";
      const scaleNum = Math.min(
        Math.max(
          Number.isFinite(Number(obj.scale)) ? Math.trunc(Number(obj.scale)) : 5,
          2,
        ),
        10,
      );
      if (!lowLabel || !highLabel) continue;
      out.push({
        name,
        description,
        kind,
        prompt: null,
        lowLabel,
        highLabel,
        scale: scaleNum,
        rationale,
      });
    }
  }

  return out.slice(0, 3);
}

export async function deleteFrame(id: number) {
  await db.delete(framesTable).where(eq(framesTable.id, id));
  revalidatePath("/frames");
  revalidatePath("/");
  revalidatePath(`/companies/[slug]`, "page");
}


export async function setFrameScore({
  companyId,
  frameId,
  score,
  rationale,
}: {
  companyId: number;
  frameId: number;
  score: number;
  rationale?: string;
}) {
  const scoreStr = score.toFixed(1);
  await db
    .insert(frameScores)
    .values({ companyId, frameId, score: scoreStr, rationale })
    .onConflictDoUpdate({
      target: [frameScores.companyId, frameScores.frameId],
      set: { score: scoreStr, rationale, updatedAt: new Date() },
    });
  revalidatePath("/");
  revalidatePath(`/companies/[slug]`, "page");
}

export async function saveCompanyNotes({
  companyId,
  notes,
}: {
  companyId: number;
  notes: string;
}) {
  // v0.6: per-company notes live in their own table now (replaces the
  // v0.4 free-text intent surface). Trimmed-empty body deletes the row
  // so /about's notes index stays clean.
  const body = notes.trim();
  if (!body) {
    await db.delete(companyNotes).where(eq(companyNotes.companyId, companyId));
  } else {
    await db
      .insert(companyNotes)
      .values({ companyId, body, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: companyNotes.companyId,
        set: { body, updatedAt: new Date() },
      });
  }
  revalidatePath(`/companies/[slug]`, "page");
  revalidatePath("/about");
}

export async function setCompanyStatus({
  companyId,
  status,
}: {
  companyId: number;
  status: string;
}) {
  await db
    .update(companies)
    .set({ status, updatedAt: new Date() })
    .where(eq(companies.id, companyId));
  revalidatePath("/");
  revalidatePath(`/companies/[slug]`, "page");
}

/**
 * Generate (or refresh) a fit note for a company using Claude, grounded in
 * the user profile + company facts already in the DB.
 */
export async function generateFitNote(companyId: number) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) throw new Error("user profile not seeded");

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));
  if (!company) throw new Error("company not found");

  const allFrames = await db
    .select()
    .from(framesTable)
    .orderBy(framesTable.sortIndex);
  const myScores = await db
    .select()
    .from(frameScores)
    .where(eq(frameScores.companyId, companyId));
  const scoresByFrame = new Map(myScores.map((s) => [s.frameId, s]));

  const framesContext = allFrames
    .map((f) => {
      const s = scoresByFrame.get(f.id);
      return `- ${f.name}: ${s ? `${s.score}/${f.scale}` : "unscored"} (low=${f.lowLabel || "?"}, high=${f.highLabel || "?"})${s?.rationale ? ` — ${s.rationale}` : ""}`;
    })
    .join("\n");

  const system = `You are lobbycat — a thoughtful, slightly catty research familiar that helps the user decide between policy roles. You write short, honest, specific notes about whether a company could be interesting for the user, grounded in the user's actual background and the company's actual public position. Never invent facts. If a company is a stretch on one of the user's concerns, say so plainly. Tone: warm, specific, never flattering. Voice: editorial, not corporate.`;

  const userPrompt = `# User profile

**${profile.displayName}** — ${profile.headline}

${profile.bio}

The user's stated concerns when evaluating roles:
${(profile.concerns as string[]).map((c) => `- ${c}`).join("\n")}

The user's custom evaluation frames (with my current scores for this company, if any):
${framesContext}

# Company: ${company.name}

HQ: ${company.hq || "unknown"}
Focus areas: ${(company.focusAreas as string[]).join(", ") || "none listed"}

${company.description}

# Your task

Write a "lobbycat says ❤" note answering: **why this company could be interesting for ${profile.displayName.split(" ")[0]}**, grounded in BOTH the user's actual background AND the company's specific situation.

Format — STRICT:
- 3 to 5 short bullets, one per line, each line starting with "- " (dash + space).
- Each bullet is one tight sentence (max ~22 words). Specific, not generic. Refer to the user by first name at most once across all bullets.
- Then, if there's an honest weakness worth naming (e.g. UK-pigeonhole risk, established team vs build-from-scratch mismatch), add ONE final line starting with "caveat: " — one short sentence. Skip the caveat line if there's nothing honest to flag.
- No headings. No preamble. No closing line. No emoji. No markdown bold. Just the bullets (and optional caveat).`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const body = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  await db.insert(fitNotes).values({
    companyId,
    profileVersion: profile.updatedAt,
    headline: "Could be interesting because…",
    body,
    citations: [],
    honesty: null,
  });

  revalidatePath(`/companies/[slug]`, "page");
}

/**
 * Append a user message to a company's fit-note thread, generate a grounded
 * cat reply, and persist both. The cat is given the user profile, the
 * company facts, the latest fit-note body (if any), and the full prior
 * conversation so its replies stay specific and on-topic.
 */
export async function sendFitNoteMessage({
  companyId,
  content,
}: {
  companyId: number;
  content: string;
}) {
  const trimmed = content.trim();
  if (!trimmed) return;
  if (trimmed.length > 2000) throw new Error("message too long");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) throw new Error("user profile not seeded");

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));
  if (!company) throw new Error("company not found");

  // Persist the user message first so the UI reflects it even if the
  // model call fails downstream.
  await db
    .insert(fitNoteMessages)
    .values({ companyId, role: "user", content: trimmed });

  const [latestNote] = await db
    .select()
    .from(fitNotes)
    .where(eq(fitNotes.companyId, companyId))
    .orderBy(desc(fitNotes.createdAt))
    .limit(1);

  const thread = await db
    .select()
    .from(fitNoteMessages)
    .where(eq(fitNoteMessages.companyId, companyId))
    .orderBy(asc(fitNoteMessages.createdAt));

  const system = `You are lobbycat — a thoughtful, slightly catty research familiar helping ${profile.displayName.split(" ")[0]} think through whether a specific policy-AI company is a fit. You answer follow-up questions about ONE company at a time, grounded in the user's profile and the company's public facts. Be specific, never flattering, never generic. If you don't know something, say so plainly. Keep replies short — 1 to 4 sentences, conversational, no headings, no bullet lists unless the user explicitly asks for a list.`;

  const groundingBlocks: string[] = [
    `# User profile\n\n**${profile.displayName}** — ${profile.headline}\n\n${profile.bio}\n\nStated concerns:\n${(profile.concerns as string[]).map((c) => `- ${c}`).join("\n")}`,
    `# Company: ${company.name}\n\nHQ: ${company.hq || "unknown"}\nFocus areas: ${(company.focusAreas as string[]).join(", ") || "none listed"}\n\n${company.description}`,
  ];
  if (latestNote?.body) {
    groundingBlocks.push(`# Current fit-note for this company\n\n${latestNote.body}`);
  }
  const grounding = groundingBlocks.join("\n\n---\n\n");

  // Anthropic Messages API requires alternating user/assistant. Map
  // our 'cat' role to 'assistant'. Prepend the grounding to the FIRST
  // user message in the thread so the model sees it as context without
  // breaking the alternation.
  const apiMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  let groundingInjected = false;
  for (const m of thread) {
    const role = m.role === "cat" ? "assistant" : "user";
    let text = m.content;
    if (role === "user" && !groundingInjected) {
      text = `${grounding}\n\n---\n\n${text}`;
      groundingInjected = true;
    }
    apiMessages.push({ role, content: text });
  }
  // Safety net: if the thread somehow starts with an assistant message
  // (shouldn't happen, but), prepend a grounding-only user turn.
  if (!groundingInjected) {
    apiMessages.unshift({ role: "user", content: grounding });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 400,
      system,
      messages: apiMessages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const reply = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  if (reply) {
    await db
      .insert(fitNoteMessages)
      .values({ companyId, role: "cat", content: reply });
  }

  revalidatePath(`/companies/[slug]`, "page");
}

/* ------------------------------------------------------------------ */
/* User profile editor                                                */
/* ------------------------------------------------------------------ */

/**
 * v0.6 step 6 — persist the user's per-frame L/M/H weights.
 *
 * The home table re-aggregates client-side via `useLiveAggregates`, but the
 * canonical weights live on `user_profile.frameWeights` so a fresh session
 * picks them up. Pass a partial map; missing keys keep their current value.
 */
export async function setFrameWeights(
  patch: Record<string, "low" | "medium" | "high">,
) {
  const [existing] = await db.select().from(userProfile).limit(1);
  if (!existing) throw new Error("No profile to update.");

  const current = (existing.frameWeights ?? {}) as Record<string, string>;
  const next: Record<string, "low" | "medium" | "high"> = { ...current } as Record<
    string,
    "low" | "medium" | "high"
  >;
  for (const [k, v] of Object.entries(patch)) {
    if (v !== "low" && v !== "medium" && v !== "high") continue;
    const key = k.trim();
    if (!key) continue;
    next[key] = v;
  }

  await db
    .update(userProfile)
    .set({ frameWeights: next, updatedAt: new Date() })
    .where(eq(userProfile.id, existing.id));

  revalidatePath("/");
  revalidatePath("/frames");
}

export async function updateProfile(patch: {
  displayName?: string;
  headline?: string | null;
  bio?: string | null;
  concerns?: string[];
  weights?: Record<string, string>;
  sources?: string[];
}) {
  const [existing] = await db.select().from(userProfile).limit(1);
  if (!existing) throw new Error("No profile to update.");

  const next: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.displayName !== undefined) {
    const v = patch.displayName.trim();
    if (!v) throw new Error("Display name cannot be empty.");
    next.displayName = v;
  }
  if (patch.headline !== undefined) {
    next.headline = patch.headline?.trim() || null;
  }
  if (patch.bio !== undefined) {
    next.bio = patch.bio?.trim() || null;
  }
  if (patch.concerns !== undefined) {
    next.concerns = patch.concerns.map((c) => c.trim()).filter((c) => c.length > 0);
  }
  if (patch.weights !== undefined) {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(patch.weights)) {
      const key = k.trim();
      const val = (v ?? "").toString().trim();
      if (!key || !val) continue;
      cleaned[key] = val;
    }
    next.weights = cleaned;
  }
  if (patch.sources !== undefined) {
    next.sources = patch.sources.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  await db.update(userProfile).set(next).where(eq(userProfile.id, existing.id));

  revalidatePath("/about");
  // Profile feeds fit-note grounding; company pages reflect it next nav.
  revalidatePath(`/companies/[slug]`, "page");
}
