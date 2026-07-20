#!/usr/bin/env node
/**
 * build-daily-diff.mjs — Glyphie 🌀
 *
 * Deterministic diff builder. Takes today's role snapshot and the most
 * recent prior snapshot, produces a JSON structured for LLM synthesis.
 * No LLM call here; no network; no writes to feeds.
 *
 * Runs as part of daily-harvest-cron.sh. Output goes to stdout so cron
 * can redirect it into research/snapshots/pending-YYYY-MM-DD-diff.json.
 *
 * Usage:
 *   node research/scripts/build-daily-diff.mjs 2026-07-18
 *   → JSON on stdout
 *
 * Also picks up any publication/press/controversy events in feed.json
 * dated on or after the last-snapshot date, so the LLM has the full
 * "since last time" material — not just roles.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const date = process.argv[2];
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("usage: build-daily-diff.mjs YYYY-MM-DD");
  process.exit(2);
}

const RESEARCH = path.resolve("research");
const ROLES_DIR = path.join(RESEARCH, "feeds", "roles");

function keyOf(role) {
  return `${role.slug}::${role.title}::${role.url || role.location || ""}`;
}

const files = (await readdir(ROLES_DIR))
  .filter((f) => /^snapshot-\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .sort();

const todayFile = `snapshot-${date}.json`;
if (!files.includes(todayFile)) {
  console.error(`no snapshot for ${date}`);
  process.exit(3);
}
const todayIdx = files.indexOf(todayFile);
if (todayIdx === 0) {
  console.error("no prior snapshot to diff against");
  process.exit(4);
}
const priorFile = files[todayIdx - 1];
const priorDate = priorFile.replace(/^snapshot-|\.json$/g, "");

const today = JSON.parse(
  await readFile(path.join(ROLES_DIR, todayFile), "utf8"),
);
const prior = JSON.parse(
  await readFile(path.join(ROLES_DIR, priorFile), "utf8"),
);

const priorKeys = new Set((prior.roles || []).map(keyOf));
const todayKeys = new Set((today.roles || []).map(keyOf));

const added = (today.roles || []).filter((r) => !priorKeys.has(keyOf(r)));
const removed = (prior.roles || []).filter((r) => !todayKeys.has(keyOf(r)));

// Pull feed.json events dated between priorDate and today (inclusive).
// These are publications/press/controversy — LLM should weave them in.
let feedEventsInWindow = [];
try {
  const feed = JSON.parse(
    await readFile(path.join(RESEARCH, "feed.json"), "utf8"),
  );
  const priorMs = Date.parse(priorDate);
  const todayMs = Date.parse(date) + 24 * 60 * 60 * 1000; // include today
  feedEventsInWindow = (feed.events || []).filter((e) => {
    const t = Date.parse(e.date);
    return (
      Number.isFinite(t) && t >= priorMs && t < todayMs && e.event_type !== "role"
    );
  });
} catch {
  // feed.json missing / malformed — omit publications, still emit role diff.
}

// Group added roles by slug to help the LLM see clusters.
const addedBySlug = {};
for (const r of added) {
  addedBySlug[r.slug] ||= [];
  addedBySlug[r.slug].push({
    title: r.title,
    location: r.location || null,
    url: r.url || null,
    londonRelevant: !!r.londonRelevant,
  });
}
const removedBySlug = {};
for (const r of removed) {
  removedBySlug[r.slug] ||= [];
  removedBySlug[r.slug].push({
    title: r.title,
    location: r.location || null,
    url: r.url || null,
  });
}

const out = {
  date,
  priorDate,
  generatedAt: new Date().toISOString(),
  summary: {
    added: added.length,
    removed: removed.length,
    addedLondon: added.filter((r) => r.londonRelevant).length,
    todayTotal: (today.roles || []).length,
    priorTotal: (prior.roles || []).length,
  },
  addedRoles: addedBySlug,
  removedRoles: removedBySlug,
  feedEventsInWindow: feedEventsInWindow.map((e) => ({
    date: e.date,
    slug: e.company_slug,
    type: e.event_type,
    summary: e.summary,
    url: e.source_url,
  })),
};

process.stdout.write(JSON.stringify(out, null, 2) + "\n");
