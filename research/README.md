# `research/` — Glyphie's research layer 🌀

This directory is **Glyphie's** (the researcher agent's) output and working notes. It is
the boundary between research and the product: Glyphie writes JSON + Markdown here via
daily PRs; Lotus's code reads it into the database.

## How it reaches the dashboard (the pipeline)

Glyphie does **not** write to the database. It writes files here; a cron sync ingests them.

```
Glyphie (writes JSON via PR)        feeds-sync (Lotus's code)            Dashboard
──────────────────────────────      ───────────────────────────         ──────────
research/feed.json                  src/lib/feeds-sync reads the         reads from
research/feeds/<slug>.json     ───▶  feed files and upserts into    ───▶  Postgres
                                     Postgres (publications table)        (what Aadi sees)
                                     via /api/cron/feeds-sync
```

Why split this way: domain boundaries (Glyphie stays out of `src/`, the DB, and infra),
and the JSON-in-git is the **audit trail** — every claim Aadi eventually sees is a
reviewable diff with a primary-source link.

> Note: `feeds-sync` currently ingests `publications[]`. The `roles[]`, `controversies[]`,
> `filings[]`, and `leadership[]` arrays are written + version-controlled here but not yet
> ingested — extending the sync is a handoff to Lotus.

## Layout

| Path | What it is | Owner |
|---|---|---|
| `feed.json` | Global timeline of events (read by `feeds-sync` + welcome-back). **Code-referenced.** | Glyphie |
| `feeds/<slug>.json` | Per-company feed: `publications` / `roles` / `controversies` / `filings` / `leadership`. **Code-referenced (`feeds/`).** | Glyphie |
| `feeds/roles/` | Roles-lens snapshots from `scripts/fetch-roles.mjs` (`latest.json` = delta baseline). | Glyphie |
| `glyphie-notes/<date>.md` | Daily run logs — raw, append-only audit trail. Not rewritten retroactively. | Glyphie |
| `sources/` | Curated "where to look" maps: `role-sources.json` (ATS endpoints), `role-keywords.json` (filters). | Glyphie |
| `scripts/` | Runnable tooling: `fetch-roles.mjs` + `ROLES-RUNBOOK.md`. | Glyphie |
| `controversy-scope.md` | Spec for the controversy/reputational-signal layer (signed off, live). | Glyphie |
| `controversy-frontend-handoff.md` | Handoff to Lotus on displaying controversy data. | Glyphie → Lotus |
| `london-companies.md` | v0.5 editorial curation memo for the seed set. **Cited by `seed-data.ts`.** | Lotus |
| `policy-evidence-types.md` | Scoping memo: what evidence matters for the v0.6 scoring engine. | Lotus |
| `profile-user.md` | Distilled Aadi profile grounding the per-company "fit notes". **Cited by `seed-data.ts`.** | — |
| `v0.7/glyphie-sources.md` | Verified daily monitoring source list for Glyphie. | Lotus |
| `v0.7/vaporwave-prompt.md` | Visual design-system prompt for the v0.7 revamp. **Referenced by `vaporwave.css`.** | — |

## Conventions

- **Never invent.** No primary/named source → it doesn't go in the JSON (at most a lead in
  the daily note). A missed signal beats a wrong one.
- **Cite everything.** Every claim links to a primary or named source.
- **Daily notes are append-only.** They're the audit trail; correct forward, don't rewrite.
- **Surprise discipline.** lobbycat is a surprise for Aadi — keep gift-energy and
  surprise-sensitive detail out of anything he'll eventually read.
