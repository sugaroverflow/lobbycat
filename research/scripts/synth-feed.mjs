#!/usr/bin/env node
// synth-feed.mjs — merge per-company feeds/<slug>.json into the global feed.json timeline.
//
// Design:
//  - PRESERVE existing feed.json events (hand-curated editorial summaries, roles,
//    backfilled controversies with synthetic surfacing dates). Never clobber them.
//  - ADD dated publication + news items from per-company feeds that aren't already
//    represented (dedupe by normalized source_url).
//  - Only emit items with a real `date` and a real `url` (never invent dates).
//  - Sort newest-first; keep output schema identical to existing feed.json events.
//
// Usage: node research/scripts/synth-feed.mjs            (writes research/feed.json)
//        node research/scripts/synth-feed.mjs --dry-run  (prints summary, no write)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const researchDir = path.resolve(__dirname, "..");
const feedsDir = path.join(researchDir, "feeds");
const globalPath = path.join(researchDir, "feed.json");
const dryRun = process.argv.includes("--dry-run");

const normUrl = (u) =>
  (u || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .toLowerCase();

// 1. Load existing global feed (preserve its events verbatim).
let existing = { lastUpdated: null, events: [] };
if (fs.existsSync(globalPath)) {
  existing = JSON.parse(fs.readFileSync(globalPath, "utf8"));
}
const events = [...(existing.events || [])];
const seen = new Set(events.map((e) => normUrl(e.source_url)));

// 2. Walk per-company feeds; add new dated pub/news items.
const feedFiles = fs
  .readdirSync(feedsDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

let added = 0;
const addedBySlug = {};
for (const file of feedFiles) {
  const d = JSON.parse(fs.readFileSync(path.join(feedsDir, file), "utf8"));
  const slug = d.slug || path.basename(file, ".json");

  const consider = [
    ...(d.publications || []).map((x) => ({ ...x, _type: "publication" })),
    ...(d.news || []).map((x) => ({ ...x, _type: "news" })),
  ];

  for (const item of consider) {
    if (!item.date || !item.url) continue; // never invent dates/sources
    const key = normUrl(item.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const summary =
      item.summary ||
      item.title ||
      "(no summary)";
    events.push({
      date: item.date,
      company_slug: slug,
      event_type: item._type === "news" ? "press" : "publication",
      summary: item.byline ? `${summary}` : summary,
      source_url: item.url,
    });
    added++;
    addedBySlug[slug] = (addedBySlug[slug] || 0) + 1;
  }
}

// 3. Sort newest-first (string ISO dates sort correctly; nulls already excluded).
events.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

const out = {
  lastUpdated: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  events,
};

console.log(`existing events: ${(existing.events || []).length}`);
console.log(`new dated items added: ${added}`);
console.log(`total events: ${events.length}`);
if (added > 0) {
  console.log("added by slug:");
  for (const [s, n] of Object.entries(addedBySlug).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${n}`);
  }
}

if (dryRun) {
  console.log("\n[dry-run] not writing feed.json");
} else {
  fs.writeFileSync(globalPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nwrote ${globalPath}`);
}
