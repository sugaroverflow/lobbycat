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
