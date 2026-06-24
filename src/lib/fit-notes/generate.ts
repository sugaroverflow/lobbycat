/**
 * v0.7.2 Step 6 — Extracted fit-note generation primitive.
 *
 * The same logic that powers `generateFitNote` in `src/app/actions.ts` —
 * pulled into a server-action-free helper so the one-off backfill script
 * (`scripts/backfill-fit-notes.ts`) and the Glyphie-nightly cron route
 * (`/api/cron/fit-notes`) can call it without dragging the whole
 * `"use server"` module graph behind them.
 *
 * Behaviour intentionally mirrors `generateFitNote` so card UX is identical
 * whether the note was nightly-generated or manually re-rolled.
 */
import { db } from "@/db";
import { companies, fitNotes, frameScores, frames as framesTable, userProfile } from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";

export type FitNoteGenSource = "manual" | "backfill" | "nightly";

export type GenerateResult =
  | { status: "skipped-recent"; companyId: number; lastCreatedAt: Date }
  | { status: "skipped-no-evidence"; companyId: number }
  | { status: "written"; companyId: number; bytes: number }
  | { status: "failed"; companyId: number; error: string };

const SYSTEM_PROMPT = `You are lobbycat — a thoughtful, slightly catty research familiar that helps the user decide between policy roles. You write short, honest, specific notes about whether a company could be interesting for the user, grounded in the user's actual background and the company's actual public position. Never invent facts. If a company is a stretch on one of the user's concerns, say so plainly. Tone: warm, specific, never flattering. Voice: editorial, not corporate.`;

function buildUserPrompt(args: {
  profileName: string;
  profileHeadline: string;
  profileBio: string;
  concerns: string[];
  framesContext: string;
  companyName: string;
  companyHq: string | null;
  companyDescription: string;
  focusAreas: string[];
}): string {
  return `# User profile

**${args.profileName}** — ${args.profileHeadline}

${args.profileBio}

The user's stated concerns when evaluating roles:
${args.concerns.map((c) => `- ${c}`).join("\n")}

The user's custom evaluation frames (with my current scores for this company, if any):
${args.framesContext}

# Company: ${args.companyName}

HQ: ${args.companyHq || "unknown"}
Focus areas: ${args.focusAreas.join(", ") || "none listed"}

${args.companyDescription}

# Your task

Write a "lobbycat says ❤" note answering: **why this company could be interesting for ${args.profileName.split(" ")[0]}**, grounded in BOTH the user's actual background AND the company's specific situation.

Format — STRICT:
- 3 to 5 short bullets, one per line, each line starting with "- " (dash + space).
- Each bullet is one tight sentence (max ~22 words). Specific, not generic. Refer to the user by first name at most once across all bullets.
- Then, if there's an honest weakness worth naming (e.g. UK-pigeonhole risk, established team vs build-from-scratch mismatch), add ONE final line starting with "caveat: " — one short sentence. Skip the caveat line if there's nothing honest to flag.
- No headings. No preamble. No closing line. No emoji. No markdown bold. Just the bullets (and optional caveat).`;
}

/**
 * Generate a fit-note for one company. Returns a structured status so
 * callers (the backfill script, the cron route) can report per-company
 * outcomes without throwing on individual skips.
 *
 * Idempotency: when `skipIfNewerThanMs` is set, the most recent fit note
 * for the company is consulted; if it's newer than that threshold, the
 * call short-circuits with `skipped-recent`.
 *
 * Errors: model/API failures surface as `failed`; the caller decides
 * whether to abort the whole run or continue. Schema-shape failures
 * (no profile, no company) still throw — those are programmer errors.
 */
export async function generateFitNoteForCompany(
  companyId: number,
  opts: { skipIfNewerThanMs?: number; source?: FitNoteGenSource } = {},
): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) throw new Error("user profile not seeded");

  const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
  if (!company) throw new Error(`company not found: ${companyId}`);

  if (opts.skipIfNewerThanMs !== undefined) {
    const [latest] = await db
      .select({ createdAt: fitNotes.createdAt })
      .from(fitNotes)
      .where(eq(fitNotes.companyId, companyId))
      .orderBy(desc(fitNotes.createdAt))
      .limit(1);
    if (latest && Date.now() - latest.createdAt.getTime() < opts.skipIfNewerThanMs) {
      return { status: "skipped-recent", companyId, lastCreatedAt: latest.createdAt };
    }
  }

  const allFrames = await db.select().from(framesTable).orderBy(framesTable.sortIndex);
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

  const userPrompt = buildUserPrompt({
    profileName: profile.displayName,
    profileHeadline: profile.headline ?? "",
    profileBio: profile.bio ?? "",
    concerns: (profile.concerns as string[]) ?? [],
    framesContext,
    companyName: company.name,
    companyHq: company.hq,
    companyDescription: company.description ?? "",
    focusAreas: (company.focusAreas as string[]) ?? [],
  });

  let body: string;
  try {
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
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        status: "failed",
        companyId,
        error: `Anthropic ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
    body = data.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();
  } catch (err) {
    return {
      status: "failed",
      companyId,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (!body || body.length < 20) {
    return { status: "failed", companyId, error: "empty body returned" };
  }

  await db.insert(fitNotes).values({
    companyId,
    profileVersion: profile.updatedAt,
    headline: "Could be interesting because…",
    body,
    citations: [],
    honesty: null,
  });

  return { status: "written", companyId, bytes: body.length };
}

/**
 * Find companies eligible for fit-note generation by source.
 *   - "all": every company in the table (used by the backfill script)
 *   - "missing-or-changed": companies that have no fit-note yet OR have
 *     had a `publications.created_at` row land in the last
 *     `changedSinceMs` window (used by the nightly cron).
 */
export async function selectCompaniesForGeneration(args:
  | { mode: "all" }
  | { mode: "missing-or-changed"; changedSinceMs: number }
): Promise<Array<{ id: number; slug: string; name: string }>> {
  if (args.mode === "all") {
    return db
      .select({ id: companies.id, slug: companies.slug, name: companies.name })
      .from(companies)
      .orderBy(companies.id);
  }

  const sinceIso = new Date(Date.now() - args.changedSinceMs).toISOString();

  // Companies with no fit-note ever, OR a publication newer than `since`,
  // OR a frame_score newer than `since`. We let SQL do the union.
  const rows = await db.execute<{ id: number; slug: string; name: string }>(sql`
    SELECT c.id, c.slug, c.name
    FROM companies c
    WHERE
      NOT EXISTS (SELECT 1 FROM fit_notes fn WHERE fn.company_id = c.id)
      OR EXISTS (
        SELECT 1 FROM publications p
        WHERE p.company_id = c.id AND p.seen_at >= ${sinceIso}
      )
      OR EXISTS (
        SELECT 1 FROM frame_scores fs
        WHERE fs.company_id = c.id AND fs.scored_at >= ${sinceIso}
      )
    ORDER BY c.id
  `);
  return rows.rows as Array<{ id: number; slug: string; name: string }>;
}

export async function alreadyHasRecentFitNote(
  companyId: number,
  withinMs: number,
): Promise<boolean> {
  const [latest] = await db
    .select({ createdAt: fitNotes.createdAt })
    .from(fitNotes)
    .where(eq(fitNotes.companyId, companyId))
    .orderBy(desc(fitNotes.createdAt))
    .limit(1);
  return !!latest && Date.now() - latest.createdAt.getTime() < withinMs;
}

// Exposed for tests / call-sites that want to bulk-precheck many companies
// without hitting the DB once per company.
export async function fitNoteFreshnessMap(
  companyIds: number[],
): Promise<Map<number, Date>> {
  if (companyIds.length === 0) return new Map();
  const rows = await db
    .select({ companyId: fitNotes.companyId, createdAt: fitNotes.createdAt })
    .from(fitNotes)
    .where(inArray(fitNotes.companyId, companyIds))
    .orderBy(desc(fitNotes.createdAt));
  const m = new Map<number, Date>();
  for (const r of rows) {
    if (!m.has(r.companyId)) m.set(r.companyId, r.createdAt);
  }
  return m;
}
