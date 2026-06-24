# 🐱 lobbycat

**Lobbycat is a live scoring engine for London's AI policy field. You tell
it what you care about; it ranks ~40 organisations against the six frames
*you* picked, weighted the way *you* weighted them, and it re-reads the
field every time you change your mind.**

It isn't a job board. It isn't a directory. It's a small, hand-edited
engine wrapped in a vaporwave coat — onboarding-first, opinionated, and
honest about the fact that the *lens* (the frames, the weights, the
words you used to describe your situation) is doing most of the work.
Move a weight, the dashboard re-sorts. Edit what a frame *means*, the
cat re-reads every company on that frame. Tell the cat a new thing about
yourself in About, every fit-note re-grounds.

---

## What it's for

Three things, in this order:

- **Set the lens.** First sign-in walks through a six-step wizard:
  who you are right now, what you're exploring, the frames that matter
  to you, the *weight* you'd give each (Must / Should / Could), and a
  couple of open-text prompts the cat reads when scoring. Step six is
  a full-screen vaporwave-theatre moment where lobbycat scores the
  whole field live against your answers.
- **Explore the field.** The dashboard is a stacked list of company
  cards, sorted by your weighted aggregate. Each card carries an
  evidence summary, a fit-note grounded in *your* wizard answers, and a
  one-click expansion into the per-company page. A filter + sort
  toolbar sits at the top — sort by overall score / individual frame /
  recency, filter by hiring / fit-note / tier / HQ.
- **Decide.** The fit-note on each card is the decision surface. It's
  what the cat thinks about *this company × you* — not a marketing
  blurb, not a generic write-up. Disagree with one and that
  disagreement is the useful thing.

There is also a **Surprise me** button. Vaporwave-theatre modal, one
pick per click, with a frame-shaped reason and a paragraph the cat
wrote just now. It's a moment, not a section.

## The six frames

The engine runs on six editorial frames — 1–5 scales with named poles.
They're directional, not moral: which end is "good" depends entirely on
what you're looking for that day.

1. **Geographic remit** — UK-only ↔ Multi-jurisdiction.
2. **Policy area scope** — Single-issue specialist ↔ Broad multi-domain.
3. **Stage of company** — Pre-product ↔ Established.
4. **Policy posture** — Frontier-defining ↔ Compliance-maintaining.
5. **Working style** — Writing-led ↔ Government affairs-led.
6. **Team style** — Set the frontier ↔ Execute the playbook.

The frames page has two halves: **What you care about** (the
definitions — editable, with a "Ask lobbycat for frame ideas" affordance
that proposes 2–3 new frames you might want to add) and **Weighing what
you care about** (every frame, Must / Should / Could). Editing a
definition or a weight triggers a background re-score with the cat
animation; the field re-sorts when the new scores land.

## How the scoring works

Two things move:

- **Weights** — each frame carries a **Must (×3) / Should (×2) /
  Could (×1)** weight. Editing a weight is instant — client-side
  recompute, no LLM call, dashboard re-sorts.
- **Scores + fit-notes** — each (company × frame) cell carries a
  decimal score on a 1.0–5.0 scale, a stored rationale, and a list of
  evidence citations. Each company also carries a **fit-note** grounded
  in your wizard answers (current role one-liner, what you're
  exploring, location preferences, open-text answers). Both are
  LLM-produced from real artefacts and refresh in the background when
  evidence lands, when you edit a frame, or when you change a wizard
  answer in About.

The aggregate is a weighted mean across the six frames, displayed as a
single decimal to one place ("4.2 / 5"). Sortable. No tiers, no badges.
It's "what you said matters to you, applied to the field" — not "the
objectively best company."

Every score and every fit-note carries an as-of timestamp.
Stale-but-displayed beats hidden-while-recomputing.

## The dataset

Forty London organisations across three tiers (S/A/B). Editorial choice,
not coverage. Two criteria:

1. Real London presence — HQ, material office, or UK research/think-tank
   footprint that lives mostly here.
2. Recognisable AI policy work — policy roles, position papers,
   consultation responses, regulatory engagement.

The full memo is in `research/london-companies.md`. The seed data is in
`src/db/seed-data.ts`. Every entry is hand-edited; there is no automated
ingestion of the company list itself. The *evidence* beneath each
company — publications, roles, lobbying records, consultation
submissions, safety frameworks — is pulled by the data pipelines and
fed into both the scoring and the fit-notes.

## The surfaces (v0.7)

- **`/wizard`** — six-step onboarding (welcome → role one-liner →
  exploring → location prefs → frame weights → open-text → vaporwave
  scoring takeover). Autosaves per step; resumes if abandoned.
- **`/` (dashboard)** — stacked company cards sorted by weighted
  aggregate. Top-3 frame cells visible per card; "show more" reveals
  the rest. Filter + sort toolbar at the top. A welcome-back card
  above the list shows research-feed diffs since your last visit.
- **`/companies/[slug]`** — dive-deep page. Fit-note, all six frame
  cells with full rationale, per-company notes, publications, open
  roles, consultation submissions, safety frameworks.
- **`/frames`** — definitions (editable, with "Ask lobbycat for frame
  ideas") + Must/Should/Could weights.
- **`/about`** — edit-in-place on every wizard field. A "replay
  onboarding" link relaunches the wizard from step 1.

The **Compare sandbox** from v0.6 is gone. The wizard + the fit-note
on every card carries the decision weight now.

## The look (vaporwave, calm cousin)

v0.7 swaps the v0.6 earthcore palette for a calm-cousin vaporwave
system: cyan / magenta / void-purple on a near-black ground, Orbitron
for display, Share Tech Mono for code, perspective grid + sunset
gradient on the onboarding hero and the scoring takeover. The pixel
cat survives — same sprite, new halo.

The full design tokens live in `src/styles/globals.css`.

## Architecture (short)

```
Next.js 16 (App Router, TypeScript, Tailwind v4)
  ↳ Neon (Postgres) via Drizzle ORM (@neondatabase/serverless HTTP)
  ↳ Anthropic API for scoring + fit-notes + editorial actions
  ↳ Vercel for hosting (cron + background work via after())

src/styles/globals.css         design tokens (vaporwave palette, type, motion)
src/db/schema.ts               schema (companies, frames, frame_scores, user_profile, …)
src/db/seed-data.ts            the curated London set
src/lib/scoring/               the live scoring engine
src/lib/fit-notes/             fit-note generation grounded in wizard answers
src/lib/ats/                   ATS feed adapters (Greenhouse / Lever / Ashby)
src/lib/rss/                   RSS publication ingestion
src/lib/eu-transparency/       EU Transparency Register matcher
src/lib/consultations/         consultation submissions evidence pipeline
src/lib/safety-frameworks/     safety frameworks evidence pipeline
src/app/wizard/                the six-step onboarding wizard
src/app/api/cron/              Vercel cron handlers for each pipeline
src/app/api/rescore-status/    "is the cat busy?" endpoint
src/app/                       the App Router surfaces
src/components/loading-cat.tsx shared calm-cousin loading animation
research/feed.json             Glyphie's research feed (diff source for welcome-back)
docs/REFACTOR-v0.7.md          the v0.7 sign-off doc
docs/journal/                  the running build journal
docs/ASSUMPTIONS-v0.7.md       in-flight decisions log
```

## The data pipelines

Pipelines run on Vercel cron, populating evidence *under* the curated
company list without expanding the list itself:

- **ATS feeds** — pulls each company's `rolesSource` (Greenhouse / Lever
  / Ashby) and refreshes the `roles` table; closes any role that
  disappears from the feed.
- **RSS ingestion** — pulls each company's blog/press feeds, summarises
  new items, upserts into `publications`.
- **EU Transparency Register** — pulls the EU lobbying CSV, matches
  against the seed company set, upserts into `lobbying_records`.
- **Consultation submissions** — pulls curated UK/EU consultation
  responses and matches them to companies.
- **Safety frameworks** — pulls hand-curated safety / responsible
  scaling / RAI policy frameworks per company.

Each pipeline is idempotent, per-source failure-tolerant, and runs
against the *existing* curated list. When a pipeline lands new evidence,
the scoring engine re-scores affected cells in the background and any
fit-note grounded in that evidence re-generates.

Alongside the structured pipelines, **Glyphie** (a sibling research
agent) writes a free-form feed of *what changed in the AI policy field
this week* into `research/feed.json`. The dashboard's welcome-back card
reads from there.

## Running it

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL, ANTHROPIC_API_KEY
npm run db:push                   # apply schema
npm run db:seed                   # seed the London set + frames
npm run dev                       # http://localhost:3000
```

The gate password lives in a private handoff document, not in the repo.
The unlock cookie keeps the surface unindexed behind a low-stakes ritual
gate.

## Status

**v0.7 — onboarding-first vaporwave engine (2026-06-23).** Concept
signed off. Steps 1 through 15 landed: schema migrations for wizard
state, vaporwave token system (calm cousin) with Orbitron +
Share Tech Mono, the six-step `/wizard` route with autosave + the
step-6 scoring takeover, dashboard cards with stacked-list + top-3
visible / show-more reveals, filter + sort toolbar, welcome-back card
reading `research/feed.json`, frames page redesign with
Must/Should/Could + "Ask lobbycat for frame ideas", surprise modal
vaporwave-theatre reskin, About page mirroring the wizard fields with
edit-in-place + replay-onboarding, sweep of `/compare` + driver.js
coachmark + Machine swatch page + other v0.4/v0.5 residue, and shared
loading-cat animation wired into fit-note + surprise with cycling
quotes. See `docs/journal/` for the running log and
`docs/ASSUMPTIONS-v0.7.md` for the in-flight decisions taken without
pausing for sign-off.

## How to use it

A short note for the person this is for:

Open `/wizard`. Six steps, about five minutes. Tell it who you are
right now, what you're poking at, where you'd live, and which frames
you actually care about. The last step is theatre — let it run; it's
the cat reading every company against what you just said.

You'll land on the dashboard with the field already sorted for you.
Scan the top three cards. Read the fit-notes; they're written *to you*,
grounded in what you typed in the wizard. If one lands, click into the
company page. If one feels wrong, that's the more useful signal — it
means something about how you actually weight a frame.

Edit a weight on `/frames` (Must / Should / Could) and watch the
dashboard re-sort. Edit a frame *definition* and watch the cat
re-read every company on that frame. Change something about yourself
on `/about` and every fit-note re-grounds.

When you don't know where to look, hit **Surprise me**. The reason will
either land or it won't — and the *wrong* picks tell you something too.

That's it. There's nothing hidden, no second algorithm in the
background. Just the field, the lens you chose, and a small cat that's
re-reading every time you change your mind.

— made with love 🪷

## Operations

### Health check

`GET /api/health` is an unauthenticated liveness + DB reachability probe
intended for external uptime monitors (UptimeRobot, BetterStack, etc.).

It runs one cheap query against the `frames` table and returns JSON:

```json
{
  "status": "ok",
  "dbLatencyMs": 42,
  "version": "0.7.1",
  "checkedAt": "2026-06-24T16:45:00.000Z"
}
```

- `200` when `status === "ok"`
- `503` when `status === "down"` (DB unreachable / query failed; includes `errorClass`)
- `Cache-Control: no-store` so monitors get a fresh check every time

### Preview deploys + smoke tests

Every PR against `main` gets a Vercel preview deploy and a Playwright
smoke test run before it can be merged. See
`.github/workflows/preview-smoke.yml`.

Smoke tests live in `tests/smoke.spec.ts` and cover:

- `/login` renders the password prompt
- Login with `TEST_LOBBYCAT_PASSWORD` sets the `lc_auth` cookie
- `/`, `/wizard`, `/frames`, `/about` render without a `next-error`
- `/api/health` returns `200` with `{ status: "ok" }`

**Required repo secrets:**

- `VERCEL_TOKEN` — create at <https://vercel.com/account/tokens>, then
  `gh secret set VERCEL_TOKEN -b '<token>' -R sugaroverflow/lobbycat`
- `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — already set
- `TEST_LOBBYCAT_PASSWORD` — already set (matches `LOBBYCAT_PASSWORD`
  on the preview env)

The workflow degrades gracefully if `VERCEL_TOKEN` is missing: the
preview job logs a warning and the smoke job skips with a clear note,
so the PR check turns green instead of blocking work while the token
is being provisioned.

Run smoke tests locally against any URL:

```sh
npx playwright install chromium
PREVIEW_URL=https://lobbycat.vercel.app \
  TEST_LOBBYCAT_PASSWORD='<password>' \
  npm run test:smoke
```
