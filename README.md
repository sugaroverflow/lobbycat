# 🐱 lobbycat

**A curated map of London's AI-policy companies, organised across six frames, to help you explore where you might want to do AI policy work.**

This isn't a job board. It isn't a directory. It's a small, hand-edited
map — about forty organisations in London that do AI policy in some
load-bearing way — built so you can read the field as a field, see where
each company sits along the dimensions that actually differ between them,
and use that as the starting point for a conversation about where to point
next.

---

## What it's for

You can use lobbycat for three things, roughly in this order:

- **Scout.** "Who actually does AI policy in London? Who's on the map I
  hadn't named yet? Where's the field tighter than I thought, and where is
  it wider?" The Map view is shaped for this — pick any two of the six
  frames as axes and watch the field rearrange.
- **Calibrate.** "Where do I think each of these companies sits, and does
  my read agree with the editorial read in here?" Every (company × frame)
  cell has a score and (eventually) a one-sentence rationale; reading them
  side by side is where calibration happens.
- **Prep.** "I've got a conversation with one of these orgs coming up.
  What do I need to know walking in?" The Compare view puts two to four
  companies side-by-side with all six frames, fit-notes, recent
  publications, and open roles — the surface to read against the night
  before a meeting.

These are the only three things v0.5 is for. Notably absent on purpose:
warm intros, applying through the app, a CRM for tracking outreach, a
recommendation engine that ranks the "best" company for you. Lobbycat is
editorial-first; the rankings happen inside your head, after reading.

## The six frames

The product is organised around six editorial frames — 1–5 scales with
named poles. They're directional, not moral: which end is interesting
depends on what you're looking for that day.

1. **Geographic remit** — UK-only policy remit ↔ Multi-jurisdiction policy
   remit. What the company's policy work *covers*, not where it sits.
2. **Policy area scope** — Single-issue specialist ↔ Broad multi-domain.
3. **Stage of company** — Pre-product ↔ Established. Not a quality
   signal — the *kind* of work differs sharply by stage.
4. **Policy posture** — Frontier-defining ↔ Compliance-maintaining. The
   frame that most often changes a read on a company.
5. **Working style** — Writing-led ↔ Government affairs-led. A
   personal-fit frame; you can do either, you have a preference.
6. **Team style** — Set the frontier ↔ Execute the playbook. Distinct from
   policy posture; this one's about what a Monday morning feels like.

The frames are the load-bearing concept. Every primary surface in lobbycat
puts a frame between you and a company.

## The surfaces

- **Map** is the home view. A 2D plot of every London company on two
  frames you choose. Hover a dot to preview, click to pin; the drawer
  below the plot is the deeper read.
- **Compare** is the side-by-side view. Two to four companies in adjacent
  columns, all six frames, fit-notes, open roles, recent publications.
- **Frames** is the canonical place to read what the six frames mean and
  to re-weight how heavily each contributes to the implicit fit-rank.
- **About** is the personal-state surface: profile, weights, concerns,
  cookie-clearing.

There's a **Surprise me** button on the Map. One pick per click, with a
frame-shaped reason ("sits close to *X* on this view, but a 1 on team
style"). Three variants: Adjacency, Recency, Underrated. It's a moment,
not a section — closing the modal returns you to the Map untouched.

## The dataset

Forty London organisations across three tiers (S/A/B). Editorial choice,
not coverage. The set is curated against two criteria:

1. Real London presence — HQ, material office, or UK research/think-tank
   footprint that lives mostly here.
2. Recognisable AI policy work — policy roles, position papers,
   consultation responses, regulatory engagement.

The full memo is in `research/london-companies.md`. The seed data is in
`src/db/seed-data.ts`. Every entry is hand-edited; there is no automated
ingestion of the company list itself (the *publications* and *roles*
beneath each company are pulled by the data pipelines — see below).

## The cat

The cat is a small character that lives in three places: the onboarding
comic strip (where it explains the product), the About page (where it
proposes diffs to your profile based on a paragraph you type), and the
Surprise modal (where its voice is the voice of the editorial reasons).
It is not a chatbot. It is not a mascot in the corner of every screen.
Its voice is reserved for the moments where editorial voice *is* the
product.

## Architecture (short)

```
Next.js 16 (App Router, TypeScript, Tailwind v4)
  ↳ Neon (Postgres) via Drizzle ORM
  ↳ Anthropic API for editorial actions (Haiku for short calls)
  ↳ Vercel for hosting

src/styles/machine.css         the design tokens (palette, type, motion)
src/db/schema.ts               the schema
src/db/seed-data.ts            the curated London set (editorial source)
src/db/seed.ts                 the idempotent seeder
src/lib/ats/                   ATS feed adapters (Greenhouse / Lever / Ashby)
src/lib/rss/                   RSS publication ingestion
src/lib/eu-transparency/       EU Transparency Register matcher
src/app/api/cron/              Vercel cron handlers for each pipeline
src/app/                       the App Router surfaces
docs/CONCEPT-v0.5.md           the editorial sign-off doc (read this first)
docs/journal/                  the running build journal
docs/ASSUMPTIONS-v0.5.md       overnight-build assumptions log
research/london-companies.md   the editorial memo behind the v0.5 seed
```

## The data pipelines

Three pipelines run on Vercel cron, populating data *under* the curated
company list without expanding the list itself:

- **ATS feeds** (`/api/cron/ats-feeds`, daily 06:00 UTC) — pulls each
  company's `rolesSource` (Greenhouse / Lever / Ashby) and refreshes the
  `roles` table; closes any role that disappears from the feed.
- **RSS ingestion** (`/api/cron/rss-ingestion`, daily 06:30 UTC) — pulls
  each company's `blogRssUrl` / `pressRssUrl`, summarises new items with
  Claude Haiku, upserts into `publications`.
- **EU Transparency Register** (`/api/cron/eu-lobbying`, daily 07:00 UTC)
  — pulls the EU lobbying CSV, matches against the seed company set,
  upserts into `lobbying_records`.

Each pipeline is idempotent, per-source failure-tolerant, and runs against
the *existing* curated list — they never add companies.

## Running it

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL, ANTHROPIC_API_KEY
npm run db:push                   # apply schema
npm run db:seed                   # seed the London set + frames
npm run dev                       # http://localhost:3000
```

The gate password is in a private handoff document, not in the repo. The
[password] cookie (`lc_v05_unlocked`) is what keeps the surface unindexed
behind a low-stakes ritual gate.

## Status

**v0.5 — overnight build (2026-06-19 → 06-20).** Concept doc signed off.
Visual tokens (Machine) live. London dataset live. Reference render at
`/machine-test`. Step 4 full rebuild (comic onboarding, Surprise modal,
chat panel migration, inline fit-note editor) is in progress. See
`docs/journal/` for the running log and `docs/ASSUMPTIONS-v0.5.md` for
the in-flight decisions taken without pausing for sign-off.

## How to use it

A short note for the person this is for:

The Map opens at *Policy posture* × *Working style* by default — those
are the two frames most likely to surface the difference between two
companies that look superficially similar. Try them. Then swap one axis
out (try *Geographic remit* and watch the field stretch). Click any dot
to pin it; the drawer below is the deeper read.

When you don't know where to look, hit **Surprise me**. The reason will
either land — "yes, that's interesting" — or it'll be wrong, and the
*wrong* picks tell you something about how you actually weight the
frames. Either way is useful.

The Compare view is for after you have a shortlist. The Frames view is
where you go to read what each frame *means* (the prose is editorial; if
your read of a frame is different, edit it on Frames and the whole
surface re-reads itself).

About is where your concerns and weights live. Edit them whenever your
thinking shifts; the cat will offer to translate a paragraph from you
into specific diffs and you can accept or reject each one.

That's it. There's nothing hidden, no recommendation algorithm in the
background, no "fit score" trying to rank anything for you. Just the
field, the lens, and a small cat that brings you a pick when you ask.

— Lotus 🪷
