/**
 * v0.7.2 Step 6 — Pre-generate fit notes for every company.
 *
 * Why: v0.6 left fit-notes as an on-demand action (Aadi clicks "regenerate"
 * per card). For ~70 cards that's a lot of work, and the empty-state reads
 * as a chore. Pre-generating them turns the empty-state into useful copy
 * the first time a card is opened.
 *
 * Behaviour:
 *  - Idempotent. Skips companies that already have a fit-note row pinned
 *    to the *current* profile version (the same uniqueness key the live
 *    action writes against). Re-runs are safe and cheap.
 *  - Generation logic mirrors `generateFitNote()` in `src/app/actions.ts`
 *    exactly — same Claude model, prompt, system message, and DB shape.
 *    Replicated rather than imported because `actions.ts` is "use server"
 *    (Next.js wraps it; not importable from a plain Node script).
 *  - Concurrency capped at BATCH (default 4) to be gentle on the
 *    Anthropic API. Per-company errors are logged but don't abort the run.
 *
 * Cost: ~$1 for 70 companies on claude-sonnet-4-5 @ 600 max_tokens out.
 *
 * Usage:
 *   tsx scripts/backfill-fit-notes.ts            # generate missing
 *   FORCE=1 tsx scripts/backfill-fit-notes.ts    # re-generate all (costs more)
 *   LIMIT=5 tsx scripts/backfill-fit-notes.ts    # cap for smoke-tests
 *   DRY_RUN=1 tsx scripts/backfill-fit-notes.ts  # list, don't call API
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { and, desc, eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  companies,
  fitNotes,
  frameScores,
  frames as framesTable,
  userProfile,
} from "../src/db/schema";

const BATCH = Number(process.env.BATCH ?? 4);
const FORCE = process.env.FORCE === "1";
const DRY_RUN = process.env.DRY_RUN === "1";
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;

const ANTHROPIC_MODEL = "claude-sonnet-4-5";

type CompanyRow = typeof companies.$inferSelect;
type FrameRow = typeof framesTable.$inferSelect;
type ScoreRow = typeof frameScores.$inferSelect;

async function generateOne(
  company: CompanyRow,
  profile: typeof userProfile.$inferSelect,
  allFrames: FrameRow[],
): Promise<{ ok: true; ms: number } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY not set" };

  const myScores: ScoreRow[] = await db
    .select()
    .from(frameScores)
    .where(eq(frameScores.companyId, company.id));
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

  const t0 = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `Anthropic ${res.status}: ${text.slice(0, 200)}` };
  }
  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const body = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  try {
    await db.insert(fitNotes).values({
      companyId: company.id,
      profileVersion: profile.updatedAt,
      headline: "Could be interesting because…",
      body,
      citations: [],
      honesty: null,
    });
  } catch (e) {
    // Likely the unique-index race: (company_id, profile_version) already
    // taken. That's a safe outcome — somebody else just inserted. Treat as
    // success; the row exists.
    const msg = e instanceof Error ? e.message : String(e);
    if (!/unique|duplicate/i.test(msg)) {
      return { ok: false, error: `db insert: ${msg}` };
    }
  }
  return { ok: true, ms: Date.now() - t0 };
}

async function main() {
  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) {
    console.error("✗ user profile not seeded — aborting");
    process.exit(1);
  }
  const allCompanies = await db.select().from(companies);
  const allFrames = await db
    .select()
    .from(framesTable)
    .orderBy(framesTable.sortIndex);

  // Pre-fetch the latest fit-note per company so we can decide skip/generate
  // without a per-row query inside the worker loop.
  const latestNotes = await db
    .select()
    .from(fitNotes)
    .orderBy(desc(fitNotes.createdAt));
  const latestByCompany = new Map<number, (typeof latestNotes)[number]>();
  for (const n of latestNotes) {
    if (!latestByCompany.has(n.companyId)) latestByCompany.set(n.companyId, n);
  }

  type Task = { company: CompanyRow; reason: "missing" | "stale" | "forced" };
  const tasks: Task[] = [];
  let upToDate = 0;
  for (const c of allCompanies) {
    const note = latestByCompany.get(c.id);
    if (FORCE) {
      tasks.push({ company: c, reason: "forced" });
      continue;
    }
    if (!note) {
      tasks.push({ company: c, reason: "missing" });
      continue;
    }
    if (note.profileVersion.getTime() !== profile.updatedAt.getTime()) {
      tasks.push({ company: c, reason: "stale" });
      continue;
    }
    upToDate++;
  }

  const todo = LIMIT ? tasks.slice(0, LIMIT) : tasks;

  console.log(
    `Companies: ${allCompanies.length} total | ${upToDate} up-to-date | ${tasks.length} to generate${LIMIT ? ` (capped at ${LIMIT})` : ""}`,
  );
  if (DRY_RUN) {
    for (const t of todo) {
      console.log(`  [dry] ${t.reason.padEnd(7)} ${t.company.name}`);
    }
    return;
  }
  if (todo.length === 0) {
    console.log("Nothing to do. ✓");
    return;
  }

  let ok = 0;
  let fail = 0;
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= todo.length) return;
      const t = todo[idx];
      const r = await generateOne(t.company, profile, allFrames);
      if (r.ok) {
        ok++;
        console.log(
          `  ✓ ${String(idx + 1).padStart(3)}/${todo.length} ${t.company.name} (${r.ms}ms, ${t.reason})`,
        );
      } else {
        fail++;
        console.log(
          `  ✗ ${String(idx + 1).padStart(3)}/${todo.length} ${t.company.name} — ${r.error}`,
        );
      }
    }
  }
  const workers = Array.from({ length: Math.min(BATCH, todo.length) }, () =>
    worker(),
  );
  await Promise.all(workers);

  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("✗ fatal:", e);
  process.exit(1);
});
