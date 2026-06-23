# ASSUMPTIONS — v0.7 build log

Per Fatima's rule: defensible assumptions, alternatives considered, "would
change if" trigger. Updated chunk-by-chunk during the v0.7 build.

---

## Step 2 — Schema migrations (2026-06-23)

### A. `wizard_completed_at` is nullable, no default
- **Assumed:** `wizard_completed_at TIMESTAMPTZ` (nullable, no default).
  Set on wizard step-6 submit; absence = "show wizard, not dashboard."
- **Alternatives:** `boolean wizard_completed` (loses "when"); default
  `now()` (would mark the existing user as completed → they'd skip the
  wizard and never see v0.7's main flow).
- **Would change if:** Fatima wants to backfill the existing user as
  completed so they jump straight to the dashboard (then we set
  `wizard_completed_at = now()` in a follow-up). Default for v0.7 is
  the opposite — Aadi should *see* the new wizard.

### B. `current_role_one_liner` is plain TEXT (not headline)
- **Assumed:** new column `current_role_one_liner TEXT`. Doesn't reuse
  the existing `headline` column even though the semantics overlap.
- **Why:** the wizard's step-2 question is more specific ("what you do
  right now, one line") than the v0.5 `headline`. Keeping them separate
  preserves the v0.5/v0.6 headline if Fatima ever wants it back, and
  avoids a one-way data migration.
- **Would change if:** at sweep-time (Step 12) Fatima wants `headline`
  killed and merged.

### C. `exploring_text` is TEXT, not JSONB
- **Assumed:** `exploring_text TEXT`. Free-text answer to "what are
  you exploring?" — single field, single answer.
- **Alternatives:** array-of-strings (multi-answer). Rejected because
  the wizard step is one prompt.

### D. `location_preferences` is JSONB, default `{}`
- **Assumed:** `location_preferences JSONB DEFAULT '{}'::jsonb NOT NULL`.
  Structure: `{ uk?: boolean, eu?: boolean, us?: boolean, remoteOk?: boolean, notes?: string }`.
- **Alternatives:** separate boolean columns. Rejected — likely to grow
  (Asia? hybrid? specific cities?), JSONB lets the wizard evolve without
  another migration.

### E. `open_text_answers` is JSONB ARRAY, default `[]`
- **Assumed:** `open_text_answers JSONB DEFAULT '[]'::jsonb NOT NULL`.
  Structure: `Array<{ question: string, answer: string, answeredAt: string }>`.
- **Why:** lets the wizard ask multiple open questions and lets future
  versions add new ones without a migration.

### F. Weight labels rename (must/should/could) — no DB change
- **Assumed:** `frameWeights` keeps the existing `low|medium|high`
  string values at the DB layer; the UI maps `must=high`, `should=medium`,
  `could=low`. Numeric aggregate (1/2/3) is unchanged.
- **Why:** zero-migration rename. The aggregate code in
  `src/lib/scoring/aggregate.ts` doesn't have to know about the rename.
- **Would change if:** Fatima wants the DB strings to literally read
  `must|should|could` (then a one-shot update + enum-style swap).

---

## Step 3 — Vaporwave token system (2026-06-23 20:50 UTC)

### A. Role names preserved across the palette swap
- **Assumed:** vaporwave.css keeps the v0.5 Machine role names
  (`--bg-canvas`, `--fg-prose`, `--accent-action`, `--readout-cyan`,
  `--signal-coral`, `--rule`, etc.) and only changes the *values*. No
  component rewrite required at this step.
- **Alternatives:** rename to vaporwave-shaped tokens
  (`--vw-void`, `--vw-magenta`, etc.) and migrate all callsites. Rejected
  — §10 Step 3 explicitly says "no surface changes yet — just tokens";
  doing a rename now blows up the build and forces every component to
  ship in this chunk.
- **Would change if:** Step 12 sweep decides the role names should be
  vaporwave-flavoured for clarity. Renames happen there.

### B. `--signal-coral` role repointed to sunset orange (#FF9900)
- **Assumed:** the v0.5 "coral" signal role (rare attention-grab —
  errors, recent-change tag) takes vaporwave's sunset orange #FF9900.
  Functionally identical (warm, eye-catching, rare).
- **Alternatives:** keep coral hex. Rejected — coral clashes with the
  hot-magenta primary; sunset orange is the canonical third accent in
  the vaporwave spec.
- **Would change if:** Fatima wants pink reserved exclusively for
  primary action and a different colour family for the signal role.

### C. Fonts: Orbitron + Share Tech Mono (Google Fonts)
- **Assumed:** `next/font/google` loads both. Orbitron weights 400, 500,
  700, 900 (headings, hero); Share Tech Mono weight 400 (body, UI,
  labels). Wired via `--font-sans-loaded` / `--font-mono-loaded` so the
  vaporwave.css token chain is the single point of swap.
- **Alternatives:** self-host woff2 from /public. Rejected for v0.7 —
  next/font handles preconnect + subsetting; revisit at perf-tune time.
- **Would change if:** layout shifts on cold start prove distracting
  (then we self-host with `display: optional`).

### D. Radii tightened (--radius-tight 4 → 2px, --radius-panel 10 → 4px)
- **Assumed:** vaporwave is aggressively geometric — prefer near-square.
  Existing components keep their `rounded-*` classes; the token value
  shrinks under them.
- **Alternatives:** keep v0.5 radii. Rejected because rounded panels
  fight the perspective-grid aesthetic on the theatre surfaces.
- **Would change if:** the calm-cousin dashboard looks too brutalist
  once we land the cards in Step 6 (then bump --radius-panel back to 8).

### E. machine.css left in place (not yet deleted)
- **Assumed:** `src/styles/machine.css` is no longer imported by
  globals.css but still exists on disk. The `src/app/machine-test`
  preview route still exists too.
- **Why:** §9 + §10 Step 12 ("Sweep deletion") is the dedicated chunk
  for purging Machine residue. Deleting now would mean half-purged
  state across multiple chunks.
- **Would change if:** machine-test ever imports a token that leaks into
  production (it doesn't — it's an isolated preview route).

### F. `firstScoring[]` (14) and `fitNoting[]` (12) line counts
- **Assumed:** 14 and 12 lines respectively, both in lobbycat's dry
  third-person voice. Above the 10-15 minimum the refactor doc suggests.
- **Would change if:** Fatima edits them down or adds her own.

## Step 4 — The wizard (2026-06-23 20:50 UTC)

### G. Single-user `user_profile` row
- **Assumed:** the wizard reads/writes the single shared `user_profile`
  row (since lobbycat is one-Aadi-per-deploy gated behind a shared
  password). If no row exists, `getOrCreateProfile` inserts one with
  `displayName: "you"` as a holding value, overwritten in step 2.
- **Alternatives:** key the wizard to the cookie/session. Rejected —
  there is no per-user identity yet; the deploy gate IS the user.
- **Would change if:** v0.8+ introduces multi-user.

### H. Existing v0.5/v0.6 profiles get the new wizard, not a grandfather
- **Assumed:** if `onboardedAt` is set but `wizardCompletedAt` is null
  (any existing data), the home page redirects to `/wizard`. The
  v0.6 free-text intent + L/M/H weights survive; the wizard just makes
  Aadi confirm/edit them under the new copy.
- **Alternatives:** auto-stamp `wizardCompletedAt` = `onboardedAt`
  for existing rows. Rejected — the wizard *is* the new front door;
  shipping it without forcing one pass means existing users never see
  the cards-first dashboard or Glyphie diff card properly.
- **Would change if:** Fatima wants to skip the wizard on staging while
  she's iterating — easy: pass `?replay=1` on /wizard or set
  `wizardCompletedAt` manually in psql.

### I. Step 3 is rename-only inside the wizard
- **Assumed:** the wizard's frames step lets Aadi rename the six
  pre-seeded frames inline (autosaves on blur) and links to /frames
  for fuller edits (descriptions, new frames, deletes). This keeps the
  wizard ~5-7 min as scoped.
- **Alternatives:** embed the full FramesEditor inline. Rejected — the
  editor is heavy (modal, tag/question kinds, suggest-frames) and would
  blow the time budget. Linking out keeps the wizard linear.
- **Would change if:** Aadi opens /frames mid-wizard and the autosave
  state confuses him. Mitigation: separate tab; wizard step state is
  local to the component, server-side autosave persists everything.

### J. Step 4 weight glyphs: M / S / C (Must / Should / Could)
- **Assumed:** the existing `low | medium | high` schema is reused with
  a UI mapping `high → Must`, `medium → Should`, `low → Could`. This
  keeps the aggregate math + /frames page in sync without a schema
  change.
- **Alternatives:** add a third weight tier or a separate `mustHave`
  boolean column. Rejected — three tiers is enough, and a separate
  column means dual-write for /frames + wizard.
- **Would change if:** "Must" needs hard-filter semantics (currently
  it's just a weight multiplier). Then we add `mustHaveMin` per frame
  in a follow-up.

### K. Step 5 default open-text prompts
- **Assumed:** three hand-written prompts seed the answer list if
  nothing's saved. They go into `openTextAnswers` jsonb. Fit-note
  generation will start citing them in a later chunk (step 13 / fit-note
  refactor).
- **Would change if:** Fatima wants different prompts — edit
  `DEFAULT_OPEN_PROMPTS` in `src/components/wizard.tsx`.

### L. Step 6 is a basic skeleton; full vaporwave-theatre is Step 5 of build
- **Assumed:** this chunk ships a functional step 6 with progress bar +
  cycling `firstScoring[]` quotes + grid backdrop + sunset gradient,
  but NOT the full pixel-cat sprite, scanlines overlay, or 3D rotating
  perspective. Those land in §10 step 5 (next chunk).
- **Rescore fan-out:** runs in `after()` background so the UI's 25-sec
  theatre window is independent of how long rescoring 70 companies
  actually takes. If the rescore is slower than 25s, the home page
  shows the rescoring-cat indicator (already wired in v0.6) until cells
  clear.
- **Would change if:** rescore consistently takes >60s and Aadi sees
  empty scores on landing. Mitigation: bump theatre to a polling state
  that waits for `/api/rescore-status` to clear.

### M. Step 5 of build — wizard step-6 vaporwave-theatre takeover
- **Assumed:** the takeover lives as a `fixed inset-0` overlay rendered
  *inside* the Wizard section but breaks out of the wizard's max-w
  layout via fixed-positioning. The site-shell header is visually
  covered (z-index = `--z-modal`). I hide the progress bar on step 6
  so the moment reads as a moment, not a wizard step.
- **Alternatives:** route the user to a dedicated `/wizard/scoring`
  page that lives outside the SiteShell. Rejected — that would re-fire
  `completeWizard()` on a fresh component or require lifting it out of
  the wizard, both of which add risk on the ship deadline.
- **Cat sprite:** reuses `/cat/lobbycat.png` rather than the 5-pose
  `/cat/pixel/sprites.png` sheet. The sprite sheet is 1536×1024 with
  uneven cell boundaries (per the swatch-session brief, it still needs
  re-cutting to clean 64×64). Reusing the existing single sprite keeps
  the silhouette consistent with `rescoring-cat.tsx` and avoids cutting
  the sheet in this chunk.
- **Would change if:** Fatima wants pose cycling (idle → blink → paw-up).
  Then we re-cut sprites.png into per-pose PNGs and key off `quoteIdx`.
- **Theatre elements shipped:** full-screen overlay, deep-purple → hot-pink
  → orange sunset gradient, sun disc behind cat, animated perspective
  grid (scrolling 60px cells, magenta + cyan), CRT scanlines (multiply
  blend), pixel cat floating + glowing, Orbitron uppercase title with
  sunset-gradient text-clip, italic cycling quotes, sunset-gradient
  progress bar with magenta glow. `prefers-reduced-motion` disables
  cat-float and grid-scroll.
