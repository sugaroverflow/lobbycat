# Roles lens — runbook 🌀

The roles lens gives Aadi a chance to **see open AI-policy roles** across the seeded
London-relevant companies. Exposure first; the "team grew 2→3 lawyers" delta is a
bonus signal layered on top.

Built 2026-06-24 (Glyphie), at Fatima's request, to fix the weakest lens in the daily run.

## What runs

`node research/scripts/fetch-roles.mjs`

- Reads `research/sources/role-sources.json` (which ATS to hit per company)
- Reads `research/sources/role-keywords.json` (policy keyword + geo filters)
- Hits each company's **public ATS JSON API** (greenhouse / lever / ashby) — no
  LinkedIn, no HTML scraping, polite 400ms spacing.
- Filters titles to policy/governance/legal/compliance roles, flags London/UK/EMEA.
- Diffs against `research/feeds/roles/latest.json` to mark `isNew` roles (the delta).
- Writes `research/feeds/roles/snapshot-YYYY-MM-DD.json` + overwrites `latest.json`.

Use `--dry` to preview without writing (prints London-relevant roles to stdout).

## The 6am subagent's job

Intended to run as a **spawned subagent** during the 06:00 UTC daily run (keeps the
2,000+ job scan + filtering off the main session's context). Wiring the actual spawn
+ schedule is **Techie's domain** (cron/scheduler = infra). Glyphie owns the script
and the review.

Subagent steps:

1. `node research/scripts/fetch-roles.mjs` — generates today's snapshot.
2. Open `research/feeds/roles/latest.json`. Eyeball `roles` (London-relevant are
   sorted first) and especially `newRoles`.
3. **Sanity-check, don't trust blindly.** Keyword/geo filters are heuristics.
   Drop obvious false positives (an eng role that slipped through on "safeguard",
   a "Legal & Compliance *Tutor*" data-labelling gig, etc.).
4. Fold the genuinely Aadi-relevant roles into:
   - the per-company feed `research/feeds/<slug>.json` → `roles[]` and the
     `hiring` block (`isHiring`, and `newSincePrevious` from the delta),
   - the global `research/feed.json` as `event_type: "role"` events, citing the
     ATS `url`.
5. If a company shows a real **headcount jump** in a function (e.g. Anthropic posts
   a 3rd EMEA policy counsel), that's the SOUL.md "building muscle" signal — call it
   out explicitly in the company feed `notes` and the global summary.

## Maintenance

- **Add a source:** confirm the ATS endpoint returns real jobs for that company
  (`curl` the URL in `_endpoints`), then add an entry to `role-sources.json` and
  set `verified` to today's date. Unmapped companies live in `_unmapped` — most are
  think tanks/regulators with bespoke HTML careers pages (no clean API yet).
- **Tune filters:** edit `role-keywords.json`. `titleInclude` adds relevance;
  `titleExclude` drops noise (but strong includes like policy/counsel/governance/
  regulat always win — see `matchKeywords` in the script).
- **Re-verify quarterly:** ATS board IDs occasionally change. A company that returns
  an ERROR in the snapshot's `errors[]` needs its `id` rechecked.

## Status (2026-06-24 baseline)

13 companies mapped & verified · ~2,283 jobs scanned · 87 policy roles · 26 London/EMEA.
First snapshot is the baseline; deltas begin on the next run.

Unmapped (no ATS API found yet): stability-ai, benevolentai, alan-turing-institute,
ada-lovelace-institute, cltr, aisi, dsit-ai-policy, tbi, demos, nesta,
royal-society-policy, cetas, odi, frontier-economics, cma-dmu, ico-ai, ofcom-ai,
big-brother-watch, connected-by-data, public-law-project, oliver-wyman-london.
