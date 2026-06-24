/**
 * v0.7.2 Step 3 — Pre-seed friendly first-person descriptions on every
 * `kind='scale'` frame, replacing the dry low/high-label restatements with
 * the cat speaking in her own voice.
 *
 * Why: Step 3 of REFACTOR-v0.7.2 collapses the frames page to one card per
 * frame, with a single friendly paragraph as the explainer. v0.6/v0.7
 * descriptions were terse and dev-coded ("UK-hostile → UK-friendly. Tracks
 * whether the company is good for UK gov work."). The card layout needs
 * warmer prose.
 *
 * Strategy: one batched Sonnet call producing N friendly descriptions in
 * a single round-trip. The model is given the user profile (so it can hint
 * at "you" without naming Aadi), the existing low/high labels (so it stays
 * faithful to the original axis), and the original description (so it
 * doesn't drift).
 *
 * Idempotency: a frame is **skipped** if its description is already > 80
 * characters (signal that someone has already written a real description).
 * Pre-v0.7.2 descriptions in production are all shorter than that. Pass
 * `FORCE=1` to rewrite all scale frames regardless.
 *
 * Cost: one Sonnet call, ~600 input tokens × ~700 output tokens ≈ $0.01.
 *
 * Usage:
 *   npx tsx scripts/rewrite-frame-descriptions.ts          # rewrite short ones only
 *   FORCE=1 npx tsx scripts/rewrite-frame-descriptions.ts  # rewrite all
 *   DRY_RUN=1 npx tsx scripts/rewrite-frame-descriptions.ts  # show, don't write
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/db";
import { frames as framesTable, userProfile } from "../src/db/schema";
import { eq } from "drizzle-orm";

const FORCE = process.env.FORCE === "1";
const DRY_RUN = process.env.DRY_RUN === "1";
const MIN_LEN_TO_KEEP = 80;

type Rewrite = { frameId: number; description: string };

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) throw new Error("user profile not seeded");

  const all = await db.select().from(framesTable).orderBy(framesTable.sortIndex);
  const scaleFrames = all.filter((f) => f.kind === "scale");

  const targets = FORCE
    ? scaleFrames
    : scaleFrames.filter(
        (f) => !f.description || f.description.trim().length < MIN_LEN_TO_KEEP,
      );

  if (targets.length === 0) {
    console.log(
      `nothing to rewrite — all ${scaleFrames.length} scale frames already have descriptions of length ≥ ${MIN_LEN_TO_KEEP}.`,
    );
    console.log(`(pass FORCE=1 to rewrite anyway.)`);
    return;
  }

  console.log(
    `rewriting ${targets.length} of ${scaleFrames.length} scale frames…`,
  );

  const framesContext = targets
    .map(
      (f, i) =>
        `${i + 1}. id=${f.id} name="${f.name}" low="${f.lowLabel ?? ""}" high="${f.highLabel ?? ""}" scale=${f.scale} oldDescription="${f.description ?? ""}"`,
    )
    .join("\n");

  const concerns = ((profile.concerns as string[]) ?? []).join("\n- ");

  const system = `You are lobbycat — a thoughtful, slightly catty research familiar that helps the user evaluate AI policy roles. You write the body copy that goes on the user's "frames" page. Voice: warm, specific, second-person ("you"). Never address the user by name. Never use marketing language. Never start sentences with "this is" or "this matters because". Each description is one short paragraph (40–60 words) — what this frame is asking, when it bites, and what a high vs low company might look like in practice. No bullet lists. No headings. No emoji.`;

  const userPrompt = `# User profile context (for tone calibration only — don't quote it back)

${profile.headline ?? ""}

${profile.bio ?? ""}

${concerns ? "Their stated concerns:\n- " + concerns : ""}

# Frames to rewrite

For each frame below, write a fresh one-paragraph description in the cat's voice. Stay faithful to the existing axis (low→high), but lift the explanation out of dry restatement into something the user would actually want to read.

${framesContext}

# Output — STRICT JSON

Return ONLY a JSON object with a "rewrites" array. No preamble, no markdown fences, no closing remarks.

{
  "rewrites": [
    { "frameId": 1, "description": "..." },
    { "frameId": 2, "description": "..." }
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
      model: "claude-sonnet-4-5",
      max_tokens: 2500,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok)
    throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const raw = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: { rewrites?: unknown };
  try {
    parsed = JSON.parse(stripped) as { rewrites?: unknown };
  } catch {
    console.error("malformed JSON from the cat. raw response:\n", raw);
    process.exit(1);
  }

  const rewrites: Rewrite[] = [];
  for (const r of Array.isArray(parsed.rewrites) ? parsed.rewrites : []) {
    if (!r || typeof r !== "object") continue;
    const obj = r as Record<string, unknown>;
    const frameId = Number(obj.frameId);
    const description =
      typeof obj.description === "string" ? obj.description.trim() : "";
    if (!Number.isInteger(frameId) || !description) continue;
    rewrites.push({ frameId, description });
  }

  if (rewrites.length === 0) {
    console.error("no usable rewrites in response. raw:\n", raw);
    process.exit(1);
  }

  const targetIds = new Set(targets.map((f) => f.id));
  for (const rw of rewrites) {
    if (!targetIds.has(rw.frameId)) {
      console.warn(
        `  ⚠️  frame id=${rw.frameId} not in target set — skipping.`,
      );
      continue;
    }
    const frame = targets.find((f) => f.id === rw.frameId);
    console.log(`\n[${frame?.name}]`);
    console.log(`  old: ${frame?.description ?? "(none)"}`);
    console.log(`  new: ${rw.description}`);
    if (!DRY_RUN) {
      await db
        .update(framesTable)
        .set({ description: rw.description })
        .where(eq(framesTable.id, rw.frameId));
    }
  }

  console.log(
    `\n${DRY_RUN ? "(dry-run) would have updated" : "updated"} ${rewrites.length} frame descriptions.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
