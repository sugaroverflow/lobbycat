# Lobbycat v0.6 — Refactor / scoping doc

**Status:** DRAFT — pending Fatima's sign-off
**Author:** Lotus 🪷 (in conversation with Fatima)
**Date opened:** 2026-06-23
**Supersedes:** v0.5 concept doc for the post-Map era; reuses v0.5's Machine visual system, London dataset, and per-company fit-notes

---

## What this doc is

A sign-off doc, not a feature ship. v0.5 shipped Machine, the London set, and the editorial scoring discipline. The Map carried the home page but did not earn it — sparse signal, awkward axis-picking, no real "what next" affordance.

v0.6 is a structural pivot: **the frames become the engine, not the IA**. Aadi tells lobbycat what he cares about (low/medium/high weights), and the system ranks every company for him with the cat's reasoning attached to each cell. The table replaces the Map. Compare becomes a weight sandbox. Surprise stays as the serendipity surface. Everything else is in service of those three.

Read end-to-end before any code lands. Sign-off in §11 turns §10 into the build plan.

---

## 1. Product, one sentence

> **Lobbycat is a live scoring engine: tell it what you care about, and it ranks London's AI policy companies for you to explore, dive deep, and make decisions.**

Unpacked, briefly:

- **Live scoring engine** — the frames aren't a reference doc, they're the input. Editing them re-runs the field.
- **Tell it what you care about** — the user expresses preference as low/medium/high weights across the six frames + edits frame definitions when they want to sharpen them.
- **Ranks London's AI policy companies** — aggregate score per company, sorted by default. Numerical (4.2 / 5), not "best-of" theatre. London-only dataset stays from v0.5.
- **Explore, dive deep, make decisions** — three verbs, three modes:
  - *Explore* = scan the ranked table, click into the why
  - *Dive deep* = open a company's detail page (fit-note, evidence, notes)
  - *Make decisions* = Compare 2–5 companies side-by-side with an alt-weights sandbox

Out of scope for v0.6, named so we don't drift: the Map (dies), the v0.5 free-text "next role" inference loop (replaced by per-company notes), magic-link auth, warm intros, an in-app general-purpose agent. The companion-agent idea from v0.5's follow-up still belongs in v0.7.

---

## 2. The scoring model

### 2.1 Weights — low / medium / high

Each of the six frames carries a user weight: **low (×1)**, **medium (×2)**, **high (×3)**. Three buckets, not a continuous slider — because Aadi reasons in "this matters / this matters a lot / this is the question," not "this matters 37%."

Weights live on `user_profile.frameWeights` as a `{ frameId: 'low' | 'medium' | 'high' }` map, defaulting to **medium** for all six.

### 2.2 Scores — 1.0 to 5.0 per frame, per company

Each (company × frame) cell carries a numeric score on a 1.0–5.0 scale, plus a stored rationale paragraph and a list of evidence citations. Scores are **LLM-produced** at ingestion time and on-demand. They are decimals (e.g. 3.7), not integers, because the underlying reasoning is rarely cleanly tier-aligned.

### 2.3 The aggregate — single number, "4.2 / 5"

Weighted mean across the six frames:

```
overall = Σ (weight_f × score_f) / Σ (weight_f)
```

Displayed as a single decimal to one place ("4.2 / 5"). Sortable. Visible in the table. No tiers, no badges, no theatre — Fatima's call.

Honest editorial note: v0.5 explicitly rejected an aggregate. v0.6 reverses that decision because the live-engine model *invites* ranking and pretending otherwise is dishonest. The frames being honestly weighted by the user makes the aggregate honest in turn — it's "what you said matters to you, applied to the field," not "the objectively best company."

### 2.4 The two re-score paths

> Per Fatima Q1: live = both.

| Trigger | Cost | Latency | Path |
|---|---|---|---|
| **User changes a weight** | $0, no LLM | instant | Client-side recompute of aggregates, re-sort |
| **User clicks "why this score?"** | ~$0.001, one LLM call | 2–5s | Stream a fresh rationale grounded in evidence; cache by (company, frame, profile-version, evidence-version) |
| **User edits a frame definition** | ~$0.01–0.05, one LLM call per company × frame | 30–60s | Background job re-scores affected cells; UI shows "rescoring" inline per cell with a cat line from `rescoring[]` |
| **Evidence corpus refreshes** (publication, role, lobbying record landed via cron) | $0.001 per affected (company, frame) | overnight | Incremental rescoring; user sees `welcomeBack` quote next visit |

**Important:** the user-visible scores never lie about freshness. Every score carries `scoredAt` and a tiny "as-of" timestamp on hover. Stale-but-displayed beats hidden-while-recomputing.

---

## 3. Information architecture

### 3.1 Global nav (4 slots)

| Slot | Path | Purpose |
|---|---|---|
| **Lobbycat** (wordmark, links home) | `/` | Welcome card + ranked table |
| **Compare** | `/compare` | Pick 2–5 companies, side-by-side with alt-weights sandbox |
| **Frames** | `/frames` | Edit frame definitions + weights; the "tune the lens" surface |
| **Surprise** | (button, opens modal) | Adjacency / Recency / Underrated — every surprise carries a reason |
| **About** | `/about` | Profile + per-company notes index + replay onboarding |

Three nav links (Compare, Frames, About) + the Surprise button + the wordmark. No `/companies` page (already killed in v0.5). No Map.

### 3.2 The home — welcome card + ranked table

**Welcome card** sits above the table on every load:

- Sized for one line on desktop, two on mobile
- Rotates one line from `welcomeBack[]` (e.g. *"the cat noticed three new policy papers since you were last in"*) — Fatima edits the JSON
- A small "what's new" sub-line when there's a real diff since last login (new role, new publication, score change > 0.3 on a top-3 company) — degrades gracefully to silence when nothing changed
- A small `Re-score now` button only when staleness > 7 days

**Ranked table** sits below:

- Rows: every company in the dataset (one row each, 70+ rows once expanded data PR merges)
- Columns: **Name**, **Overall** (sortable, default sort), **6 frame columns** (small score numbers), **Recent activity** (a tiny dot pattern showing the last 90 days of evidence — 1 dot per publication/role/filing, color-coded by type)
- Each frame column header shows the user's current weight (`L · M · H` indicator next to the name)
- Row click → opens the company detail page (existing v0.5 surface, lightly cleaned)
- Cell click → opens an inline expanded panel beneath the row with the rationale, the cited evidence, and a `Regenerate` action

### 3.3 Frames page — definitions + weights together

Single page, two clear blocks per frame:

- **Definition** (1–5 poles, descriptions, lowDescription/highDescription) — editable inline; saves on blur; saving a non-trivial change triggers background rescoring
- **Weight** (L / M / H segmented control) — saves instantly; recomputes aggregates in front of the user

A "reset to defaults" link at the bottom (per-frame and global). No removal of the six core frames; user-added frames are deferred to v0.7.

### 3.4 Compare — alt-weights sandbox

- Multi-select: 2–5 companies (chip-style picker at the top)
- Side-by-side columns showing each company's frame scores, cited rationales (collapsed by default), recent activity
- **Above the comparison:** a *floating weight panel* with the same L/M/H controls as the Frames page, but **scoped to this comparison** — changes don't touch the user's saved weights
- A small "matches your saved weights" / "differs from your saved weights" indicator so he doesn't lose track
- Aggregate row at the top (recomputed with the sandbox weights)

### 3.5 Surprise — modal, opened from nav button

Three variants, each with a reason attached, picked round-robin per session unless one variant has nothing fresh to offer:

- **Adjacency** — *"You scored Anthropic 4.8 on Frontier-defining. The cat noticed [Company X] writes about the same questions but with a different posture. Worth a glance."*
- **Recency** — *"[Company Y] published a consultation response last week that matches your top-weighted frame."*
- **Underrated** — *"You haven't opened [Company Z], but their lobbying register footprint is closest to your Working style weighting."*

Each variant produces a single recommendation per open; user can `Show me another` for up to 3 picks per session before the cat says it's tired. Cat lines from `surprisePreamble[]` introduce each pick.

### 3.6 What dies from v0.5

| v0.5 surface | v0.6 outcome | Why |
|---|---|---|
| **The Map** | Dies entirely | Sparse, awkward axes, no "what next" — Fatima's call |
| **Free-text "next role" intent on /about** | Dies | Replaced by per-company notes; the intent loop was a v0.4 build that never settled into the workflow |
| **Free-text intent → LLM weight inference** | Dies | Direct weight editing on Frames is clearer; the inference layer added latency without earning trust |
| **The S/A/B tier system** (if it shipped) | Subsumed by the numeric aggregate | Numbers sort cleanly; tiers were halfway theatre |

### 3.7 What survives but moves

| v0.5 surface | v0.6 fate |
|---|---|
| **Per-company fit-note** (cited bullets + chat thread) | Stays at `/companies/[slug]` as the deep-dive layer — invoked from "Dive deep" |
| **Per-company drawer** (inline-expanded row) | Moves to the home table's cell-expansion mechanic (lighter touch — just rationale + evidence + `Regenerate`) |
| **Frame CRUD** | Moves from `/frames` index to the same Frames page that holds weights — definitions + weights together |
| **Machine visual system + #1A3D2E + pixel cat** | Survives as-is — v0.6 is structural, not visual |
| **Onboarding (4-panel comic + candy-kittens-pink gate)** | Survives, with one panel update mentioning the engine model |
| **London dataset** | Survives, expands to ~70 companies via the open PR #5 |
| **Companion agent (v0.6 idea from v0.5 follow-up)** | **Slides to v0.7** — the live scoring engine is enough of a v0.6 lift |

---

## 4. Data model changes

### 4.1 New columns

```sql
ALTER TABLE user_profile
  ADD COLUMN frame_weights JSONB
    DEFAULT '{"1":"medium","2":"medium","3":"medium","4":"medium","5":"medium","6":"medium"}'::jsonb;

ALTER TABLE frame_scores
  ALTER COLUMN score TYPE NUMERIC(2,1);   -- 1.0 .. 5.0 with one decimal
ALTER TABLE frame_scores
  ADD COLUMN scored_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ADD COLUMN evidence_version TEXT,        -- hash of the evidence set used
  ADD COLUMN profile_version TIMESTAMPTZ;  -- the user_profile.updated_at at scoring time
```

### 4.2 New tables

```sql
CREATE TABLE frame_score_evidence (
  id           SERIAL PRIMARY KEY,
  company_id   INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  frame_id     INTEGER NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  evidence_kind TEXT NOT NULL,  -- 'publication' | 'role' | 'lobbying_record' | 'submission'
  evidence_id  INTEGER NOT NULL,  -- FK into the corresponding table
  weight       NUMERIC(2,1) NOT NULL DEFAULT 1.0,
  scored_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX frame_score_evidence_company_frame_idx
  ON frame_score_evidence(company_id, frame_id);

CREATE TABLE company_notes (
  id           SERIAL PRIMARY KEY,
  company_id   INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (company_id)
);
```

### 4.3 Drop or repurpose

- `user_profile.weights` (the v0.5 free-text-derived map of concerns) — keep the column but stop using it on the new surfaces. Removal in v0.7 once we're sure nothing reads from it.
- `next_role_intent` table (if it exists from v0.4 N2) — drop in v0.6's first migration.

### 4.4 Quotes file

Static JSON at `src/db/lobbycat-quotes.json`, four keys (`welcomeBack`, `rescoring`, `emptyState`, `surprisePreamble`), arrays of strings. Already drafted by the sub-agent (PR #6). Fatima edits in repo; deploys pick it up at build time. No DB migration needed.

---

## 5. Evidence ingestion plan (the cited-reasoning substrate)

From the research memo (`research/policy-evidence-types.md`). Five high-priority types ingested in this order:

### 5.1 Already shipped (carried over from v0.5)

1. **Named-author blog posts** — via RSS ingestion pipeline (PR #3, merged in v0.5)
2. **Open roles** — via ATS feeds (PR #1, merged in v0.5)
3. **EU lobbying register** — via Transparency Register matcher (PR #4, merged in v0.5)

### 5.2 New for v0.6

4. **Regulatory consultation submissions** — UK gov.uk consultations + EU Commission feedback portal + NIST RFIs. Look back 18 months. New pipeline at `src/app/api/cron/consultations/route.ts`, daily. New table `consultation_submissions(company_id, jurisdiction, consultation_title, submission_url, submitted_at, raw_text)`.

5. **Responsible Scaling Policies / Frontier Safety Frameworks / model cards** — frontier labs only (Anthropic, OpenAI, GDM, Meta, xAI, Mistral). Hand-curated initial pass (slow-moving documents, no daily churn). New table `safety_frameworks(company_id, framework_name, version, url, published_at, summary)`.

### 5.3 Deferred to v0.7

Parliamentary/congressional written evidence, podcast transcripts, academic publications. Each is a meaningful pipeline of its own.

### 5.4 Never ingest

Press releases (marketing), LinkedIn posts (ToS-hostile), Glassdoor/Blind (sentiment noise), news articles as company-posture evidence. Listed here so future-Lotus doesn't reinvent the wheel.

### 5.5 Citation surfacing

Every score's rationale paragraph names its citations inline with `[1]`, `[2]` markers. The expanded cell footer lists each citation as `[N] title (type, date)` linked to source URL. If no evidence exists for a (company × frame), the rationale says so plainly: *"the cat couldn't find recent evidence for this frame — the score is conservative."*

---

## 6. The scoring prompt — design notes

(Implementation-level; included here for sign-off scrutiny.)

Per (company, frame, evidence-corpus), the LLM is given:

- The frame definition (1–5 poles, descriptions)
- The company's name and one-paragraph public description
- Up to 12 most relevant evidence items, each as `{ kind, title, date, excerpt-up-to-300-words, source-url }`
- The user profile headline (so reasoning can be slightly user-shaped without theatre)

Output (structured):

```ts
{
  score: number,           // 1.0–5.0, one decimal
  confidence: 'low' | 'medium' | 'high',
  rationale: string,       // 2–4 sentences, inline [1][2] markers
  citationIndexes: number[] // indexes into the supplied evidence list
}
```

Model: **Sonnet** for first-time scoring (depth matters), **Haiku** for "regenerate" on user-edit (lighter, faster, cheap). Frame definition edits trigger Sonnet across the affected (company × frame) cells.

Rationale length capped at ~80 words. Rationales that don't cite at least one evidence item are flagged in `confidence: 'low'` and the UI shows a small "the cat is reasoning beyond the evidence here" annotation.

---

## 7. First-time experience (carries from v0.5, lightly amended)

The four-panel comic onboarding survives. One panel update:

- **Panel 3 (was: "Here's the Map")** → **"Here's how the cat ranks the field — by what *you* care about. Set your weights, edit the lenses, and the field rearranges."**

The candy-kittens-pink gate stays in place (Fatima's private handoff, not in repo).

After onboarding, the user lands on home: welcome card + table. First weights are all medium; first scores are pre-seeded (no spinner on first paint).

---

## 8. Lobbycat voice — sample quote lines

(Sub-agent draft at `src/db/lobbycat-quotes.json`, PR #6. Fatima edits.)

Voice principles:

- Dry, observational, third-person ("the cat noticed", not "I noticed")
- Slightly catty without being twee
- References policy work (papers, consultations, hiring) where natural, never forced
- Aware of being a cat; never theatrically self-deprecating about it
- Empty states acknowledge the void plainly

Sample (subject to your edits):

> *welcomeBack:* "the cat noticed three new policy papers since you were last in"
> *rescoring:* "the cat is re-reading"
> *emptyState:* "the cat has nothing to show under these weights — try loosening one"
> *surprisePreamble:* "the cat picked this because it has been chewing on it"

---

## 9. What's already in flight

- ✅ Policy evidence research memo — `research/policy-evidence-types.md`
- 🟡 PR #5: expand seed companies from 40 → 70 (open, awaiting Lotus review)
- 🟡 PR #6: draft lobbycat quote lines (open, awaiting Lotus + Fatima edit)
- ⏳ v0.6 implementation work — gated on this doc's sign-off

---

## 10. Implementation order

### Step 1 — Concept sign-off (this doc)

You read, you sign off (or push back), §10 below becomes the build plan.

### Step 2 — Review + merge the two open data PRs

Lotus reviews PR #5 (expanded company list) and PR #6 (quote lines). Quote lines surface to Fatima for inline editing in the PR thread; companies get merged after a sanity pass on each row's slug/tags/URLs.

### Step 3 — Schema migrations + weight model

`frame_weights` on `user_profile`, `scored_at`/`evidence_version`/`profile_version` on `frame_scores`, `frame_score_evidence` table, `company_notes` table. Drizzle generate + apply to Neon. Backfill `frame_weights` for the existing user_profile row with all-medium defaults.

### Step 4 — The scoring engine (server)

- Server action `rescoreCompany(companyId, frameId?, opts?)` that builds the prompt, calls Anthropic, stores the score + rationale + evidence rows
- Background worker (`/api/cron/rescore`) that catches up stale `(company × frame)` cells nightly
- Frontend hook `useLiveAggregates(weights)` that computes overall scores client-side from the current `frame_scores` snapshot

### Step 5 — The ranked-table home

- Welcome card component (cat quote + "what's new" sub-line + Re-score button when stale)
- Sortable table with frame columns (showing weight indicator), recent-activity dot pattern, expandable rationale cells, row → detail
- "Tune weights" affordance linking to `/frames`

### Step 6 — Frames page (definitions + weights together)

- Inline-edit frame definitions (saves on blur, triggers background rescore for non-trivial changes)
- L/M/H segmented controls per frame (instant client-side recompute)
- Reset-to-defaults link

### Step 7 — Compare with alt-weights sandbox

- Chip picker for 2–5 companies
- Floating sandbox weight panel (scoped to this comparison)
- Side-by-side columns with collapsed rationales, recent activity
- "Matches saved weights" / "Differs" indicator

### Step 8 — Surprise modal

- Three variants (Adjacency / Recency / Underrated) backed by simple query rules + one LLM call per pick to write the "the cat picked this because" line
- Surprise button in nav, modal opens, `Show me another` for up to 3 picks per session
- Surprise-preamble quote rotates the introduction

### Step 9 — Per-company notes (the "free-text intent" replacement)

- `company_notes` table already created in step 3
- Inline notes field on the company detail page
- Notes index on `/about` so Aadi can find what he wrote without remembering which company

### Step 10 — Evidence pipeline #4: consultation submissions

- New ingestion pipeline at `src/app/api/cron/consultations/route.ts`
- New table `consultation_submissions`
- Wire into the evidence selector for scoring

### Step 11 — Evidence pipeline #5: safety frameworks

- Hand-curated initial seed (slow-moving)
- New table `safety_frameworks`
- Wire into scoring

### Step 12 — Onboarding panel-3 update + v0.5 surfaces kill list

- Update panel 3 copy
- Delete the Map route + components
- Delete the free-text "next role" surfaces (form, action, table if applicable)
- Delete the S/A/B tier badges if present
- Run a sweep: `grep -r "MapView\|TierBadge\|nextRoleIntent"` — anything left is a kill candidate

### Step 13 — Re-curation pass

After steps 4–12 are live: trigger a full rescoring run across the 70 companies × 6 frames. Audit the results: any scores with `confidence: 'low'` get a flag; spot-check 5–10 cells against the published evidence. Tune the prompt if confidence is systematically too low or too high.

### Step 14 — README rewrite

Update the README to match the new engine framing. Surprise-discipline: warm but professional, no inside jokes in repo. The "made with love" coda goes here.

### Step 15 — Deploy + announce

`vercel --prod`, post a `v0.6 LIVE` message to `#lobby-cat` with a quick changelog and the deployed URL.

### Calendar shape (orientation, not a commitment)

If the heartbeat runs at 1h cadence with reasonable chunk discipline:
- Steps 2–3: ~2 hours
- Steps 4–6: ~5 hours
- Steps 7–9: ~3 hours
- Steps 10–11: ~3 hours
- Steps 12–15: ~2 hours

Total ~15 hours of focused chunks. Realistically ships in 2–3 calendar days of heartbeat work.

---

## 11. Sign-off

When Fatima signs off:

- ✅ **Ship it** — I disable any concept-mode crons, queue a v0.6 implementation heartbeat at the cadence Fatima picks, and start at Step 2 (review PRs).
- 🟡 **Push back on these specific things** — I edit + revise + re-post.
- 🔴 **Wrong direction, reset** — we brainstorm again before any code lands.

— Lotus 🪷
