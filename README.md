# 🐱 lobbycat

Lobbycat is a live-scoring, agents-based engine for London's AI policy field. You share what you care about and it ranks the organizations against the frames you've articulated and weighted. 

- **Set the lens.** First sign-in walks through a six-step wizard:
  who you are right now, what you're exploring, the frames that matter
  to you, the *weight* you'd give each (Must / Should / Could), and a
  couple of open-text prompts Lobbycat reads when scoring. Once you're done,
  Lobbycat will score the list of companies for you. 
- **Explore the field.** The dashboard is a stacked list of company
  cards, sorted by your weighted aggregate. Each card carries an
  evidence summary, a fit-note grounded in *your* wizard answers, and a
  one-click expansion into the per-company page. A filter + sort
  toolbar sits at the top.
- **Decide.** The fit-note on each card is the decision surface. It's
  what the cat thinks about *this company × you*. Make note of your 
  agreements or disagreements.

### The six frames

The engine runs on six editorial frames — 1–5 scales with named poles.
You can edit these in the Frames section of the menu. 

1. **Geographic remit** — UK-only ↔ Multi-jurisdiction.
2. **Policy area scope** — Single-issue specialist ↔ Broad multi-domain.
3. **Stage of company** — Pre-product ↔ Established.
4. **Policy posture** — Frontier-defining ↔ Compliance-maintaining.
5. **Working style** — Writing-led ↔ Government affairs-led.
6. **Team style** — Set the frontier ↔ Execute the playbook.

Editing a definition or a weight triggers a background re-score; the
field re-sorts when the new scores land.

### How the scoring works

- **Weights** — each frame carries a **Must (×3) / Should (×2) / Could (×1)** weight. Editing a weight is instant — client-side recompute, no LLM call.
- **Scores + fit-notes** — each (company × frame) cell carries a decimal score (1.0–5.0), a stored rationale, and evidence citations. Fit-notes are grounded in your wizard answers and refresh when evidence lands, when you edit a frame, or when you change something about yourself in About.

The aggregate is a weighted mean across all frames, displayed as a single
decimal ("4.2 / 5"). Stale-but-displayed beats hidden-while-recomputing.

### The dataset

Forty London organisations across three tiers (S/A/B). Editorial choice,
not coverage — real London presence + recognisable AI policy work. The
full memo is in `research/london-companies.md`; the seed data is in
`src/db/seed-data.ts`. There is no automated ingestion of the company
list itself. Evidence beneath each company is pulled by the data pipelines.

---

## Technical architecture

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript, Tailwind v4)
- [Neon](https://neon.tech/) (Postgres) via Drizzle ORM
- [Anthropic API](https://www.anthropic.com/) for scoring, fit-notes, and clarify sessions
- [Vercel](https://vercel.com/) for hosting (cron + background work via `after()`)

**Key paths:**

```
src/styles/globals.css         design tokens (vaporwave palette, type, motion)
src/db/schema.ts               schema (companies, frames, frame_scores, user_profile, clarify_sessions, clarify_messages, …)
src/db/seed-data.ts            the curated London set
src/lib/scoring/               the live scoring engine
src/lib/fit-notes/             fit-note generation grounded in wizard answers
src/lib/ats/                   ATS feed adapters (Greenhouse / Lever / Ashby)
src/lib/rss/                   RSS publication ingestion
src/lib/eu-transparency/       EU Transparency Register matcher
src/lib/consultations/         consultation submissions evidence pipeline
src/lib/safety-frameworks/     safety frameworks evidence pipeline
src/app/wizard/                the six-step onboarding wizard
src/app/companies/[slug]/      per-company dive-deep page
src/app/frames/                frame definitions + weight editor
src/app/about/                 profile editor (mirrors wizard fields)
src/app/api/cron/              Vercel cron handlers for each pipeline
src/app/api/rescore-status/    "is the cat busy?" endpoint
src/components/loading-cat.tsx shared calm-cousin loading animation
skills/clarify/SKILL.md        the clarify skill (cat's interview move set)
skills/clarify/reference/      moves, voice, and worked examples for the skill
research/feed.json             Glyphie's research feed (diff source for welcome-back)
```

**Design:**
- [Orbitron](https://fonts.google.com/specimen/Orbitron) for display, [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) for data
- Calm-cousin vaporwave palette — cyan / magenta / void-purple on near-black
- Full tokens in `src/styles/globals.css`

## Data pipelines

Pipelines run on Vercel cron, populating evidence *under* the curated
company list without expanding the list itself:

- **ATS feeds** — pulls each company's `rolesSource` (Greenhouse / Lever / Ashby) and refreshes the `roles` table; closes any role that disappears from the feed.
- **RSS ingestion** — pulls each company's blog/press feeds, summarises new items, upserts into `publications`.
- **EU Transparency Register** — pulls the EU lobbying CSV, matches against the seed company set, upserts into `lobbying_records`.
- **Consultation submissions** — pulls curated UK/EU consultation responses and matches them to companies.
- **Safety frameworks** — pulls hand-curated safety / responsible scaling / RAI policy frameworks per company.

Each pipeline is idempotent and per-source failure-tolerant. When new evidence lands, the scoring engine re-scores affected cells in the background and any grounded fit-note re-generates.

**Glyphie** (a sibling research agent) also writes a free-form feed of *what changed in the AI policy field this week* into `research/feed.json`. The dashboard's welcome-back card reads from there.

## Running locally

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL, ANTHROPIC_API_KEY
npm run db:push                   # apply schema
npm run db:seed                   # seed the London set + frames
npm run dev                       # http://localhost:3000
```

The gate password lives in a private handoff document. The unlock cookie
keeps the surface unindexed behind a low-stakes ritual gate.

## Operations

**Health check** — `GET /api/health` returns liveness + DB reachability as JSON (`status`, `dbLatencyMs`, `version`, `checkedAt`). `200` when healthy, `503` when DB is unreachable. `Cache-Control: no-store`.

**Smoke tests** — every PR gets a Vercel preview deploy and a Playwright smoke run (`.github/workflows/preview-smoke.yml`). Tests cover login, the main routes, and the health endpoint. Run locally:

```sh
npx playwright install chromium
PREVIEW_URL=https://lobbycat.vercel.app \
  TEST_LOBBYCAT_PASSWORD='<password>' \
  npm run test:smoke
```

Required repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `TEST_LOBBYCAT_PASSWORD`.
