# Lobbycat v0.7.2 — Polish + clarity refactor

**Status:** DRAFT — pending Fatima's sign-off
**Author:** Lotus 🪷 (in conversation with Fatima)
**Date opened:** 2026-06-24
**Theme:** Click-through polish after v0.7's first real test by Fatima. Bug fixes + copy tightening + structural simplification of the frames page.

---

## What this doc is

A sign-off doc for the v0.7.2 polish release. Scoped from Fatima's detailed feedback after her end-to-end click-through of v0.7.

Her honest reaction: *"it's really cute and i think we're so close!"* — confirming v0.7's structural direction (wizard-first, cards-not-rows, vaporwave aesthetic) is right. The polish layer is what stands between "this is the version" and "this is the gift."

v0.8 (the `clarify` skill) waits until v0.7.2 ships. v0.8's PR (#16) stays open as-is.

---

## 1. What's already shipped inline (not in this doc)

These were small enough that they landed before this doc was written:

- ✅ **Re-take the setup button** (PR merged 2026-06-24 19:19 UTC). Prominent bordered button at the top of `/about`. Two-step confirmation. Resets `wizardCompletedAt`, preserves answers, bounces to `/wizard` step 1.

Going forward, similarly small/clear fixes land inline; this doc captures the structural calls + the items that benefit from a coherent design pass.

---

## 2. What's in flight via sub-agents (today)

Three sub-agents spawned in parallel, each shipping its own PR for Lotus review:

### 2.1 v072-track-bugs-quick

- **Logo broken on sign-in screen** — diagnose, fix
- **Save button on "Your notes"** — add an explicit save button alongside autosave (autosave keeps, button adds visible "saving / saved ✓" feedback)
- **Blue notes box vertical height** — bump min-height ~40-60px

### 2.2 v072-track-score-missing

- **30 of 70 companies are unscored** (v0.6 expansion added them but never ran a scoring pass). Run Sonnet against the 180 missing cells (30 × 6 frames). Cost ~\$2-4. Conservative low-confidence rationales where evidence is thin — Glyphie will enrich over time.

### 2.3 v072-track-publications-diagnose

- **Only 6 publications in DB for 70 companies.** Diagnose: is the RSS pipeline broken? Is Glyphie writing to JSON but not syncing into the `publications` table? Fix the actual gap.

These three should land as PRs within ~30-45 min and merge today.

---

## 3. Structural changes (this doc)

These need design judgement and shouldn't ship without sign-off.

### 3.1 Kill tags entirely

**Decision:** Drop tags as a concept from lobbycat. Not just from the dashboard cards — from the frame data model too.

**Why:**
- Fatima's v0.6 feedback already flagged tag pills as repetitive / dev-coded
- v0.7's "scale / tag / question" frame-kind trichotomy was confusing in the frames page UI
- Tags weren't earning their keep — most of what they did is also expressible as low-cardinality frames or as company `focusAreas` text

**Out of scope to remove:** `companies.tags` (JSONB column) and the `tags`/`company_tags` lookup tables can stay in the DB. The dashboard just stops rendering them. The frame model drops the `'tag'` kind.

**Frame data model after v0.7.2:**
- `frames.kind` always `'scale'`. (Migration to remove or default the column; existing scale frames are unaffected.)
- `'question'` frames either die or stay as a v0.8 thing (clarify-adjacent). Probably die for now — open question for sign-off.

**Q: kill `'question'` frame kind too?** My instinct: yes, because `clarify` (v0.8) replaces what question-frames were trying to be. If kept, they'd compete with clarify sessions awkwardly. Confirm with sign-off.

### 3.2 Combined frames page — one card per frame, edit + weight together

**Current shape (v0.7):** Two sections on `/frames` — Section 1 "What you care about" (definitions) and Section 2 "Weighing what you care about" (Must/Should/Could). Aadi has to scroll between them to adjust both for the same frame.

**Proposed v0.7.2 shape:** Single section. **One card per frame.** Each card contains:
- **Title** — editable inline (the frame name)
- **Description** — editable text area. **Replaces the structured "low pole / high pole" labels with friendly prose**: "this is when this matters and what it means in your work." One paragraph, not two.
- **Weight** — Must / Should / Could segmented control, inline on the card
- **Delete** — small X in the corner

Above the cards:
- **Animated lobbycat box** explaining the page in voice: "here you can adjust the frames that you care about! come here and add more or adjust them as your thinking changes."
- **+ Add a new frame** button below the cards

The current "scale / tag / question" pickers disappear (per §3.1).

### 3.3 Rewrite frames page copy

Replace dry/jargony explanations:

| v0.7 copy | v0.7.2 copy |
|---|---|
| "A frame is a question you keep asking. The companies don't answer it; you do. Add more as your thinking changes — scales for 1–N axes, tags for binary lenses, questions for free-text answers per company" | "here you can adjust the frames that you care about! come here and add more or adjust them as your thinking changes." |
| Per-frame label "low pole / high pole" | A single description: "what does this mean in your work?" |
| Per-frame description (today: scale labels + descriptions) | One friendly paragraph per frame — first-person from the cat, explaining what the frame *is* and *why it might matter* to him. Pre-seeded from v0.7's existing scale descriptions but rephrased. |

### 3.4 Visual: tone down vaporwave inside company cards

**Issue:** Fatima loves the vaporwave aesthetic overall but reports the inside of each company card is hard to read.

**Cause (suspected):** The card body inherits the same neon-on-void-purple palette as the chrome. Inside-card text gets cyan glow + magenta accents stacked, which is great for hero moments but exhausting for 70 stacked cards.

**Proposed fix:** Define a **"card interior" subset** of the vaporwave tokens:
- **Background:** very dark purple (slightly lighter than the page void) — `--card-interior-bg` ≈ `#14102a`
- **Text:** softer foreground — `--card-interior-text` ≈ `#E0DEF0` (still readable, less neon)
- **Accents:** muted versions of magenta/cyan for inline elements, no glow inside cards
- **Glow + skew:** *outside* the card only (border, hover state, badge) — never inside

Card frame stays full-vaporwave (cyan top border, magenta side border, hover glow). Card *content* gets the readable palette. Best of both.

### 3.5 Visual: "Ask lobbycat" distinct from other components

Already a v0.8 feature (the clarify panel). But if a smaller v0.7.2 stub is wanted, the button/affordance should look **visually distinct** — not blend into the cyan-magenta UI. Probably a soft sunset gradient pill with the pixel cat sprite next to it. Confirm: ship the visual stub in v0.7.2, or wait for v0.8?

**My recommendation:** wait for v0.8. The button without the clarify session behind it is a tease.

---

## 4. Pre-generate fit notes (Glyphie-triggered nightly)

**Issue:** Fit notes today are generated on-demand (when Aadi clicks "regenerate" on a card). For 70 cards, that's a lot of clicks, and the card empty-state ("no fit note yet — click to generate") feels like work he has to do.

**Decision:** Pre-generate fit notes for every company. Confirmed mechanics (per chat):

- **Cost:** 70 companies × ~\$0.01-0.02 = ~\$1 per regeneration pass. Acceptable.
- **Trigger:** Glyphie's daily cron. Only re-do companies where her research surfaced a *real* change — new publication, new role, new lobbying record, frame-score change > 0.3.
- **First-run backfill:** A one-off pass (separate from the daily cron) generates fit notes for all 70 companies on v0.7.2 deploy. ~\$1.
- **UI:** Card empty-state replaced with the actual fit-note. "Regenerate" button stays for manual override.

### 4.1 Schema

`fit_notes` table already exists. No new columns needed. Add `generated_by` text column ('manual' | 'nightly') for telemetry — optional.

### 4.2 Build

- One-off backfill script: `scripts/backfill-fit-notes.ts`. Runs against Neon. Idempotent — skips companies that already have a recent fit-note.
- Glyphie's daily cron gets a new step: after writing her feeds, check for "what changed" diffs and pre-queue fit-note regenerations.

---

## 5. Auto-pre-fill protection on the wizard

**Issue:** Fatima reported "the quiz never ran on login" — turned out the wizard *was* filled out at some point (with Aadi-shaped answers) and `wizard_completed_at` was set. Possibilities:
- Fatima filled it during yesterday's exploration and forgot
- A heartbeat / seed pass / sub-agent silently filled it (less likely but possible)

**Decision:** Add a defensive check on the wizard route. When the wizard route loads, log to journal: who filled this in, when, from which IP/cookie. If something pre-filled it without an authenticated user session, flag it loudly. This is observability, not a code fix.

**Lightweight version (ship in v0.7.2):** When `wizardCompletedAt` is set, record `completed_via` text column on `user_profile`: 'wizard-form' (the user) vs 'seed' (anything else). Sentry-grade alert if 'seed' value appears.

---

## 6. Loading + animation polish

### 6.1 Animated lobbycat explainer boxes

Per Fatima: *"if we want some onboarding make a lobby cat animated box that says 'on this page, you can do this!'"*

A reusable `<ExplainerBox>` component:
- Small panel with the pixel cat sprite (blinking + tail wiggle, same as the rescore cat)
- One-sentence explanation in the cat's voice
- Dismissible per-page (cookie remembers; comes back on `re-take the setup`)
- Pages that get one: `/frames` (primary), `/about` (secondary), `/wizard` step transitions (tertiary)

### 6.2 Notes save button feel

Per §2.1 — the explicit save button alongside autosave. Visible "saving… → saved ✓" feedback so Aadi feels the commit.

---

## 7. Copy fixes

| Surface | Issue | Fix |
|---|---|---|
| Sign-in screen | Logo broken | (in flight via sub-agent) |
| Frames page | "scale/tag/question" jargon | Killed per §3.1 + §3.2 |
| Frames page intro | "A frame is a question you keep asking..." too abstract | New: "here you can adjust the frames that you care about! come here and add more or adjust them as your thinking changes." |
| Welcome-back card | "What happened by quiz" | **OPEN QUESTION** — Fatima saw confusing copy somewhere related to "quiz". Need to find it. May be a button label, welcome-back sub-line, or wizard step header. Will spot-check during build. |
| Dashboard card | "Show me" isn't obvious | Find where this label is used (likely a "show more" toggle). Replace with clearer "open" or "see more roles + publications" or similar. |

---

## 8. What dies

- **Tags everywhere on dashboard.** Pills removed from cards. `tags` table stays in DB for future use.
- **"scale / tag / question" frame-kind picker** on /frames page. Frames become only `scale`. (`'question'` deferred to v0.8 / cut.)
- **Section dividers** on /frames page. Single combined view.
- **Tiny "replay onboarding" text link** — already replaced in flight by the visible "re-take the setup" button.
- **Per-frame "low pole / high pole" structured labels** — replaced by a single friendly description per frame.

---

## 9. What survives untouched

- The wizard itself (6 steps, autosave per step) — voice + flow stay the same
- The vaporwave-theatre big-moment scoring screen
- Dashboard card layout (top-3 visible, show-more pattern)
- Filter + sort toolbar
- The 6 frames + scoring engine
- Auto-rescore on frame edit + animated cat
- Per-company notes (with the new save button)
- Fit-notes (with new pre-generation behaviour)
- Surprise modal
- Welcome-back card
- About page profile editor + notes index
- All v0.7.1 reliability infrastructure (retry, error boundaries, Sentry, health, smoke tests)
- Glyphie's daily run

---

## 10. Implementation order

### Step 0 — Merge sub-agent PRs from §2

Logo, save button, notes height (PR pending) · Score 30 missing companies (PR pending) · Publications diagnosis + fix (PR pending). Lotus reviews; ships today.

### Step 1 — Concept sign-off (this doc)

### Step 2 — Kill tags from dashboard rendering

Remove tag pills from `<CompanyCard>`. Remove from filter chips toolbar (tag filter goes). Confirm grep clean.

### Step 3 — Frames page rewrite (combined edit + weight + cards)

Single section, one card per frame. Friendly description, inline weight, delete affordance. Drop the kind picker. Pre-seed friendly descriptions from existing scale labels (LLM-assisted rewrite, 6 frames, one-shot Sonnet call).

### Step 4 — Frames page copy + explainer box

Replace intro. Add reusable `<ExplainerBox>` component with the cat sprite, mount on /frames.

### Step 5 — Visual: card-interior token subset

Define `--card-interior-bg`, `--card-interior-text`, `--card-interior-accent-muted`. Refactor `<CompanyCard>` body to use them. Card frame stays full-vaporwave.

### Step 6 — Pre-generate fit notes (backfill script + Glyphie hook)

`scripts/backfill-fit-notes.ts`. Daily Glyphie cron extension. Card empty-state updated to assume a fit-note exists.

### Step 7 — Copy hunt: "what happened by quiz" + "show me"

Grep the codebase for these strings. Replace with clearer labels.

### Step 8 — Wizard auto-fill defense

Add `completed_via` column to user_profile. Default 'wizard-form' for new completions. Alert on 'seed' values.

### Step 9 — Notes save button (if not already in sub-agent PR)

Visible saving / saved ✓ state. Autosave stays.

### Step 10 — Deploy + announce

`vercel --prod`. Post v0.7.2 announcement.

### Step 11 — Lotus regression pass

Re-click through wizard → home → company card → frames → about, looking for any v0.7.1 reliability/observability anomaly. Confirm Sentry receives expected events. Smoke tests green.

### Calendar shape

15-min heartbeat cadence, ~30m chunks: ~4-5 hours of heartbeat work after sign-off. Realistic: ships tomorrow.

---

## 11. Open questions for Fatima

Three things to confirm before I queue the heartbeat:

### Q1 — Kill the `'question'` frame kind too?

§3.1 proposes killing `'tag'` confidently but `'question'` is borderline. v0.8's clarify session replaces what question-frames were trying to be. Confirm cut?

### Q2 — "What happened by quiz" — where is it?

I need to find this copy. Welcome-back card? Wizard step header? Or somewhere on About? A screenshot or the URL where you saw it would unblock the copy-hunt step.

### Q3 — Visual stub for "Ask lobbycat" in v0.7.2, or wait for v0.8?

§3.5 proposes waiting. Confirm — or if you want a visual placeholder ("🪷 ask lobbycat — coming soon") for v0.7.2, say so.

---

## 12. Sign-off

When Fatima signs off:
- ✅ **Ship it** — merge `scope/v0.7.2`, queue v0.7.2 build heartbeat at 15-min cadence, start at Step 2 (Step 0 sub-agent PRs already merging in parallel).
- 🟡 **Push back on these specific things** — edit + revise.
- 🔴 **Wrong direction, reset.**

— Lotus 🪷
