/**
 * v0.8 — `runClarifySession` server-action core.
 *
 * Implements §6/§3.3 path 1 (inline) of docs/REFACTOR-v0.8.md: the Next.js
 * server invokes Anthropic with the `clarify` skill body loaded into the
 * system prompt, full Aadi context grounding the conversation, and the
 * current session's prior messages on the turn axis.
 *
 * The exported pair:
 *
 *   - `startClarifySession(opts)`  — create a row, persist the cat's
 *     opening line, return the session id and first cat message.
 *   - `sendClarifyMessage(args)`   — append a user turn, generate the
 *     cat's next turn (parsing a proposal block + move tag if present),
 *     persist both, return the cat's reply.
 *
 * The action wrappers in `src/app/actions.ts` are thin "use server" shells
 * around these — same split as `generateFitNote` / `sendFitNoteMessage`.
 *
 * Streaming is intentionally NOT wired here yet; see ASSUMPTIONS-v0.8.md
 * A4.1. The fitNote thread already runs non-streaming and the Step 5 chat
 * panel can adopt SSE later without breaking this contract.
 */

import { promises as fs } from "fs";
import path from "path";

import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  clarifyMessages,
  clarifySessions,
  companies,
  companyNotes,
  frames as framesTable,
  frameScores,
  userProfile,
  type ClarifyMessage,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export type ClarifyTrigger =
  | "manual"
  | "wizard"
  | "welcome-back"
  | "company-detail";

export type ClarifyProposalKind =
  | "frame-weight"
  | "new-frame"
  | "company-note";

export type ClarifyProposal = {
  kind: ClarifyProposalKind;
  data: Record<string, unknown>;
  /** One-line human summary the UI shows on the proposal card. */
  summary: string;
};

export type StartClarifyOptions = {
  trigger: ClarifyTrigger;
  /** Company id when invoked from a company-detail page. */
  seedCompanyId?: number | null;
  /** Frame id when the cat is opening on a specific frame (rare). */
  seedFrameId?: number | null;
};

export type StartClarifyResult = {
  sessionId: number;
  /** The cat's opening turn (already persisted). */
  opening: { body: string; moveType: string | null };
};

export type SendClarifyMessageArgs = {
  sessionId: number;
  /** The user's typed message. */
  content: string;
};

export type SendClarifyMessageResult = {
  /** The cat's reply (already persisted). */
  reply: { body: string; moveType: string | null };
  /** If this turn ended the session, the parsed proposal (already stored). */
  proposal: ClarifyProposal | null;
  /** True when the cat signalled end-of-session on this turn. */
  ended: boolean;
};

/* ------------------------------------------------------------------ */
/* Skill body loading                                                  */
/* ------------------------------------------------------------------ */

/**
 * The `clarify` skill body. Loaded once per process from
 * `skills/clarify/SKILL.md` (the canonical in-repo location authored by
 * Step 1 / PR #32). We resolve it relative to `process.cwd()` because
 * Next.js server actions run with cwd at the project root in both `next
 * dev` and the Vercel runtime.
 *
 * If the file is missing (e.g. running this step before #32 lands on the
 * same branch), we fall back to a minimal inline body so this code is
 * shippable independently. ASSUMPTIONS-v0.8.md A4.2.
 */
let cachedSkillBody: string | null = null;

const SKILL_FALLBACK = `# clarify (fallback)

You are lobbycat. Run a clarify session: open with one observation,
ask at most one question per turn, listen, end with a single proposal
when an insight lands. Refuse to flatter, list-make, or generate
proposals when nothing landed. Output one paragraph + one question
per turn. End the session by emitting a single PROPOSAL block.
`;

async function loadSkillBody(): Promise<string> {
  if (cachedSkillBody !== null) return cachedSkillBody;
  try {
    const p = path.join(process.cwd(), "skills", "clarify", "SKILL.md");
    const buf = await fs.readFile(p, "utf8");
    cachedSkillBody = buf;
    return buf;
  } catch {
    cachedSkillBody = SKILL_FALLBACK;
    return SKILL_FALLBACK;
  }
}

/* ------------------------------------------------------------------ */
/* Context loading — §5.2 of REFACTOR-v0.8.md                          */
/* ------------------------------------------------------------------ */

type FeedEvent = {
  date: string;
  company_slug: string;
  event_type: string;
  summary: string;
  source_url?: string;
};

type FeedFile = { lastUpdated?: string; events?: FeedEvent[] };

/** Read the most recent N items from research/feed.json mentioning slug. */
async function readGlyphieFeedFor(
  companySlug: string | null,
  limit = 5,
): Promise<FeedEvent[]> {
  if (!companySlug) return [];
  try {
    const p = path.join(process.cwd(), "research", "feed.json");
    const raw = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(raw) as FeedFile;
    const events = parsed.events ?? [];
    return events
      .filter((e) => e.company_slug === companySlug)
      .slice(0, limit);
  } catch {
    return [];
  }
}

type LobbycatQuotesShape = {
  clarifying?: string[];
  observation?: string[];
};

async function readClarifyingQuotes(): Promise<string[]> {
  try {
    const p = path.join(process.cwd(), "src", "db", "lobbycat-quotes.json");
    const raw = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(raw) as LobbycatQuotesShape;
    if (parsed.clarifying && parsed.clarifying.length > 0) {
      return parsed.clarifying;
    }
    // Pre-step-10 fallback: any voice grounding beats none.
    return parsed.observation ?? [];
  } catch {
    return [];
  }
}

/** Recent message tail across ALL prior sessions — §5.2 says 20. */
async function readPriorSessionTail(
  excludeSessionId: number | null,
  limit = 20,
): Promise<Array<{ role: string; body: string; createdAt: Date }>> {
  const rows = await db
    .select({
      role: clarifyMessages.role,
      body: clarifyMessages.body,
      createdAt: clarifyMessages.createdAt,
      sessionId: clarifyMessages.sessionId,
    })
    .from(clarifyMessages)
    .orderBy(desc(clarifyMessages.createdAt))
    .limit(limit + 50); // generous overshoot to allow exclude-filter
  const filtered = rows
    .filter((r) => r.sessionId !== excludeSessionId)
    .slice(0, limit);
  return filtered.reverse(); // oldest-first
}

type GroundingContext = {
  profile: typeof userProfile.$inferSelect | null;
  seedCompany:
    | (typeof companies.$inferSelect & {
        /** frameId → score (numeric, may be fractional — see frame_scores). */
        scoresByFrame: Map<number, string>;
        notes: string | null;
      })
    | null;
  seedFrame: typeof framesTable.$inferSelect | null;
  allFrames: Array<typeof framesTable.$inferSelect>;
  priorTail: Array<{ role: string; body: string; createdAt: Date }>;
  feed: FeedEvent[];
  clarifyingQuotes: string[];
};

async function loadGrounding(args: {
  seedCompanyId: number | null;
  seedFrameId: number | null;
  excludeSessionId: number | null;
}): Promise<GroundingContext> {
  const [profileRow] = await db.select().from(userProfile).limit(1);
  const allFrames = await db
    .select()
    .from(framesTable)
    .orderBy(framesTable.sortIndex);

  let seedCompany: GroundingContext["seedCompany"] = null;
  if (args.seedCompanyId != null) {
    const [c] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, args.seedCompanyId));
    if (c) {
      const scoreRows = await db
        .select()
        .from(frameScores)
        .where(eq(frameScores.companyId, c.id));
      const [noteRow] = await db
        .select()
        .from(companyNotes)
        .where(eq(companyNotes.companyId, c.id))
        .limit(1);
      seedCompany = {
        ...c,
        scoresByFrame: new Map(scoreRows.map((s) => [s.frameId, s.score])),
        notes: noteRow?.body ?? null,
      };
    }
  }

  let seedFrame: typeof framesTable.$inferSelect | null = null;
  if (args.seedFrameId != null) {
    const [f] = await db
      .select()
      .from(framesTable)
      .where(eq(framesTable.id, args.seedFrameId));
    seedFrame = f ?? null;
  }

  const [priorTail, feed, clarifyingQuotes] = await Promise.all([
    readPriorSessionTail(args.excludeSessionId, 20),
    readGlyphieFeedFor(seedCompany?.slug ?? null, 5),
    readClarifyingQuotes(),
  ]);

  return {
    profile: profileRow ?? null,
    seedCompany,
    seedFrame,
    allFrames,
    priorTail,
    feed,
    clarifyingQuotes,
  };
}

/* ------------------------------------------------------------------ */
/* Prompt assembly                                                     */
/* ------------------------------------------------------------------ */

function renderGroundingBlock(ctx: GroundingContext): string {
  const blocks: string[] = [];

  if (ctx.profile) {
    const concerns = (ctx.profile.concerns as string[]) ?? [];
    blocks.push(
      `# Who you are talking to\n\n**${ctx.profile.displayName}** — ${ctx.profile.headline ?? ""}\n\n${ctx.profile.bio ?? ""}\n\nStated concerns:\n${concerns.map((c) => `- ${c}`).join("\n") || "- (none stated)"}`,
    );
  }

  const fw = (ctx.profile?.frameWeights ?? {}) as Record<string, string>;
  if (ctx.allFrames.length > 0) {
    const lines = ctx.allFrames.map((f) => {
      const weight = fw[String(f.id)] ?? "medium";
      const seedScore = ctx.seedCompany?.scoresByFrame.get(f.id);
      const seedBit =
        seedScore != null && ctx.seedCompany
          ? ` — ${ctx.seedCompany.name} scored ${seedScore}/${f.scale}`
          : "";
      return `- **${f.name}** (weight: ${weight})${seedBit}${f.description ? ` — ${f.description}` : ""}`;
    });
    blocks.push(`# Their frames + current weights\n\n${lines.join("\n")}`);
  }

  if (ctx.seedCompany) {
    const focus = (ctx.seedCompany.focusAreas as string[]).join(", ");
    blocks.push(
      `# Seed company: ${ctx.seedCompany.name}\n\nHQ: ${ctx.seedCompany.hq ?? "unknown"}\nFocus: ${focus || "none listed"}\n\n${ctx.seedCompany.description ?? ""}${ctx.seedCompany.notes ? `\n\nTheir note on this company:\n${ctx.seedCompany.notes}` : ""}`,
    );
  }

  if (ctx.seedFrame) {
    blocks.push(
      `# Seed frame: ${ctx.seedFrame.name}\n\n${ctx.seedFrame.description ?? ""}`,
    );
  }

  if (ctx.feed.length > 0 && ctx.seedCompany) {
    const feedLines = ctx.feed
      .map((e) => `- [${e.date}] ${e.event_type}: ${e.summary}`)
      .join("\n");
    blocks.push(
      `# Recent Glyphie items mentioning ${ctx.seedCompany.name}\n\n${feedLines}`,
    );
  }

  if (ctx.priorTail.length > 0) {
    const tailLines = ctx.priorTail
      .map((m) => `${m.role === "cat" ? "cat" : "user"}: ${m.body}`)
      .join("\n");
    blocks.push(
      `# Recent prior clarify-session messages (oldest first, for continuity)\n\n${tailLines}`,
    );
  }

  if (ctx.clarifyingQuotes.length > 0) {
    blocks.push(
      `# Voice grounding (sample clarifying-state quotes — match this register)\n\n${ctx.clarifyingQuotes
        .slice(0, 8)
        .map((q) => `- ${q}`)
        .join("\n")}`,
    );
  }

  return blocks.join("\n\n---\n\n");
}

async function buildSystemPrompt(ctx: GroundingContext): Promise<string> {
  const skillBody = await loadSkillBody();
  const grounding = renderGroundingBlock(ctx);
  return `${skillBody}\n\n---\n\n${grounding}`;
}

/* ------------------------------------------------------------------ */
/* Proposal + move-tag parsing                                         */
/* ------------------------------------------------------------------ */

/**
 * The skill (Step 1) emits an optional PROPOSAL block on its final turn.
 * Contract per ASSUMPTIONS-v0.8.md A4.4 — a fenced block on its own:
 *
 *   \`\`\`proposal
 *   { "kind": "frame-weight" | "new-frame" | "company-note",
 *     "summary": "one-line human summary",
 *     "data": { ... } }
 *   \`\`\`
 *
 * And an optional move tag on the first line:
 *
 *   <!-- move: hidden-frame -->
 *
 * Both are stripped before the body is shown to the user.
 */

const PROPOSAL_FENCE_RE = /```proposal\s*\n([\s\S]*?)\n```/i;
const MOVE_TAG_RE = /<!--\s*move:\s*([a-z0-9-]+)\s*-->/i;

function extractProposal(raw: string): {
  body: string;
  moveType: string | null;
  proposal: ClarifyProposal | null;
  ended: boolean;
} {
  let body = raw;
  let moveType: string | null = null;
  let proposal: ClarifyProposal | null = null;

  const moveMatch = body.match(MOVE_TAG_RE);
  if (moveMatch) {
    moveType = moveMatch[1].toLowerCase();
    body = body.replace(MOVE_TAG_RE, "").trim();
  }

  const propMatch = body.match(PROPOSAL_FENCE_RE);
  if (propMatch) {
    try {
      const parsed = JSON.parse(propMatch[1]) as Partial<ClarifyProposal>;
      if (
        parsed.kind === "frame-weight" ||
        parsed.kind === "new-frame" ||
        parsed.kind === "company-note"
      ) {
        proposal = {
          kind: parsed.kind,
          summary: String(parsed.summary ?? "").trim() || "(no summary)",
          data: (parsed.data ?? {}) as Record<string, unknown>,
        };
      }
    } catch {
      // Malformed JSON — treat the block as prose, log nothing.
    }
    body = body.replace(PROPOSAL_FENCE_RE, "").trim();
  }

  return { body, moveType, proposal, ended: proposal !== null };
}

/* ------------------------------------------------------------------ */
/* Anthropic call                                                      */
/* ------------------------------------------------------------------ */

type ChatTurn = { role: "user" | "assistant"; content: string };

async function callClarifyModel(args: {
  system: string;
  messages: ChatTurn[];
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 700,
      system: args.system,
      messages: args.messages,
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();
}

/* ------------------------------------------------------------------ */
/* startClarifySession                                                 */
/* ------------------------------------------------------------------ */

export async function startClarifySession(
  opts: StartClarifyOptions,
): Promise<StartClarifyResult> {
  // 1. Insert the session row first — the opening message references it
  //    via session_id, and we want it persisted even if the model call
  //    fails (matches the fit-note pattern of "persist first, generate
  //    second" so the UI never silently drops user-visible state).
  const [row] = await db
    .insert(clarifySessions)
    .values({
      trigger: opts.trigger,
      seedCompany: opts.seedCompanyId ?? null,
      seedFrame: opts.seedFrameId ?? null,
    })
    .returning({ id: clarifySessions.id });
  const sessionId = row.id;

  // 2. Generate the cat's opening turn.
  const ctx = await loadGrounding({
    seedCompanyId: opts.seedCompanyId ?? null,
    seedFrameId: opts.seedFrameId ?? null,
    excludeSessionId: sessionId,
  });
  const system = await buildSystemPrompt(ctx);

  const opener = openerPrompt(opts.trigger, ctx);
  const raw = await callClarifyModel({
    system,
    messages: [{ role: "user", content: opener }],
  });
  const parsed = extractProposal(raw);

  // 3. Persist the opener + denormalised seed note on the session row.
  await db
    .insert(clarifyMessages)
    .values({
      sessionId,
      role: "cat",
      body: parsed.body,
      moveType: parsed.moveType,
    });
  await db
    .update(clarifySessions)
    .set({ seedNote: parsed.body })
    .where(eq(clarifySessions.id, sessionId));

  return {
    sessionId,
    opening: { body: parsed.body, moveType: parsed.moveType },
  };
}

function openerPrompt(
  trigger: ClarifyTrigger,
  ctx: GroundingContext,
): string {
  const name = ctx.profile?.displayName.split(" ")[0] ?? "the user";
  const seed = ctx.seedCompany
    ? ` They just opened ${ctx.seedCompany.name}.`
    : "";
  switch (trigger) {
    case "wizard":
      return `Open a clarify session. ${name} just finished the onboarding wizard. Read their answers, then run the 3-question seeded opener per the skill. Start with one observation, then your first question.`;
    case "welcome-back":
      return `Open a clarify session. ${name} is returning to the dashboard and the welcome-back card suggested a clarify is worth doing.${seed} Begin with one specific observation (use Glyphie items or score drift if there's signal), then one question.`;
    case "company-detail":
      return `Open a clarify session scoped to one company.${seed} Begin with one specific observation about this company in relation to ${name}'s frames or stated concerns, then one question.`;
    case "manual":
    default:
      return `Open a clarify session. ${name} clicked the "talk to lobbycat" button with no specific seed.${seed} Begin with one observation drawn from their recent scoring patterns or stated concerns, then one question.`;
  }
}

/* ------------------------------------------------------------------ */
/* sendClarifyMessage                                                  */
/* ------------------------------------------------------------------ */

export async function sendClarifyMessage(
  args: SendClarifyMessageArgs,
): Promise<SendClarifyMessageResult> {
  const trimmed = args.content.trim();
  if (!trimmed) throw new Error("empty message");
  if (trimmed.length > 4000) throw new Error("message too long");

  // 1. Make sure the session is still open.
  const [session] = await db
    .select()
    .from(clarifySessions)
    .where(eq(clarifySessions.id, args.sessionId));
  if (!session) throw new Error("clarify session not found");
  if (session.endedAt) throw new Error("clarify session already ended");

  // 2. Persist the user turn first — same "never silently drop" rule.
  await db.insert(clarifyMessages).values({
    sessionId: args.sessionId,
    role: "user",
    body: trimmed,
  });

  // 3. Load grounding (excludes this session from the prior-tail) +
  //    the full thread for the turn axis.
  const ctx = await loadGrounding({
    seedCompanyId: session.seedCompany ?? null,
    seedFrameId: session.seedFrame ?? null,
    excludeSessionId: args.sessionId,
  });
  const system = await buildSystemPrompt(ctx);

  const thread: ClarifyMessage[] = await db
    .select()
    .from(clarifyMessages)
    .where(eq(clarifyMessages.sessionId, args.sessionId))
    .orderBy(asc(clarifyMessages.createdAt));

  const apiMessages: ChatTurn[] = thread.map((m) => ({
    role: m.role === "cat" ? "assistant" : "user",
    content: m.body,
  }));
  // Anthropic requires alternation starting with user — opener may
  // have been the cat's, so prepend a no-op user grounding turn if so.
  if (apiMessages[0]?.role !== "user") {
    apiMessages.unshift({
      role: "user",
      content: "(session-open)",
    });
  }

  const raw = await callClarifyModel({ system, messages: apiMessages });
  const parsed = extractProposal(raw);

  // 4. Persist the cat turn.
  await db.insert(clarifyMessages).values({
    sessionId: args.sessionId,
    role: "cat",
    body: parsed.body,
    moveType: parsed.moveType,
  });

  // 5. If the cat shipped a proposal, mark the session ended + store it.
  if (parsed.proposal) {
    await db
      .update(clarifySessions)
      .set({
        endedAt: sql`now()`,
        endState: "insight-landed",
        proposalKind: parsed.proposal.kind,
        proposalData: parsed.proposal.data,
        proposalAccepted: null, // user accepts/rejects via the UI later
      })
      .where(eq(clarifySessions.id, args.sessionId));
  }

  return {
    reply: { body: parsed.body, moveType: parsed.moveType },
    proposal: parsed.proposal,
    ended: parsed.proposal !== null,
  };
}

/* ------------------------------------------------------------------ */
/* User-closed end signal — fired by the chat panel when Aadi closes   */
/* it mid-flow without a proposal landing. §4.3 of REFACTOR-v0.8.md.   */
/* ------------------------------------------------------------------ */

export async function endClarifySessionAsClosed(
  sessionId: number,
): Promise<void> {
  await db
    .update(clarifySessions)
    .set({ endedAt: sql`now()`, endState: "user-closed" })
    .where(eq(clarifySessions.id, sessionId));
}
