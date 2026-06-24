#!/usr/bin/env node
/**
 * fetch-roles.mjs — Glyphie's roles lens 🌀
 *
 * Hits each company's ATS public JSON API (greenhouse/lever/ashby), filters
 * titles by policy keywords, flags London/UK/EMEA relevance, and writes a
 * roles report. The 6am subagent invokes this, reviews the output, and folds
 * the high-signal roles into per-company feeds + the global feed.
 *
 * GOAL (per Fatima, 2026-06-24): exposure first — give Aadi a chance to SEE
 * relevant open policy roles. The 2->3-lawyers "delta" is a bonus signal layered
 * on top, computed by diffing against the previous snapshot.
 *
 * No LinkedIn. No HTML scraping. Free public ATS APIs only.
 *
 * Usage:
 *   node research/scripts/fetch-roles.mjs            # fetch + write report
 *   node research/scripts/fetch-roles.mjs --dry      # print summary, no write
 *
 * Outputs:
 *   research/feeds/roles/snapshot-YYYY-MM-DD.json    # full filtered set + counts
 *   research/feeds/roles/latest.json                 # symlink-ish copy (delta baseline)
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEARCH = path.resolve(__dirname, "..");
const SOURCES = path.join(RESEARCH, "sources", "role-sources.json");
const KEYWORDS = path.join(RESEARCH, "sources", "role-keywords.json");
const OUT_DIR = path.join(RESEARCH, "feeds", "roles");

const DRY = process.argv.includes("--dry");
const today = new Date().toISOString().slice(0, 10);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function urlFor(ats, id) {
  switch (ats) {
    case "greenhouse":
      return `https://boards-api.greenhouse.io/v1/boards/${id}/jobs?content=true`;
    case "lever":
      return `https://api.lever.co/v0/postings/${id}?mode=json`;
    case "ashby":
      return `https://api.ashbyhq.com/posting-api/job-board/${id}?includeCompensation=false`;
    default:
      return null;
  }
}

/** Normalise each ATS payload into {title, location, url}. */
function normalise(ats, payload) {
  if (ats === "greenhouse") {
    return (payload.jobs || []).map((j) => ({
      title: j.title || "",
      location: (j.location && j.location.name) || "",
      url: j.absolute_url || "",
    }));
  }
  if (ats === "lever") {
    return (payload || []).map((j) => ({
      title: j.text || "",
      location:
        (j.categories &&
          (j.categories.location ||
            (j.categories.allLocations || []).join(" | "))) ||
        "",
      url: j.hostedUrl || j.applyUrl || "",
    }));
  }
  if (ats === "ashby") {
    return (payload.jobs || []).map((j) => ({
      title: j.title || "",
      location: j.location || "",
      url: j.jobUrl || j.applyUrl || "",
    }));
  }
  return [];
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "lobbycat-glyphie-roles/1.0 (+research, contact via repo)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function matchKeywords(title, kw) {
  const t = title.toLowerCase();
  const inc = kw.titleInclude.find((k) => t.includes(k.toLowerCase()));
  if (!inc) return { keep: false };
  const exc = kw.titleExclude.find((k) => t.includes(k.toLowerCase()));
  // An explicit engineering/sales exclude term overrides a weak include match
  // (e.g. "Software Engineer, Safeguards" -> drop; it's eng, not policy).
  // Strong policy includes (counsel/policy/governance/regulat) always win.
  const strong = ["policy", "counsel", "governance", "regulat", "public affairs", "government affairs", "government relations", "compliance officer"];
  const isStrong = strong.some((s) => t.includes(s));
  if (exc && !isStrong) return { keep: false, droppedBy: exc };
  return { keep: true, matched: inc, excludedHint: exc || null };
}

function geoFlag(location, kw) {
  const l = (location || "").toLowerCase();
  const hit = kw.geoPrefer.find((g) => l.includes(g.toLowerCase()));
  return hit || null;
}

async function loadPrevSnapshot() {
  const latest = path.join(OUT_DIR, "latest.json");
  if (!existsSync(latest)) return null;
  try {
    return JSON.parse(await readFile(latest, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const sources = JSON.parse(await readFile(SOURCES, "utf8"));
  const kw = JSON.parse(await readFile(KEYWORDS, "utf8"));
  const prev = await loadPrevSnapshot();
  const prevKeys = new Set();
  if (prev) for (const r of prev.roles || []) prevKeys.add(`${r.slug}::${r.title}::${r.location}`);

  const perCompany = {};
  const allRoles = [];
  const errors = [];

  for (const src of sources.sources) {
    const url = urlFor(src.ats, src.id);
    try {
      const payload = await fetchJson(url);
      const jobs = normalise(src.ats, payload);
      const kept = [];
      for (const job of jobs) {
        const m = matchKeywords(job.title, kw);
        if (!m.keep) continue;
        const geo = geoFlag(job.location, kw);
        const key = `${src.slug}::${job.title}::${job.location}`;
        kept.push({
          slug: src.slug,
          title: job.title.trim(),
          location: job.location.trim(),
          url: job.url,
          matched: m.matched,
          londonRelevant: !!geo,
          geoHit: geo,
          isNew: prev ? !prevKeys.has(key) : null,
        });
      }
      perCompany[src.slug] = {
        ats: src.ats,
        totalJobs: jobs.length,
        policyRoles: kept.length,
        londonRoles: kept.filter((r) => r.londonRelevant).length,
      };
      allRoles.push(...kept);
      process.stderr.write(
        `  ${src.slug.padEnd(20)} ${String(jobs.length).padStart(4)} jobs -> ${String(
          kept.length,
        ).padStart(2)} policy (${kept.filter((r) => r.londonRelevant).length} London/EMEA)\n`,
      );
    } catch (e) {
      errors.push({ slug: src.slug, ats: src.ats, error: String(e.message || e) });
      process.stderr.write(`  ${src.slug.padEnd(20)} ERROR: ${e.message || e}\n`);
    }
    await sleep(400); // be polite to the ATS APIs
  }

  // Sort: London-relevant first, then new, then alphabetical by company.
  allRoles.sort(
    (a, b) =>
      Number(b.londonRelevant) - Number(a.londonRelevant) ||
      Number(b.isNew) - Number(a.isNew) ||
      a.slug.localeCompare(b.slug),
  );

  const newRoles = prev ? allRoles.filter((r) => r.isNew) : [];
  const report = {
    generated: new Date().toISOString(),
    date: today,
    summary: {
      companies: sources.sources.length,
      reachable: sources.sources.length - errors.length,
      totalPolicyRoles: allRoles.length,
      londonRoles: allRoles.filter((r) => r.londonRelevant).length,
      newSincePrevious: prev ? newRoles.length : null,
    },
    perCompany,
    roles: allRoles,
    newRoles,
    errors,
    _note:
      "Generated by research/scripts/fetch-roles.mjs. Review before publishing — geo/keyword filters are heuristics. Fold high-signal (especially London/EMEA) roles into per-company feeds[].roles and the global feed as event_type:'role'.",
  };

  process.stderr.write(
    `\n  TOTAL: ${report.summary.totalPolicyRoles} policy roles, ` +
      `${report.summary.londonRoles} London/EMEA-relevant` +
      (prev ? `, ${report.summary.newSincePrevious} new since last run` : " (no baseline yet)") +
      `\n`,
  );

  if (DRY) {
    process.stderr.write("  --dry: not writing.\n");
    // Print the London-relevant roles so a human/subagent can eyeball them.
    for (const r of allRoles.filter((x) => x.londonRelevant)) {
      process.stdout.write(`  • [${r.slug}] ${r.title} — ${r.location}${r.isNew ? "  (NEW)" : ""}\n`);
    }
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const snapPath = path.join(OUT_DIR, `snapshot-${today}.json`);
  await writeFile(snapPath, JSON.stringify(report, null, 2) + "\n");
  await writeFile(path.join(OUT_DIR, "latest.json"), JSON.stringify(report, null, 2) + "\n");
  process.stderr.write(`  wrote ${path.relative(RESEARCH, snapPath)} (+ latest.json)\n`);
}

main().catch((e) => {
  process.stderr.write(`FATAL: ${e.stack || e}\n`);
  process.exit(1);
});
