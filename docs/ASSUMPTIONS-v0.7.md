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
