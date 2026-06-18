"use server";

import { db } from "@/db";
import {
  companies,
  frameScores,
  fitNotes,
  fitNoteMessages,
  userProfile,
  frames as framesTable,
} from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  await db
    .insert(frameScores)
    .values({ companyId, frameId, score, rationale })
    .onConflictDoUpdate({
      target: [frameScores.companyId, frameScores.frameId],
      set: { score, rationale, updatedAt: new Date() },
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
  await db
    .update(companies)
    .set({ notes, updatedAt: new Date() })
    .where(eq(companies.id, companyId));
  revalidatePath(`/companies/[slug]`, "page");
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
      model: "claude-sonnet-4-5",
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
