#!/usr/bin/env node
/**
 * synthesise-daily-summary.mjs — Glyphie 🌀
 *
 * Reads research/snapshots/pending-YYYY-MM-DD-diff.json, calls an LLM to
 * synthesise a short briefing-style prose summary (SOUL.md voice), and
 * writes:
 *   research/snapshots/daily-YYYY-MM-DD.json    — archive
 *   research/snapshots/latest.json              — pointer for the card
 *
 * Requires: OPENAI_API_KEY (or an override via --api-key <key>).
 *
 * Usage:
 *   node research/scripts/synthesise-daily-summary.mjs 2026-07-18
 *   node research/scripts/synthesise-daily-summary.mjs 2026-07-18 --dry
 *
 * Voice constraints (locked into system prompt):
 *   - Reader-of-the-family briefing, not LinkedIn.
 *   - No "exciting times in AI policy" energy. No hype.
 *   - 2–4 sentences. Preserve what matters, cite via inline sourceUrls.
 *   - Never invent. If uncertain, say so. If the diff is thin, say so.
 *   - Don't leak "surprise for Aadi" — Aadi may read this.
 *   - Prefer noticing the small signal (a coordinated hire cluster is
 *     worth more than an isolated title with an eye-catching keyword).
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
const date = argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const DRY = argv.includes("--dry");
const keyFlagIdx = argv.indexOf("--api-key");
const overrideKey = keyFlagIdx >= 0 ? argv[keyFlagIdx + 1] : null;

if (!date) {
  console.error("usage: synthesise-daily-summary.mjs YYYY-MM-DD [--dry] [--api-key KEY]");
  process.exit(2);
}

const RESEARCH = path.resolve("research");
const SNAP_DIR = path.join(RESEARCH, "snapshots");
const pending = path.join(SNAP_DIR, `pending-${date}-diff.json`);
const finalPath = path.join(SNAP_DIR, `daily-${date}.json`);
const latestPath = path.join(SNAP_DIR, "latest.json");

let diff;
try {
  diff = JSON.parse(await readFile(pending, "utf8"));
} catch (e) {
  console.error(`no pending diff at ${pending} — nothing to synthesise`);
  process.exit(3);
}

const apiKey = overrideKey || process.env.OPENAI_API_KEY;
if (!apiKey && !DRY) {
  console.error("OPENAI_API_KEY not set; use --dry to test prompt without calling");
  process.exit(4);
}

// Compact the diff for the LLM. Keep sourceUrls so the model can cite.
const model = process.env.OPENAI_MODEL || "gpt-5.5";
const systemPrompt = `You are Glyphie 🌀, a careful research familiar tracking AI-policy hiring for lobbycat.

Voice: SOUL.md — reader-of-the-family briefing tone. Not LinkedIn. Not "exciting times in AI policy!" Not hype. Think thoughtful older sibling explaining a paper over coffee.

Task: Given a structured diff of role changes at London-relevant AI-policy companies since the previous daily snapshot, write a short prose briefing (2–4 sentences) that:
  1. Names the highest-signal change first. Coordinated hire clusters beat isolated titles. First-of-a-kind roles matter (e.g. "first UK-specific X"). Team-standup patterns matter (a fresh public affairs function, a Safeguards enforcement function scaling).
  2. Cites sources via [name](url) markdown links inline, one per company mentioned.
  3. Notices small signals: legal team scaling 0→2, PA function standup, geographical shifts.
  4. Never invents. If a cluster's individual titles are eye-catching but the pattern is boring, say it's boring.
  5. Ends with one honest note about what you saw that you're NOT confident about, if anything.
  6. NEVER mentions "Aadi" by name — he may read this. Frame as "for you" / "worth watching" / no name.

Output plain text only. No JSON, no headers, no bullet list — flowing prose.`;

const user = `Diff for ${diff.date} (since ${diff.priorDate}):

Roles added: ${diff.summary.added} (of which ${diff.summary.addedLondon} London-relevant)
Roles removed: ${diff.summary.removed}
Snapshot total: ${diff.summary.priorTotal} → ${diff.summary.todayTotal}

Added roles by company:
${Object.entries(diff.addedRoles).map(([slug, roles]) =>
  `\n  ${slug}:\n${roles.map((r) => `    - ${r.title}${r.londonRelevant ? " [London]" : ""} → ${r.url || "(no url)"}`).join("\n")}`
).join("")}

Removed roles (may be filled or delisted):
${Object.entries(diff.removedRoles).map(([slug, roles]) =>
  `\n  ${slug}:\n${roles.map((r) => `    - ${r.title}`).join("\n")}`
).join("") || "  (none)"}

Publications/press events since last snapshot: ${diff.feedEventsInWindow.length}
${diff.feedEventsInWindow.slice(0, 5).map((e) => `  - [${e.date}] ${e.slug}: ${e.summary.slice(0, 140)}${e.summary.length > 140 ? "…" : ""} → ${e.url}`).join("\n")}

Write the briefing now.`;

if (DRY) {
  console.log("=== SYSTEM ===");
  console.log(systemPrompt);
  console.log("\n=== USER ===");
  console.log(user);
  process.exit(0);
}

const body = {
  model,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: user },
  ],
  max_completion_tokens: 2000,
};

const t0 = Date.now();
const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify(body),
});
if (!res.ok) {
  const t = await res.text();
  console.error(`LLM HTTP ${res.status}: ${t.slice(0, 500)}`);
  process.exit(5);
}
const payload = await res.json();
const summary = payload.choices?.[0]?.message?.content?.trim();
if (!summary) {
  console.error("LLM returned no content. Full response:");
  console.error(JSON.stringify(payload, null, 2).slice(0, 2000));
  process.exit(6);
}

// Extract cited urls for the WelcomeBackData shape.
const urlPattern = /\((https?:\/\/[^)\s]+)\)/g;
const sourceUrls = [...summary.matchAll(urlPattern)].map((m) => m[1]);

const snapshot = {
  date,
  priorDate: diff.priorDate,
  generatedAt: new Date().toISOString(),
  generatedBy: `openai/${model}`,
  latencyMs: Date.now() - t0,
  summary,
  sourceUrls,
  diffSummary: diff.summary,
};

await mkdir(SNAP_DIR, { recursive: true });
await writeFile(finalPath, JSON.stringify(snapshot, null, 2) + "\n");
await writeFile(latestPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`wrote ${finalPath}`);
console.log(`wrote ${latestPath}`);
console.log(`  latency: ${snapshot.latencyMs}ms`);
console.log(`  summary: ${summary}`);
