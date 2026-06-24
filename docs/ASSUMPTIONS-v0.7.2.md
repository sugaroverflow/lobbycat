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



