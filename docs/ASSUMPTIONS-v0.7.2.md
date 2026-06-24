# Assumptions log — v0.7.2 polish + clarity

Per Fatima's rule (2026-06-24 21:09 UTC): don't pause for questions during the
v0.7.2 build. Make defensible assumptions, log them here with timestamp +
alternatives + "would change if", and ship. Sign-off answers Q1/Q2/Q3 are
already locked in REFACTOR-v0.7.2.md §11.

---

## Step 2 — Kill tags from dashboard rendering (2026-06-24 21:30 UTC)

### A2.1 — Dashboard cards didn't render tags in the first place; only `/companies/[slug]` did.

- **Assumed:** "Kill tags from dashboard rendering" in practice means the only
  surface left rendering `TagChip` was the company detail page (`/companies/[slug]`).
  A grep of `src/components` and `src/app` for `TagChip`, `tag-chip`, and
  `tags.map` confirms it. `DashboardCards` already doesn't render tag pills.
  There is no separate filter-chip toolbar with a tag filter to remove.
- **Alternatives:** I could have spent more time searching for indirect tag
  rendering (e.g. a custom hook surfacing tags into card bodies). I didn't see
  any, and Fatima's v0.7 ship already moved cards away from pills.
- **Would change if:** A subsequent click-through surfaces a tag pill somewhere
  I missed — I'd treat it as a step-2 follow-up commit, not a v0.8 thing.

### A2.2 — `TagChip` component file deleted now, not deferred.

- **Assumed:** With no remaining consumers, `src/components/tag-chip.tsx` is
  dead code; deleting it now keeps the v0.7.2 scope honest and avoids the file
  rotting through v0.8.
- **Alternatives:** Leave it as an orphan until v0.8's clarify work, in case
  we want to bring tag-style pills back. Per §3.1 the tag concept is dropping,
  so resurrection is unlikely.
- **Would change if:** v0.8 specifically wants pill-style chips for clarify
  cohorts — we can re-introduce a more general `<Chip>` component then.

### A2.3 — `companies.tags` JSONB + `tags`/`company_tags` lookup tables stay in DB.

- **Assumed:** Per §3.1 explicitly out of scope to remove. `lib/queries.ts`
  still returns `tags` in `getCompanyBySlug` for now; nothing consumes it on
  the page. No migration needed.
- **Alternatives:** Drop the `tags: companyTagList` field from the query
  return shape. Holding off to keep this commit focused on rendering and to
  avoid breaking anything that imports the type.
- **Would change if:** TypeScript build complains, or a v0.8 cleanup pass
  wants to prune the query surface — easy follow-up.

### A2.4 — `frames.kind === 'tag'` references in `frames-editor.tsx` and `actions.ts` are step-3 work, not step-2.

- **Assumed:** Step 2 is dashboard rendering only; step 3 explicitly says
  "Drop 'tag' AND 'question' frame kinds." Touching the frames editor here
  would muddle the commit.
- **Would change if:** Step 3 turns out to need a schema migration that has
  to land first — I'd reorder and call it out in the journal.

---

## Step 3 — Combined frames page (one card per frame) (2026-06-24 21:40 UTC)

### A3.1 — Replace `FramesEditor` + `FrameWeightsPanel` with a single `FrameCards` component.

- **Assumed:** Per §3.2 the page collapses to one section, one card per
  frame, with title + description + weight + delete on each card. Keeping
  the two existing components and trying to glue them visually would leave
  two source-of-truth shapes for the same row and make the kind-dropping
  awkward. Cleaner to write one component (`<FrameCard>`) and have the
  page render a list of them, then drop `FrameWeightsPanel` and the
  three-kind `FramesEditor` outer shell.
- **Alternatives:** Keep `FrameWeightsPanel` for the weight UI and embed a
  trimmed `FramesEditor` row inside it. Rejected — re-shapes two unrelated
  components for ergonomics that a single new component handles more
  clearly.
- **Would change if:** A future scope wants the L/M/H control as a
  reusable surface elsewhere — we'd extract a `<WeightSegmented>` from
  inside `<FrameCard>` then.

### A3.2 — `'tag'` and `'question'` frames disappear from the UI but stay in the DB.

- **Assumed:** Per §3.1 + §11 Q1 sign-off, only `'scale'` frames render.
  Any existing rows with `kind in ('tag','question')` are filtered out of
  the editor and don't render. A migration to drop or default the column
  is **deferred** — `kind` stays nullable / defaulted to `'scale'` for new
  rows; old `tag`/`question` rows are tolerated as zombies until a v0.8
  cleanup pass. This avoids a destructive migration mid-build.
- **Alternatives:** Schema migration this step (set `kind = 'scale'` for
  every row, drop the column). Rejected — risky in the same commit as a
  UI rewrite; v0.8 has more breathing room for it.
- **Would change if:** Production has live `tag`/`question` frames Aadi
  cares about. Confirmed not the case — Fatima's seed only used `scale`.

### A3.3 — `createFrame` / `updateFrame` server actions accept the same shape; the UI just stops sending non-scale kinds.

- **Assumed:** No action signature changes in this step. The new
  `<FrameCard>` calls `updateFrame({ id, name, description, kind: 'scale',
  scale, lowLabel, highLabel })` and creation always sends `kind:'scale'`.
  Action-side validation already accepts these. A later cleanup can shrink
  the action surface, but doing it here ties this commit to a server-
  action refactor we don't need.
- **Alternatives:** Tighten the action to reject non-scale kinds now.
  Rejected — leaves Glyphie / scripts / other callers exposed to a hard
  fail without warning.

### A3.4 — Pre-seed friendly descriptions from existing scale labels via a Sonnet rewrite.

- **Assumed:** Per §10 Step 3: "Pre-seed friendly descriptions from
  existing scale labels (LLM-assisted rewrite, 6 frames, one-shot Sonnet
  call)." I'll ship a `scripts/rewrite-frame-descriptions.ts` that reads
  all `kind='scale'` frames, sends one batched Sonnet call producing a
  friendly first-person-cat description per frame, and writes them back to
  `frames.description`. Idempotent — skips frames whose description was
  recently edited (heuristic: contains the literal phrase "this matters"
  or was updated within 24h of a manual edit timestamp; for v0.7.2 I
  simplify to: skip if description longer than 80 chars, since the
  pre-v0.7.2 ones are short scale-label restatements).
- **Alternatives:** (a) hand-write 6 descriptions inline. Rejected — they
  read worse and Fatima asked for the cat-voice rewrite. (b) Skip the
  rewrite entirely and let users fill in descriptions. Rejected — the
  point of §3.3 is the page reads like a cat speaking; empty fields kill
  the vibe on first visit.
- **Would change if:** The Sonnet output reads off — easy to re-run.
  Cost ~$0.02; not a deploy-blocker.

### A3.5 — The "+ Add new frame" creation form stays modal-like in-card but only ever creates `kind='scale'`.

- **Assumed:** Per §3.2, the creation surface mirrors the card shape:
  title, friendly description, low/high label inputs (kept because new
  frames still need a scale's poles to be scoreable), Must/Should/Could.
  No kind picker. v0.7's `<NewFrameForm>` had a kind dropdown; that goes.
- **Alternatives:** Hide the low/high inputs and infer poles from the
  description. Rejected — the scoring engine reads `lowLabel`/`highLabel`
  in the rescore prompt; without them, scores degrade.
- **Would change if:** A v0.8 redesign moves to scale-less frames.

### A3.6 — `<CatSuggestions>` ("Ask lobbycat for frame ideas") survives but its output is filtered to `kind='scale'` only.

- **Assumed:** It's still a useful surface; just constrain the prompt to
  scale frames and post-filter the response. The existing suggest action
  currently asks for `question` or `scale`; I'll update the system prompt
  to ask for `scale` only, and discard any non-scale entries it returns
  anyway as a belt-and-braces.
- **Alternatives:** Hide `<CatSuggestions>` entirely in this step.
  Rejected — it's a feature Fatima signed off on in v0.7 and removing it
  here would be a scope creep.

---

## Step 4 — ExplainerBox + frames copy (2026-06-24 21:50 UTC)

### A4.1 — `<ExplainerBox>` mounts on `/frames` only in this step (not `/about`, not wizard step transitions).

- **Assumed:** Per §6.1 the plan calls /frames "primary", /about
  "secondary", wizard transitions "tertiary". The About page is already
  busy (replay-onboarding link in flight + profile editor + notes index);
  adding another box there would compete with the re-take-the-setup
  affordance Fatima just shipped. The wizard has its own voice in the
  step copy; an extra explainer is noise. I ship the primary surface
  in v0.7.2 and revisit secondary/tertiary in v0.8 polish.
- **Alternatives:** Mount on all three. Rejected — explainer fatigue
  is a real risk and the marginal benefit on About is low.
- **Would change if:** Fatima's next click-through asks specifically for
  the explainer on /about (e.g. "the notes index isn't obvious") — then
  add it there with a different `id`.

### A4.2 — Dismissal persisted via client-side cookie keyed by `id`, not server-side per-user.

- **Assumed:** Per §6.1 ("Dismissible per-page (cookie remembers; comes
  back on `re-take the setup`)"). A cookie is the right primitive —
  cheap, per-browser, doesn't require a schema change or a server
  round-trip. The dismissal lifetime is 365d. The re-take-setup flow on
  /about already clears the `lc_onboarded` cookie; I'm **not** wiring
  re-take to clear `lc_explainer_*` cookies in this step — deferred
  follow-up (small, can land in Step 8 or its own commit).
- **Alternatives:** Persist on `user_profile.dismissedExplainers` JSONB.
  Rejected as overkill for v0.7.2 — schema change for a UI nicety.
- **Would change if:** Aadi logs in from a fresh browser and we want the
  dismissals to follow him — then promote to server-side. Not now.

### A4.3 — Use `useSyncExternalStore` (not `useEffect`+`setState`) to read the cookie.

- **Assumed:** React 19's `react-hooks/set-state-in-effect` rule fires on
  the obvious pattern; `useSyncExternalStore` is the supported escape
  hatch for "read a browser-only value into render output". A tiny
  in-module pub/sub keeps sibling ExplainerBoxes in sync after a
  dismissal without polling.
- **Alternatives:** Match the existing `onboarding-overlay.tsx` pattern
  (effect + setState) and accept the lint warning. Rejected — v0.7.1
  already has 12 lint errors of this shape; adding more makes the
  reliability backlog grow.
- **Would change if:** A future React update makes a simpler pattern
  obviously preferable.

### A4.4 — Intro paragraph on `/frames` is removed; the ExplainerBox replaces it.

- **Assumed:** Per §3.3 the v0.7.2 copy IS the explainer body. Keeping
  the paragraph AND the explainer box would say the same thing twice.
  The page header (h1) stays.
- **Would change if:** UX testing shows users miss the explainer when
  dismissed — then re-introduce a permanent (non-dismissible) one-liner
  under the h1.


---

## Step 5 — Card-interior token subset (2026-06-24 21:55 UTC)

### A5.1 — Tokens land as `--card-interior-*` in `vaporwave.css`, exposed via `--color-card-interior-*` in `globals.css`.

- **Assumed:** Per §3.4, the card frame stays full-vaporwave (cyan top
  border, magenta side border) while only the *interior* shifts to the
  calmer palette. Adding the subset as new tokens (not a re-targeting
  of `--bg-panel`) keeps theatre surfaces — wizard, scoring screen,
  surprise modal — unchanged. New tokens:
    - `--card-interior-bg: #14102A` (between void `#090014` and panel `#1a103c`)
    - `--card-interior-bg-sunk: #100C22`
    - `--card-interior-text: #E0DEF0` (softer than chrome `#E0E0E0`)
    - `--card-interior-text-muted: rgb(224 222 240 / 0.7)`
    - `--card-interior-text-whisper: rgb(224 222 240 / 0.45)`
    - `--card-interior-rule: #1F1640` (dimmer than `--rule`)
    - `--card-interior-accent-magenta: rgb(255 0 255 / 0.55)` (muted, no glow)
    - `--card-interior-accent-cyan: rgb(0 255 255 / 0.65)` (muted, no glow)
- **Alternatives:** Retarget `--bg-panel` directly. Rejected — it bleeds
  into theatre surfaces.
- **Would change if:** A future scope wants the interior subset to be the
  default everywhere (then promote it and demote theatre to its own subset).

### A5.2 — Only `CompanyCard` retargets in this commit. Other surfaces (e.g. company detail page, frames cards) stay on `--bg-panel` for now.

- **Assumed:** Per §3.4 Fatima's specific complaint was *inside the
  company cards* on the dashboard. Other panels weren't called out as
  unreadable. Retargeting everything to the calmer subset risks losing
  the vaporwave character on surfaces that *should* feel theatrical.
  Conservative scope: dashboard CompanyCard only. The frames-page cards
  (Step 3) use `bg-surface` Tailwind class which already maps to the
  legacy `--color-surface = --bg-panel`; revisiting that is a Step 5b
  candidate if Fatima's next click-through flags it.
- **Alternatives:** Retarget every "card-ish" surface in one pass.
  Rejected — risk of unintended visual regressions on calm surfaces
  that already work.
- **Would change if:** Fatima reports the new frames-page cards (Step 3)
  feel inconsistent next to the redone dashboard cards. Easy follow-up.

### A5.3 — The accent token (`--card-interior-accent-magenta/cyan`) is defined but not yet *applied*; the score bars and overall readout still use `--readout-cyan`.

- **Assumed:** The plan says "muted versions of magenta/cyan for inline
  elements, no glow inside cards." The dashboard card's most prominent
  inline accent is the `text-readout` on the Overall score and the
  6-frame score bars. Those already lack the `--vw-glow-*` filters, so
  they don't visually glow inside the card. Demuting them to the muted
  cyan in this commit would dampen the visual hierarchy (the score is
  what the user reads first). Holding the muted accent tokens in
  reserve for v0.8 when we have a click-through to validate.
- **Alternatives:** Apply the muted accents now. Rejected without a
  visual check from Fatima — dampening the score readouts could read as
  a regression.
- **Would change if:** Fatima's next look says "the cyan still pops too
  much inside the card" — then swap `text-readout`→`text-card-interior-
  accent-cyan` on the score readouts.

### A5.4 — No global utility classes (e.g. `bg-card-interior`) are pre-rolled.

- **Assumed:** Tailwind v4 should auto-generate `bg-card-interior` etc.
  from the `--color-*` entries I added in `globals.css`. I'm not adding
  bespoke utility classes — the inline `style={{ background:
  'var(--card-interior-bg)' }}` pattern matches the rest of the file
  (`CompanyCard` already uses inline `style` for its borders). Cleaner
  refactor to className-only would be a separate styling pass.
- **Would change if:** A future component wants the subset and inline
  style is awkward — then verify Tailwind auto-gen, or hand-roll one
  utility.

---

## Step 6 — Pre-generate fit notes (2026-06-24 22:30 UTC)

### A6.1 — Replicated `generateFitNote` logic in the backfill script rather than importing from `src/app/actions.ts`.

- **Assumed:** `actions.ts` is `"use server"`, which Next.js wraps with
  a server-action runtime; importing it from a plain `tsx` script is
  fragile (the wrapper expects React/Next context that doesn't exist
  outside the Next runtime). Duplicating the prompt + Anthropic call is
  the lowest-risk path and keeps the script standalone (runnable from
  any host with `DATABASE_URL` + `ANTHROPIC_API_KEY`).
- **Alternatives:** Export the inner generator from a non-`"use server"`
  module (e.g. `src/lib/fit-notes.ts`) and import from both. Cleaner
  long-term but a bigger refactor than the heartbeat-chunk allowed.
- **Would change if:** A future fit-note tweak needs to ship to *both*
  the live action and the backfill — at that point, lift to
  `src/lib/fit-notes.ts` and import from both call-sites.

### A6.2 — Idempotency keyed on `(company_id, profile_version)`.

- **Assumed:** This matches the existing unique index
  `fit_notes_company_version_idx` on `fit_notes`. A company is "up to
  date" iff its latest fit-note's `profileVersion === profile.updatedAt`.
  Older fit-notes (from a previous profile version) are considered
  "stale" and re-generated. This is the same staleness rule the manual
  "regenerate" button effectively follows.
- **Alternatives:** Time-based ("regenerate if older than N days").
  Rejected — `profile.updatedAt` is the real semantic axis (when
  Aadi's stated concerns/frames change, *all* fit-notes are stale).
- **Would change if:** We add a "company.updatedAt" axis for re-gen
  triggered by company-side evidence changes. That's the Glyphie
  nightly hook — orthogonal, additive.

### A6.3 — Skipped adding a `generated_by` column ('manual' | 'nightly').

- **Assumed:** The refactor doc calls this "optional" for telemetry.
  Adding it means a migration (0011) + DB rewrite + plumbing through
  both call-sites. Not blocking for v0.7.2 — telemetry can land in a
  v0.7.3 micro-pass once the Glyphie nightly hook actually exists
  (which is on Glyphie's plate, not main).
- **Alternatives:** Add the migration now. Rejected — premature; no
  consumer of the column exists yet.
- **Would change if:** Glyphie ships the nightly hook and we want to
  distinguish manual-regens from her auto-regens in any UI / log.

### A6.4 — Card empty-state copy left as-is ("No fit note yet. Click `generate`…").

- **Assumed:** Backfill is complete for all 70 companies, but the
  empty-state is still useful as a graceful fallback for *future*
  companies added between backfill runs (or before Glyphie's nightly
  hook fires). Removing the empty-state would mean a card with no
  fit-note shows nothing — worse UX.
- **Alternatives:** Replace the empty-state with a "fit note pending —
  Glyphie will write one tonight" message. Rejected — that's only
  accurate once Glyphie's nightly hook actually runs, which is in her
  branch, not main.
- **Would change if:** Glyphie's hook ships and is reliable; then the
  empty-state can promise a same-day fit-note.

### A6.5 — Glyphie nightly hook owned by Glyphie, not implemented from main.

- **Assumed:** Per the AGENTS split, the Glyphie agent owns her own
  daily cron + branch. I shouldn't push to her branch from main. I
  appended a handoff note to `research/glyphie-notes/2026-06-24.md`
  describing the hook contract; Glyphie will implement on her next
  daily turn.
- **Alternatives:** Implement the hook in main and call her cron from
  here. Rejected — cross-agent coupling; respects domain split.
- **Would change if:** The split changes, or Glyphie explicitly defers
  it back to me.
