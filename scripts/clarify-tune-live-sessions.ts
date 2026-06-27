/**
 * v0.8 Step 12 (pass 2/2) — live seeded clarify sessions for tuning.
 *
 * Runs N synthetic clarify sessions against the LIVE skill and the LIVE
 * grounding pipeline (prod Neon → Anthropic), then writes each session
 * as a markdown transcript to:
 *
 *   agent-journal/clarify-tuning/2026-06-26-live-sessions/session-XX-<slug>.md
 *
 * Why a harness instead of clicking through the deployed UI:
 *   - Repeatability: each scenario is a defined seed, so re-running after
 *     a skill edit measures the change rather than noise.
 *   - No DB pollution: bypasses the `clarifySessions` / `clarifyMessages`
 *     persistence path. Calls `buildSystemPrompt` + `callClarifyModel`
 *     directly — same Anthropic call the live UI makes, no row written.
 *     Aadi's /profile Conversations tab stays clean of tuning noise.
 *   - Honest cold-read: I read the transcripts AS IF I were Aadi, looking
 *     for voice slips, contract drift, move misuse, and weak openers.
 *
 * Each scenario simulates a user reply pattern (short / qualifier-heavy
 * / pushback) for two turns past the cat's opening, then closes. The
 * goal isn't to test the user side; it's to capture the cat's *opening
 * move* and her *one-step follow-up* under realistic ground.
 *
 * Usage:
 *   npx tsx scripts/clarify-tune-live-sessions.ts
 *   # write all 7 scenarios; ~$0.15 total at sonnet-4-5 pricing
 *
 *   SCENARIOS=manual-cold,company-detail-anthropic npx tsx scripts/...
 *   # run a subset
 *
 *   DRY_RUN=1 npx tsx scripts/...
 *   # show what would run; don't hit Anthropic
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { promises as fs } from "node:fs";
import path from "node:path";

import {
  loadGrounding,
  buildSystemPrompt,
  callClarifyModel,
  extractProposal,
  openerPrompt,
  type ClarifyTrigger,
} from "@/lib/clarify/run-session";

const DRY_RUN = process.env.DRY_RUN === "1";
const OUTPUT_DIR = path.join(
  process.cwd(),
  "agent-journal",
  "clarify-tuning",
  "2026-06-26-live-sessions",
);

type Scenario = {
  slug: string;
  /** What this scenario is supposed to surface from the skill. */
  exercises: string;
  trigger: ClarifyTrigger;
  /** Optional seed: company slug (looked up to id) or frame name. */
  seedCompanySlug?: string;
  seedFrameName?: string;
  /** Two user replies to feed the cat. */
  userReplies: [string, string];
};

const SCENARIOS: Scenario[] = [
  {
    slug: "manual-cold",
    exercises: "cold-open move — manual trigger, no seed, thin context",
    trigger: "manual",
    userReplies: [
      "honestly, just looking around. nothing specific.",
      "i guess i keep coming back to whether london is too narrow.",
    ],
  },
  {
    slug: "company-detail-anthropic",
    exercises:
      "contradiction or forced-trade move — high-score US lab while user is UK-anchored",
    trigger: "company-detail",
    seedCompanySlug: "anthropic-london",
    userReplies: [
      "i don't know. i think i keep imagining myself there and then remembering i don't actually want to move.",
      "yeah. and honestly the UK thing isn't a Must, it's a hard constraint. different thing.",
    ],
  },
  {
    slug: "company-detail-aisi",
    exercises:
      "honest-mirror or drift-check — government-track high-fit option, user has been quiet about it",
    trigger: "company-detail",
    seedCompanySlug: "aisi",
    userReplies: [
      "i've been avoiding scoring AISI because i don't want to admit it's the obvious answer.",
      "i think i want something a bit weirder than 'go work for the regulator you spent the last five years writing to.'",
    ],
  },
  {
    slug: "wizard-seeded",
    exercises: "wizard trigger — 3-question seeded opener with fresh weights",
    trigger: "wizard",
    userReplies: [
      "i think i want frontier-defining work but i also want to be close to home.",
      "yes that's a real tension. i've been pretending it isn't.",
    ],
  },
  {
    slug: "welcome-back-quiet",
    exercises: "welcome-back trigger — user has been quiet, check for drift",
    trigger: "welcome-back",
    userReplies: [
      "haven't really thought about it this week, been busy with work.",
      "no, nothing's changed. just haven't had bandwidth.",
    ],
  },
  {
    slug: "company-detail-apollo",
    exercises:
      "hidden-frame move — niche research org, user notes mention 'people i'd want to argue with'",
    trigger: "company-detail",
    seedCompanySlug: "apollo-research",
    userReplies: [
      "yeah they keep coming up in my notes. there's something about how they write that i like.",
      "i think it's that they argue with each other in public and it doesn't feel performative.",
    ],
  },
  {
    slug: "manual-stuck",
    exercises: "exit move — user reports being stuck without a specific signal",
    trigger: "manual",
    userReplies: [
      "i don't know. it's all a bit blurry right now.",
      "the search itself. it's like i can't see the shape of what i'm choosing between.",
    ],
  },
];

async function lookupSeedCompanyId(slug: string): Promise<number | null> {
  const { db } = await import("@/db");
  const { companies } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const [c] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  return c?.id ?? null;
}

async function lookupSeedFrameId(name: string): Promise<number | null> {
  const { db } = await import("@/db");
  const { frames } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const [f] = await db
    .select({ id: frames.id })
    .from(frames)
    .where(eq(frames.name, name))
    .limit(1);
  return f?.id ?? null;
}

async function runScenario(
  s: Scenario,
  index: number,
): Promise<{ slug: string; transcript: string }> {
  console.log(`\n[${index + 1}/${SCENARIOS.length}] ${s.slug}`);
  console.log(`  exercises: ${s.exercises}`);

  const seedCompanyId = s.seedCompanySlug
    ? await lookupSeedCompanyId(s.seedCompanySlug)
    : null;
  const seedFrameId = s.seedFrameName
    ? await lookupSeedFrameId(s.seedFrameName)
    : null;

  if (s.seedCompanySlug && seedCompanyId == null) {
    console.log(`  ⚠️  company slug ${s.seedCompanySlug} not found — skipping`);
    return {
      slug: s.slug,
      transcript: `# SKIPPED — company slug "${s.seedCompanySlug}" not in DB`,
    };
  }

  const ctx = await loadGrounding({
    seedCompanyId,
    seedFrameId,
    excludeSessionId: null,
  });
  const system = await buildSystemPrompt(ctx);
  const opener = openerPrompt(s.trigger, ctx);

  console.log(
    `  trigger=${s.trigger}` +
      (s.seedCompanySlug ? ` seedCompany=${s.seedCompanySlug}` : "") +
      ` systemBytes=${system.length}`,
  );

  if (DRY_RUN) {
    return {
      slug: s.slug,
      transcript:
        `# DRY-RUN — ${s.slug}\n\n## context\n\n` +
        `trigger: ${s.trigger}\nseedCompany: ${s.seedCompanySlug ?? "(none)"}\n` +
        `systemBytes: ${system.length}\n\n` +
        `## opener prompt\n\n${opener}\n\n## system (first 1200 chars)\n\n\`\`\`\n${system.slice(0, 1200)}\n…\n\`\`\`\n`,
    };
  }

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: opener },
  ];
  const turns: Array<{
    role: string;
    body: string;
    moveType: string | null;
    ended?: boolean;
    proposalSummary?: string | null;
  }> = [];

  // Turn 0 — opening
  const openingRaw = await callClarifyModel({ system, messages });
  const opening = extractProposal(openingRaw);
  turns.push({
    role: "cat",
    body: opening.body,
    moveType: opening.moveType,
    ended: opening.ended,
    proposalSummary:
      opening.proposal && typeof opening.proposal.summary === "string"
        ? opening.proposal.summary
        : null,
  });
  messages.push({ role: "assistant", content: openingRaw });
  console.log(
    `  turn 0 (cat opener): ${opening.body.slice(0, 80).replace(/\s+/g, " ")}…`,
  );
  if (opening.ended) {
    console.log("  (cat ended on opener — unusual; capturing)");
  }

  // Two synthetic user → cat exchanges, unless the cat already ended.
  for (let i = 0; i < 2 && !turns[turns.length - 1].ended; i++) {
    const userReply = s.userReplies[i];
    messages.push({ role: "user", content: userReply });
    turns.push({ role: "user", body: userReply, moveType: null });
    const replyRaw = await callClarifyModel({ system, messages });
    const reply = extractProposal(replyRaw);
    turns.push({
      role: "cat",
      body: reply.body,
      moveType: reply.moveType,
      ended: reply.ended,
      proposalSummary:
        reply.proposal && typeof reply.proposal.summary === "string"
          ? reply.proposal.summary
          : null,
    });
    messages.push({ role: "assistant", content: replyRaw });
    console.log(
      `  turn ${i + 1} (cat): ${reply.body.slice(0, 80).replace(/\s+/g, " ")}…` +
        (reply.ended ? " [ENDED]" : ""),
    );
    if (reply.ended) break;
  }

  // Format the transcript
  let md = `# Session ${s.slug}\n\n`;
  md += `**Exercises:** ${s.exercises}\n\n`;
  md += `**Trigger:** \`${s.trigger}\`  `;
  if (s.seedCompanySlug) md += `· seedCompany: \`${s.seedCompanySlug}\``;
  md += `\n\n---\n\n`;
  for (const t of turns) {
    if (t.role === "cat") {
      md += `**🐱 lobbycat**`;
      if (t.moveType) md += ` *(move: ${t.moveType})*`;
      md += `\n\n${t.body}\n\n`;
      if (t.proposalSummary) {
        md += `> **proposal:** ${t.proposalSummary}\n\n`;
      }
      if (t.ended) md += `*(session ended)*\n\n`;
    } else {
      md += `**👤 user**\n\n${t.body}\n\n`;
    }
  }
  return { slug: s.slug, transcript: md };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const filter = (process.env.SCENARIOS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const scenarios =
    filter.length > 0 ? SCENARIOS.filter((s) => filter.includes(s.slug)) : SCENARIOS;

  console.log(`running ${scenarios.length} of ${SCENARIOS.length} scenarios`);
  if (DRY_RUN) console.log("(DRY_RUN: no Anthropic calls)");

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    try {
      const result = await runScenario(s, i);
      const filename = `session-${String(i + 1).padStart(2, "0")}-${result.slug}.md`;
      const outPath = path.join(OUTPUT_DIR, filename);
      await fs.writeFile(outPath, result.transcript);
      console.log(`  → wrote ${path.relative(process.cwd(), outPath)}`);
    } catch (e) {
      console.error(`  ✘ ${s.slug} failed:`, e);
    }
  }

  console.log(`\ndone. transcripts in ${path.relative(process.cwd(), OUTPUT_DIR)}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
