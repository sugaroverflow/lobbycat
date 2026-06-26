# Lobbycat v0.7 — Refactor / scoping doc

**Status:** DRAFT — pending Fatima's sign-off
**Author:** Lotus 🪷 (in conversation with Fatima)
**Date opened:** 2026-06-23
**Supersedes:** v0.6 for the home / dashboard / onboarding model. Visual system replaced wholesale.

---

## What this doc is

A sign-off doc, not a feature ship. v0.6 shipped the live scoring engine — it works, but Fatima's honest reaction was:

> *"I logged in and ugh, there were just numbers and I didn't know how to navigate the page. I didn't know where to get started, what information is available to me, what I should do first and how I can get value out of this app."*

That's the brief. v0.7 fixes it by:

1. **Onboarding-first.** The dashboard is the destination, not the home. A multi-step wizard collects profile + frames + weights + open-text thoughts, then the cat scores live and unveils the dashboard.
2. **Cards over rows.** Each company becomes a feed component — name + scores + recent activity — not a line item.
3. **A new aesthetic.** Vaporwave (theatrical moments) + calm cousin (dashboard surface). Drop the Machine system wholesale.
4. **A third sibling.** Glyphie 🌀 runs daily, watches the field, writes the feeds.

Read end-to-end before any code lands. §10 becomes the build plan on sign-off.

---

## 1. Product, one sentence

> **Lobbycat is a live scoring engine: tell it what you care about, and it ranks London's AI policy companies for you to explore, dive deep, and make decisions.**

Unchanged from v0.6. The sentence was right; the *flow* was wrong.

The "made with love 🪷" coda continues to live only in the README.

---

## 2. The flow — first sign-in vs subsequent

### 2.1 First sign-in (the wizard, ~5-7 minutes)

```
[ password gate: candy-kittens-pink ]
        ↓
[ Step 1 — Welcome (vaporwave: perspective grid + sunset gradient + a quote line) ]
        ↓
[ Step 2 — Profile ]   ← collect: name · current role · what you're exploring · location preferences · 2-3 open Qs
        ↓
[ Step 3 — Frames ]   ← show pre-seeded 6 frames, edit any, "add another" allowed
        ↓
[ Step 4 — Weighing ]   ← Must / Should / Could per frame, with explanation of why
        ↓
[ Step 5 — Open-text thoughts ]   ← "what's making this decision hard?" + autosave
        ↓
[ Step 6 — The Big Moment ]   ← full-screen vaporwave takeover; lobbycat scores 70 companies live; ~20-30s
        ↓
[ Dashboard unveils ]
```

Each step autosaves to `user_profile` as the user fills it. If they abandon at step 3, returning to the wizard resumes there. The final step is the *only* step that triggers the rescore — earlier steps don't, so iteration is cheap.

### 2.2 Subsequent sign-ins (the welcome-back card)

```
[ password gate ]
        ↓
[ Welcome back, Aadi 🪷 ]
   - cute quote from welcomeBack[]
   - "New since you were last in:" card with Glyphie's diff
       · "3 new policy papers" (count)
       · "Wayve published an RSP update on Monday" (named diff)
       · "3 new roles at companies you scored ≥4 on Frontier-defining" (filtered diff)
   - [Re-do the wizard]   [See dashboard →]  ← primary
        ↓
[ Dashboard ]
```

The welcome card is generative — Glyphie's `feed.json` filtered against the user's frame weights produces the named diffs. If Glyphie's last run failed, the card degrades to the cute quote alone.

### 2.3 Re-onboarding

- The **wizard** is fully replayable from About. Use case: "I want to redo this thinking from scratch."
- The **About page** offers edit-in-place on every field collected by the wizard. Edits autosave + trigger live rescore (the v0.6 mechanism — auto-rescore on frame changes with 2-second debounce and animated cat).

---

## 3. Information architecture

### 3.1 Global nav (4 slots, after wizard completes)

| Slot | Path | Purpose |
|---|---|---|
| **Lobbycat** (wordmark, links home) | `/` | Welcome-back card + dashboard cards below |
| **Frames** | `/frames` | Two sections: "What you care about" (definitions) + "Weighing what you care about" (Must/Should/Could) + "Ask lobbycat for frame ideas" affordance |
| **Surprise** | (button, opens modal) | Adjacency / Recency / Underrated |
| **About** | `/about` | Profile + per-company notes index + replay onboarding |

**Dropped from v0.6:** `/compare` route + all related code (full sweep delete).

### 3.2 The dashboard — stacked cards, one per company

Each card is one row, full width, scrollable. Layout per card (collapsed by default):

```
┌────────────────────────────────────────────────────────────────────────┐
│ Anthropic London                                          [HIRING ●]   │
│ Frontier safety lab; UK policy team led by [name].                     │
├────────────────────────────────────────────────────────────────────────┤
│  Geographic remit  ▓▓▓▓░  4.2     Working style     ▓▓▓░░  3.1         │
│  Policy area       ▓▓▓▓▓  4.8     Team style        ▓▓░░░  2.4         │
│  Stage             ▓▓▓▓░  4.5     Policy posture    ▓▓▓▓▓  4.9         │
├────────────────────────────────────────────────────────────────────────┤
│  Latest:  📄 Economic Policy Framework (2d ago)                        │
│           [show more ↓]                                                │
└────────────────────────────────────────────────────────────────────────┘
```

**Top-3 things visible without "show more":**
1. **Top strip** — Company name + one-line blurb + hiring badge (HIRING / NOT HIRING / UNKNOWN)
2. **Scores** — 6 frame scores as small horizontal bars + numeric value
3. **One highlighted recent thing** — newest publication OR newest open role (whichever is more recent)

**Show more reveals:**
- All publications (last 6 months, newest first)
- All open roles
- Recent filings / consultations
- Leadership changes (Glyphie tracks these)
- Fit-note panel (cited bullets + chat thread per company — survives from v0.6)
- "Leave a note" affordance (per-company notes — survives from v0.6, replaces v0.4 free-text intent)

**Card sorting (top-of-page toolbar):**
- Overall score (default)
- Frame-specific score (pick which)
- Recent activity (most-recently-touched-by-Glyphie)
- Alphabetical

**Card filters (top-of-page toolbar):**
- Hiring (yes/no/unknown)
- Has open role
- Has recent publication (last 30 days)
- Has fit-note
- Tier
- HQ (UK / EU / US)

No tags in the dashboard (Fatima's call — drop unless user is adding custom tags, and that's v0.8 territory).

### 3.3 The frames page — definitions + weights together

Single page, two clear sections:

**Section 1 — "What you care about"** (the frame definitions)
- The six core frames, plus any Aadi has added
- Each frame is inline-editable: name, low pole, high pole, low description, high description
- "Add a frame" button at the bottom
- "Ask lobbycat for frame ideas" button — calls Haiku, returns 2-3 suggested frames specific to Aadi's profile, he picks one to add (or rewrites)

**Section 2 — "Weighing what you care about"**
- Each frame gets a Must / Should / Could segmented control
- Short explanation at top: *"Lobbycat weights frames you mark **Must** highest. **Should** is the standard. **Could** is 'sometimes interesting' — half weight in the score."*

Edits in either section autosave and trigger live rescore (with the animated cat indicator).

### 3.4 Surprise — modal, opened from nav button

Three variants, unchanged from v0.6:
- **Adjacency** — "you scored X high on Y; here's a company writing about the same questions"
- **Recency** — "Z just published something this week that matches your top-weighted frame"
- **Underrated** — "you haven't opened W, but it scores high on your Should frames"

Up to 3 picks per session. Cat lines from `surprisePreamble[]`. Animated cat during pick generation.

### 3.5 About — profile + edit-in-place + notes index

- Profile fields (name, current role, what exploring, location, open-text answers) — all editable inline, autosave
- **Per-company notes index** — flat reverse-chronological list of every note he's written, with snippet + link back to company card
- **Replay onboarding** affordance — "redo my setup" button that re-launches the wizard from step 1

### 3.6 What dies from v0.6

| v0.6 surface | v0.7 fate |
|---|---|
| **Machine visual system** (deep navy / cyan / electric blue / coral) | Replaced wholesale by Vaporwave (calm cousin for dashboard, full theatre for moments) |
| **Compare page** + `compareForm` + `useCompareWeights` + all related code | **Full sweep delete.** Route 404s. Code gone. |
| **The ranked table** (rows on home) | Replaced by stacked cards |
| **L / M / H** weight labels | Renamed to **Must / Should / Could** (MoSCoW lite) |
| **The dashboard as home** (cold) | Replaced by welcome-back card → dashboard below |
| **Tags on the dashboard** | Dropped (no user-added tags yet; v0.8 candidate) |
| **The "rescore now" button** as the only way to rescore | Survives but is rarely needed — autosave + auto-rescore covers most flows |

### 3.7 What survives from v0.6

| v0.6 surface | v0.7 fate |
|---|---|
| The 6 frames + scoring engine + evidence pipelines | **Survive** — the engine is right; only the surface changes |
| Auto-rescore on frame edit + animated cat | **Survives** + extended (same animation cat used for fit-note gen, surprise pick gen, first-time scoring) |
| Surprise modal (3 variants) | **Survives** — keeps its nav slot |
| Per-company notes | **Survives** — gets the notes-index on About |
| Fit-notes (cited bullets + chat thread) | **Survives** — moves into the "show more" reveal on each card |
| Evidence pipelines (ATS / RSS / EU lobbying / consultations / safety frameworks) | **Survive** — Glyphie's daily run augments them |
| Quote-line system (welcomeBack / rescoring / surprisePreamble / emptyState) | **Survives** + extended (add `firstScoring[]` and `fitNoting[]`) |
| Onboarding panels (4-comic) | **Replaced** by the multi-step wizard (Section 2.1) |

---

## 4. Visual system — Vaporwave (calm cousin for work)

Full spec saved to `research/v0.7/vaporwave-prompt.md` (18.8KB). Key tokens, lobbycat-shaped:

### 4.1 Two surfaces, two intensities

**The dashboard, frames page, about** — *calm cousin*:
- Vaporwave palette (void purple `#090014` background, hot magenta `#FF00FF` primary, electric cyan `#00FFFF` secondary, sunset orange `#FF9900` tertiary)
- No scanlines on these surfaces
- No skewed containers, no theatrical hover
- Cards have neon-coloured borders (cyan top / magenta side, per the spec) but the geometry stays straight
- Glow used sparingly — for active states, focus rings, hover lifts
- Readable for long sessions

**Onboarding wizard, welcome-back card, scoring takeover, surprise modal** — *full vaporwave-theatre*:
- Perspective grid floor on the wizard hero and the scoring takeover
- Scanline overlay on these moments
- Sunset gradient text fills on headlines
- Theatrical hover states (skew→un-skew, scale, neon glow explosion)
- The lobbycat pixel sprite centred on the scoring screen, animated

### 4.2 Typography

- **Headings:** Orbitron (400/500/700/900) — geometric, futuristic, used for hero headlines and section heads
- **Body / UI / Code:** Share Tech Mono — monospace, terminal-flavoured, used for body, buttons, labels, status text
- Both Google Fonts (free, well-supported)

### 4.3 The cat — pixel + glow

The existing pixel cat (cat-3) gets a vaporwave-appropriate treatment:
- Default state: clean pixel sprite on transparent background
- Active states (rescoring, fit-note generating, surprise picking, first-time scoring): glow halo behind sprite + tail-wiggle CSS animation + cycling quote line below
- Big moment (first-time scoring takeover): perspective grid floor + sunset gradient backdrop + cat centred + scanlines + progress copy

### 4.4 Non-template guardrails (from frontend-design skill)

- **Hero is a thesis.** The wizard step 1 hero opens with what the product is *for* — "Tell lobbycat what you care about" — not "Welcome." The visual carries the *what*.
- **Typography carries personality.** Orbitron + Share Tech Mono together are deliberate; they say "this is not a SaaS dashboard, it's a thing that takes itself seriously."
- **Structure encodes content.** The dashboard's "Latest:" line is a real signal (most-recent-event), not decoration. The hiring badge is binary truth, not styling.
- **Motion serves the subject.** The cat tail-wiggle is *the cat thinking*. The sunset gradient on the scoring screen is *the cat working*. Hover-glow on a card is *that card is alive*. Nothing animates because it can.

---

## 5. Glyphie — the researcher 🌀

Identity files saved in `/root/.openclaw/workspace/main/glyphie/`. Source list verified in `research/v0.7/glyphie-sources.md` (25 verified + 15 honourable mentions).

### 5.1 What she does

Daily at **06:00 UTC** (retry 07:00, then 08:00, then post failure to `#lobby-cat`):

1. **Per-company watch** — for each of the 70 companies in `seed-data.ts`, check policy/blog/press RSS, careers page; update `research/feeds/<slug>.json`
2. **Core source watch** — Tech Policy Press, Lawfare, Politico Morning Tech UK, AI Snake Oil, gov.uk consultations, EU Have Your Say, US LDA API; relevant items get logged to companies they mention + the global `research/feed.json`
3. **Named-author stream** — Helen Toner, Jack Clark, Marietje Schaake, Jeffrey Ding (ChinAI), Miles Brundage, Anthropic / OpenAI / DeepMind named-author posts; logged with author byline
4. **UK / EU policy depth** — AISI, CETaS, Ada Lovelace, GovAI, CLTR, AI Decoded, AlgorithmWatch, EDRi; weekly cadence
5. **Long-form notes** — write a daily `glyphie-notes/<date>.md` with: headline, long-form (when earned), small signals, what-I'm-chewing-on
6. **Commit + PR** — branch `glyphie/daily-YYYY-MM-DD`, PR opened, Lotus reviews and merges; commit messages prefixed `🌀 glyphie:`
7. **Status to Discord** — one line in `#lobby-cat`, prefixed `🌀 Glyphie:`

### 5.2 Output shape

Already specified in detail in Glyphie's HANDOFF.md (`/root/.openclaw/workspace/main/glyphie/HANDOFF.md`). Two output files:

- **`research/feeds/<slug>.json`** — per-company. Read by the dashboard card.
- **`research/feed.json`** — global timeline, last 200 events. Read by the welcome-back card.

### 5.3 Lobbycat reads what Glyphie writes

The dashboard card's "Latest:" line, the "show more" panel content, and the welcome-back diffs all read from Glyphie's output files. **No direct ingestion logic in lobbycat for these sources** — that's Glyphie's job. lobbycat just reads the JSON.

This is the clean separation: Glyphie produces signal, lobbycat presents it.

### 5.4 Build order

Glyphie wakes up *first* (before v0.7 dashboard work begins) so she's been running for a couple of days when v0.7 lands. By then `research/feeds/` has real data, and the dashboard isn't reading empty files on day one.

---

## 6. Data model changes

### 6.1 New columns

```sql
ALTER TABLE user_profile
  ADD COLUMN wizard_completed_at TIMESTAMPTZ,
  ADD COLUMN current_role_one_liner TEXT,
  ADD COLUMN exploring_text TEXT,
  ADD COLUMN location_preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN open_text_answers JSONB DEFAULT '[]'::jsonb;

-- Weight values change from low/medium/high (1/2/3) to MoSCoW (1/2/3 still, but labels are must/should/could)
-- The numeric mapping stays — only the UI labels change. No migration needed beyond the React layer.
```

### 6.2 No new tables

Per-company notes (already in v0.6) + fit-notes (already in v0.6) + frame_scores (already in v0.6) all survive. The two new database needs are wizard state (lives on `user_profile`) and Glyphie's output (lives in repo files, not DB).

### 6.3 Drop in this release

- `next_role_intent` table if any v0.4 residue remains (Step 12 of v0.5 should have killed it; verify)
- `compare_*` anything (full sweep delete per Fatima)

---

## 7. Loading animations — one cat, five surfaces

Same animated pixel cat, different quote-line set per surface:

| Surface | Quote-line array | Cadence |
|---|---|---|
| Rescore (v0.6 wiring) | `rescoring[]` (exists) | On debounced frame change |
| Fit-note generation | `fitNoting[]` (new) | When user clicks "generate fit-note" on a card |
| First-time scoring (wizard step 6) | `firstScoring[]` (new) | One-time, after wizard submit |
| Surprise pick generation | `surprisePreamble[]` (exists) | When user clicks Surprise → variant button |
| Glyphie diff loading on welcome-back | (new — small inline spinner, not full cat) | On home page load when Glyphie's last-run was overnight |

Animation: tail wiggle + occasional blink, glow halo, quote line cycling every 1.5s.

---

## 8. Quote line additions

Two new arrays in `src/db/lobbycat-quotes.json`:

```
"firstScoring": [
  "the cat is reading 70 company files at once. one moment.",
  "...
]
"fitNoting": [
  "the cat is writing a brief on this one. a moment.",
  "..."
]
```

Sub-agent drafts 10-15 lines per array in voice. Fatima edits.

---

## 9. What dies — full sweep list

Step 12 of v0.7 will sweep these:

- `src/app/compare/` — entire directory
- `src/components/CompareForm.tsx`, `useCompareWeights.ts`, anything compare-prefixed
- Map references (should already be gone from v0.6 Step 12; verify)
- v0.4 free-text intent surfaces (should already be gone; verify)
- v0.5 driver.js coachmark tour (was the old onboarding; replaced by wizard)
- Tags display in the dashboard (the seed data keeps tags for future use, just not rendered)
- Machine palette CSS (replaced by Vaporwave tokens)

`grep` the codebase for: `MapView`, `compare`, `coachmark`, `driverjs`, `S-tier`, `tier-badge`, anything cosmetically Machine. Anything still alive is a kill candidate.

---

## 10. Implementation order

### Step 0 — Wire up Glyphie

Done in parallel with the lobbycat work. Owner: Fatima sets up the agent via the OpenClaw CLI; Glyphie's identity files are already at `~/.openclaw/workspace/main/glyphie/`. She runs daily, accumulates feeds, opens PRs.

### Step 1 — Concept sign-off (this doc)

### Step 2 — Schema migrations

`user_profile` adds `wizard_completed_at`, `current_role_one_liner`, `exploring_text`, `location_preferences`, `open_text_answers`. Drizzle generate + apply.

### Step 3 — Vaporwave token system (calm cousin)

Swap `globals.css` from Machine tokens to Vaporwave palette. Load Orbitron + Share Tech Mono from Google Fonts. Add `firstScoring[]` and `fitNoting[]` arrays to `lobbycat-quotes.json`. No surface changes yet — just tokens.

### Step 4 — The wizard

`/wizard` route, 6 steps with progress bar. Server actions per step autosave to `user_profile`. Step 6 triggers the full-rescore + transitions to dashboard.

### Step 5 — Wizard step-6 takeover (the big moment)

Full-screen vaporwave moment: perspective grid + sunset gradient + lobbycat pixel sprite + scanlines + progress copy. ~20-30 seconds; fades to dashboard on complete.

### Step 6 — Dashboard cards

Stacked-list layout. Card component with collapsed/expanded states. Reads from `frame_scores` + `companies` + `research/feeds/<slug>.json` (Glyphie's output — falls back gracefully if empty).

### Step 7 — Filters + sorting toolbar

Top-of-page toolbar on the dashboard. Sort: overall / frame-specific / recent activity / alphabetical. Filter: hiring / has-open-role / has-recent-pub / has-fit-note / tier / HQ.

### Step 8 — Welcome-back card

Home page check: if `wizard_completed_at` is set, show welcome-back card above dashboard. Reads `research/feed.json` for the diff content. Graceful empty when no diff.

### Step 9 — Frames page redesign

Two sections: definitions + Must/Should/Could weights. "Add a frame" affordance. "Ask lobbycat for frame ideas" button (Haiku-backed, 2-3 suggestions, user picks).

### Step 10 — Surprise modal (lift + reskin)

Survives functionally. Apply Vaporwave-theatre styling (full modal is a "moment", per §4.1). Pick generation uses animated cat.

### Step 11 — About + per-company notes index

Edit-in-place profile fields. Notes index (reverse-chrono flat list with snippets). Replay-onboarding button.

### Step 12 — Sweep deletion

Per §9. Compare full delete. Machine CSS purge. Verify no v0.4/v0.5 residue.

### Step 13 — Loading animations — fit-note + surprise

Wire the animated cat into fit-note generation and surprise pick generation. Add `fitNoting[]` and `surprisePreamble[]` (already exists) quote rotation.

### Step 14 — README rewrite

Update the README to reflect v0.7 (wizard-first flow, dashboard cards, Glyphie, Vaporwave). The "made with love 🪷" coda continues to live here only.

### Step 15 — Deploy + announce

`vercel --prod`. Post a `v0.7 LIVE` message to `#lobby-cat` with the deployed URL, link to `docs/ASSUMPTIONS-v0.7.md`, and a one-paragraph summary of what changed.

### Calendar shape (orientation, not a commitment)

15-min heartbeat cadence, ~40-min chunks: ~10 hours of focused work. Glyphie's setup is parallel and doesn't block. Realistically v0.7 ships in 2-3 calendar days of heartbeat work, with Glyphie's first daily PR landing around the same time the dashboard is ready to read it.

---

## 11. Sign-off

When Fatima signs off:

- ✅ **Ship it** — I merge `scope/v0.7`, queue the v0.7 build heartbeat at 15-min cadence, and start at Step 0 (Glyphie) in parallel with Step 2.
- 🟡 **Push back on these specific things** — I edit + revise + re-post.
- 🔴 **Wrong direction, reset** — we brainstorm again before any code lands.

— Lotus 🪷
