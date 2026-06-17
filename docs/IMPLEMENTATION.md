# Implementation plan

A working document. Updated as we build.

## What this is

A dashboard for someone reviewing AI policy roles across companies. The goal is to make a structured judgement easier than scattered tabs and coffee-chat notes.

Two layers:

1. **Objective** (auto-ingested) — companies, open policy roles, policy team members, recent policy publications, lobbying footprint.
2. **Subjective** (user-defined) — tags, scores, free-text notes, and **frames**: custom axes the user defines (e.g. "UK-focused?", "team-building scope?", "policy vs product-GTM weight?") and rates each company on. The killer feature is that frames can be *added later* and applied retrospectively, so the user can re-rank as their thinking evolves.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + TS | Server actions cut API boilerplate; modern React features |
| Styling | Tailwind v4 + shadcn/ui | Fast, looks designed, easy to theme |
| DB | Postgres (Neon, eu-west-2) | Free tier, real Postgres, low latency for UK user |
| ORM | Drizzle | TS-native, no magic, fast migrations |
| Auth | Magic link via Resend | Single-user, passwordless, low-friction |
| Hosting | Vercel | Native Next.js, cron jobs built in |
| Refresh | Vercel Cron (daily) | Background workers for jobs/publications/lobbying |
| Agent | Anthropic Claude with tool-calling | Querying DB, doing fresh research, refresh-on-demand |
| Jobs feed | Greenhouse / Lever / Ashby APIs | Cover most AI cos; scraper fallback |
| Content feed | RSS / sitemap + scraping | Blog + press releases |
| Lobbying | EU Transparency Register CSV + US LDA (OpenSecrets API) | Public, structured |

## Data model

Drizzle schema lives in `src/db/schema.ts`. High level:

- **`companies`** — name, hq, tier (1/2/3 priority), focus areas, public website
- **`roles`** — open positions tied to companies (title, location, url, source, posted_at)
- **`people`** — known policy team members per company (name, role, links — surfaced, not scraped)
- **`publications`** — blog posts, press releases, filings, papers (title, url, published_at, type, summary, topics[])
- **`lobbying_records`** — per company, jurisdiction (EU/US/UK), period, spend, topics
- **`tags`** + **`company_tags`** — user-managed labels
- **`frames`** + **`frame_scores`** — user's custom evaluation axes
- **`user_notes`** — free-text per company
- **`agent_runs`** — log of agent interactions for audit + retry

All "user layer" tables (tags, frames, scores, notes) are single-user for v0 — no `user_id` column needed yet.

## Pages

| Path | Purpose |
|---|---|
| `/` | Companies grid: sortable, filterable, tagged |
| `/companies/[slug]` | Company detail: overview, roles, team, publications, lobbying, notes/scores/frames |
| `/compare` | Side-by-side comparison on user's frames (pick 2–4 companies) |
| `/frames` | Manage frames (custom evaluation axes) |
| `/tags` | Manage tags |
| `/agent` | Chat with the in-app agent (tool-calling against DB) |
| `/digest` | (Optional) Daily digest of what changed across tracked companies |

## Pipelines

### Daily refresh (Vercel Cron, 06:00 UTC)

1. For each company, refresh roles from configured source (Greenhouse / Lever / Ashby / custom)
2. For each company, fetch new publications from RSS / sitemap, summarise with Claude (topics + 1-sentence takeaway)
3. Once per week (Mondays), refresh lobbying records (EU Transparency Register diff, US LDA quarterly when in cycle)
4. Surface "what's new" in a daily digest record

### On-demand (agent triggered)

- Refresh a single company
- Discover new companies similar to a target set
- Deep-dive on a topic across companies (e.g. "what has each said about voice cloning consent in the last 90 days?")

## Build order

### v0.1 — Walking skeleton (Day 1)

- [x] Repo + Next.js scaffold
- [x] Branded home page
- [ ] Drizzle schema + first migration on Neon
- [ ] Seed script with research-run output
- [ ] Companies grid (real data)
- [ ] Company detail page (real data)
- [ ] Auth (shared password env var to start; magic link in v0.2)
- [ ] Deploy to Vercel

### v0.2 — Subjective layer (Day 2)

- [ ] Tags CRUD
- [ ] Frames CRUD
- [ ] Frame scoring UI on company detail
- [ ] Notes (autosaving textarea per company)
- [ ] Comparison view
- [ ] Magic link auth (Resend)

### v0.3 — Live data (Day 2–3)

- [ ] Greenhouse/Lever/Ashby clients
- [ ] RSS/sitemap fetcher + Claude summariser
- [ ] Daily cron worker
- [ ] "Refresh now" button per company

### v0.4 — Lobbying + agent (Day 3)

- [ ] EU Transparency Register import (one-off + monthly diff)
- [ ] US LDA import via OpenSecrets API
- [ ] Agent chat page (Claude with tool-calling against DB + web search)
- [ ] Polish, performance pass

### v0.5 — Handoff (Day 4)

- [ ] README pass with screenshots
- [ ] Production checks: backups, error monitoring, rate limits
- [ ] Invite end user as collaborator

### v0.6 — Personalised fit notes (optional)

A per-company "fit notes" panel: given a stored user profile (background, interests, past work), generate a specific, grounded note on why this company is or isn't a good match for the user. Cited against the user's actual background and the company's actual recent moves.

- [ ] `user_profile` table (single row) + admin UI to edit
- [ ] `fit_notes` table cached per (company, profile-version)
- [ ] Claude prompt that crosses profile + company context with strict grounding instructions
- [ ] UI panel on company detail page, behind a feature flag
- [ ] Regeneration on profile change or company refresh

## Open questions

- How deep on lobbying? Tier 1 (EU + US LDA) confirmed for v0.4. Tier 2 (NIST/OSTP/OFCOM filings) deferred unless time allows.
- Comparison view: tabular (rows = frames, cols = companies) or radar chart? Probably both — table primary, chart toggle.
- Agent permissions: read-only against DB to start. Write actions (add tag, score frame) added once read-only works and we trust the model not to over-eagerly tag things.

## Risks / mitigations

- **Scraper brittleness** — careers pages change. Mitigation: prefer APIs (Greenhouse/Lever/Ashby) where possible, log scraper failures clearly, never silently drop a company from "active roles" — show "data stale" state instead.
- **LLM hallucination on policy summaries** — Claude could invent a stance. Mitigation: every summary stores the source URL and the raw extracted text; UI links straight to source so the user can verify.
- **Cron job timeouts on Vercel** — daily refresh across 15+ companies may exceed 60s. Mitigation: parallelise within the function, and split into per-company queue (Vercel Queues or simple cron-per-batch) if needed.
- **Lobbying data freshness** — US LDA is quarterly, EU is rolling. Mitigation: surface "last updated" prominently so the user doesn't read stale data as current.
