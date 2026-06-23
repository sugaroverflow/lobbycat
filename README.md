# 🐱 lobbycat

**Lobbycat is a live scoring engine: tell it what you care about, and it
ranks London's AI policy companies for you to explore, dive deep, and make
decisions.**

It isn't a job board. It isn't a directory. It's a small, hand-edited
engine — about forty organisations in London that do AI policy in some
load-bearing way — built around six editorial frames you can re-weight
on the fly. Move a weight, the field re-sorts. Edit what a frame *means*,
the cat re-reads every company.

---

## What it's for

Three modes, roughly in this order:

- **Explore.** Scan the ranked table with your current weights in hand.
  "Who comes up high if I care a lot about working style and not much
  about geographic remit? What changes when I flip that?"
- **Dive deep.** Click any cell, read the rationale and evidence. Every
  (company × frame) score is a number, a paragraph of reasoning, and a
  short citation list grounded in real artefacts (consultation responses,
  safety frameworks, publications, roles, lobbying records).
- **Decide.** Pull two to five companies into Compare, swing the weights
  inside that sandbox without touching your global profile, and see which
  ones move and which stay put. That's the surface to read against the
  night before a meeting.

There is also a **Surprise me** button. One pick per click, with a
frame-shaped reason. It's a moment, not a section.

## The six frames

The engine runs on six editorial frames — 1–5 scales with named poles.
They're directional, not moral: which end is interesting depends on what
you're looking for that day.

1. **Geographic remit** — UK-only ↔ Multi-jurisdiction. What the company's
   policy work *covers*, not where it sits.
2. **Policy area scope** — Single-issue specialist ↔ Broad multi-domain.
3. **Stage of company** — Pre-product ↔ Established. Not a quality
   signal — the *kind* of work differs sharply by stage.
4. **Policy posture** — Frontier-defining ↔ Compliance-maintaining. The
   frame that most often changes a read on a company.
5. **Working style** — Writing-led ↔ Government affairs-led. A
   personal-fit frame; you can do either, you have a preference.
6. **Team style** — Set the frontier ↔ Execute the playbook. Distinct
   from policy posture; this one's about what a Monday morning feels like.

The frames are editable. Renaming a pole, sharpening a description, or
rewriting what a frame even *means* triggers a background re-score across
every company on that frame. A small pixel cat appears while the re-score
is in flight and disappears when the field is fresh again.

## How the scoring works

Two things move:

- **Weights** — each frame carries a user weight: **low (×1)**,
  **medium (×2)**, **high (×3)**. Defaults to medium across the board.
  Editing a weight is instant — no LLM call, just a client-side recompute
  and a re-sort.
- **Scores** — each (company × frame) cell carries a decimal score on a
  1.0–5.0 scale, a stored rationale, and a list of evidence citations.
  Scores are LLM-produced from real artefacts; they refresh in the
  background when evidence lands or a frame definition changes.

The aggregate is a weighted mean across the six frames, displayed as a
single decimal to one place ("4.2 / 5"). Sortable. Visible in the table.
No tiers, no badges. It's "what you said matters to you, applied to the
field" — not "the objectively best company."

Every score carries an as-of timestamp. Stale-but-displayed beats
hidden-while-recomputing.

## The dataset

Forty London organisations across three tiers (S/A/B). Editorial choice,
not coverage. The set is curated against two criteria:

1. Real London presence — HQ, material office, or UK research/think-tank
   footprint that lives mostly here.
2. Recognisable AI policy work — policy roles, position papers,
   consultation responses, regulatory engagement.

The full memo is in `research/london-companies.md`. The seed data is in
`src/db/seed-data.ts`. Every entry is hand-edited; there is no automated
ingestion of the company list itself. The *evidence* beneath each
company — publications, roles, lobbying records, consultation
submissions, safety frameworks — is pulled by the data pipelines.

## The surfaces

- **Table** is the home view. Every company on every frame, sortable by
  the weighted aggregate (or any individual frame). Cells expand to
  reveal rationale + citations.
- **Company** is the dive-deep page. Fit-note, all six frame cells with
  full rationale, per-company notes, recent publications, open roles,
  consultation submissions, safety frameworks.
- **Compare** is the decision sandbox. Two to five companies in adjacent
  columns; an alt-weights panel that re-ranks only inside the sandbox.
- **Frames** is the editorial surface. Read and edit what each frame
  means; edits trigger background re-scoring.
- **About** is the personal-state surface: profile, weights, concerns.

## Architecture (short)

```
Next.js 16 (App Router, TypeScript, Tailwind v4)
  ↳ Neon (Postgres) via Drizzle ORM
  ↳ Anthropic API for scoring + editorial actions
  ↳ Vercel for hosting (cron + background scoring via after())

src/styles/machine.css         the design tokens (palette, type, motion)
src/db/schema.ts               schema (companies, frames, frame_scores, …)
src/db/seed-data.ts            the curated London set (editorial source)
src/lib/scoring/               the live scoring engine
src/lib/ats/                   ATS feed adapters (Greenhouse / Lever / Ashby)
src/lib/rss/                   RSS publication ingestion
src/lib/eu-transparency/       EU Transparency Register matcher
src/lib/consultations/         consultation submissions evidence pipeline
src/lib/safety-frameworks/     safety frameworks evidence pipeline
src/app/api/cron/              Vercel cron handlers for each pipeline
src/app/api/rescore-status/    "is the cat busy?" endpoint
src/app/                       the App Router surfaces
docs/REFACTOR-v0.6.md          the v0.6 sign-off doc (read this first)
docs/journal/                  the running build journal
docs/ASSUMPTIONS-v0.6.md       in-flight decisions log
research/london-companies.md   the editorial memo behind the seed
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
against the *existing* curated list — they never add companies. When a
pipeline lands new evidence, the scoring engine re-scores affected cells
in the background.

## Running it

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL, ANTHROPIC_API_KEY
npm run db:push                   # apply schema (or scripts/apply-migrations.ts)
npm run db:seed                   # seed the London set + frames
npm run dev                       # http://localhost:3000
```

The gate password lives in a private handoff document, not in the repo.
The unlock cookie keeps the surface unindexed behind a low-stakes ritual
gate.

## Status

**v0.6 — live scoring engine (2026-06-23).** Concept signed off. Step 1
through Step 13 landed: schema + weights, the ranked table, dive-deep
company pages, the Compare sandbox, Surprise, per-company notes, the
consultations + safety-frameworks evidence pipelines, auto-rescore on
frame edit with the animated cat, onboarding rewrite, and a full
re-curation pass across 40 × 6 = 240 cells (zero fallbacks, real
citations on every cell that had evidence to cite). See `docs/journal/`
for the running log and `docs/ASSUMPTIONS-v0.6.md` for the in-flight
decisions taken without pausing for sign-off.

## How to use it

A short note for the person this is for:

Open the table. The default weights are medium across the board, which
is the field as it stands without any opinion from you. Now pick the
frame you actually care about most and click it up to **high**. Watch
the table re-sort. Pick the frame you care about least and click it
down to **low**. Watch the table re-sort again. That motion — the field
rearranging because *you* said something — is the product.

When a cell catches your eye, click it. The rationale is a paragraph of
real editorial reasoning, with citations to artefacts you can read
yourself. If you disagree with the read, that disagreement is the
useful thing; it tells you something about how you actually weight the
frame.

When you don't know where to look, hit **Surprise me**. The reason will
either land or it won't — and the *wrong* picks tell you something too.

The Compare view is for after you have a shortlist. The alt-weights
sandbox there lets you swing the field one more time without committing
to it globally.

That's it. There's nothing hidden, no second algorithm in the
background. Just the field, the lens you chose, and a small cat that's
re-reading every time you change your mind.

— made with love 🪷
