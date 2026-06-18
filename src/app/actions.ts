"use server";

import { db } from "@/db";
import {
  companies,
  frameScores,
  fitNotes,
  userProfile,
  frames as framesTable,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
