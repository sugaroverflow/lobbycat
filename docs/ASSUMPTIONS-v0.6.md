# Lobbycat v0.6 — Build assumptions log

Defensible assumptions made during the v0.6 build, per Fatima's "do not pause for questions, log and ship" rule (2026-06-23).

Format: timestamp · area · assumption · alternative considered · would-change-if.

---

## 2026-06-23 12:25 UTC · Step 3 schema · `frame_scores.score` switched from `integer` to `numeric(2,1)` in place
- **Assumption:** Existing integer scores (e.g. `4`) cast cleanly to `4.0` under `numeric(2,1)`. PG handles the implicit cast on `ALTER COLUMN ... SET DATA TYPE` — no `USING` clause needed.
- **Alternative considered:** add a new `score_decimal` column, dual-write for one release, drop the old one in v0.6.1. Rejected because v0.6 is the engine pivot — no live external consumer of the old shape (only Aadi), and the editorial debt of two score columns outweighs the migration cleanliness.
- **Would change if:** we discover production data containing non-integer values written through a path I missed (currently impossible — only path was `integer`), or PG raises a casting error on Neon (it didn't — migration applied cleanly).

## 2026-06-23 12:25 UTC · Step 3 schema · drizzle `numeric` returns string at runtime
- **Assumption:** Convert score to `Number(...)` at read boundaries (queries.ts, hooks) and `.toFixed(1)` at write boundaries (actions). Don't try to swap drizzle's runtime to coerce — the type signature is honest about pg returning strings for arbitrary-precision numerics.
- **Alternative considered:** custom `score: numeric(...).$type<number>()` cast — rejected because it lies at the boundary (runtime is still string), causing bugs in downstream math.
- **Would change if:** drizzle ships a `mode: 'number'` opt-in for `numeric` (it has for `integer`/`bigint` but not numeric as of 0.45.x). Reassess on each drizzle bump.

## 2026-06-23 12:25 UTC · Step 3 schema · `frame_weights` defaults to all-`medium` map
- **Assumption:** Existing `user_profile` row (single-row table) gets `{ "1"..."6": "medium" }` via the column default — no separate backfill needed, since `ADD COLUMN ... NOT NULL DEFAULT jsonb_value` populates existing rows.
- **Alternative considered:** explicit `UPDATE user_profile SET frame_weights = '...'::jsonb` step. Rejected — `ADD COLUMN ... NOT NULL DEFAULT` does the backfill atomically and PG 12+ does it in O(1) for plain defaults.
- **Would change if:** we add a 7th frame in v0.6 itself (none planned; user-added frames are v0.7).

## 2026-06-23 12:25 UTC · Step 3 schema · Kept legacy columns alive (`user_profile.weights`, `frame_scores` integer-style consumers)
- **Assumption:** v0.5 surfaces that read `weights`, `frame_answers`, and free-text-intent paths continue to function during the v0.6 build so Aadi's existing data isn't ghosted mid-refactor. Step 12 will kill them in one sweep.
- **Alternative considered:** delete legacy in step 3 itself. Rejected — would break the running deployed site between steps 3 and 12.
- **Would change if:** Fatima signals she'd rather ship v0.6 dark (behind a flag) and switch atomically. Current direction is incremental ship per chunk.

## 2026-06-23 12:25 UTC · Step 3 schema · `frame_score_evidence.evidence_id` is a bare `integer`, not a discriminated FK
- **Assumption:** Validating `(evidence_kind, evidence_id)` joins client-side is cheaper than enforcing PG-level FKs across five different parent tables (publications, roles, lobbying_records, consultation_submissions, safety_frameworks). Postgres polymorphic FKs are awkward; we eat the cost in the application layer.
- **Alternative considered:** one nullable FK column per evidence kind (`publication_id`, `role_id`, …). Rejected — schema bloat and CHECK constraint maintenance.
- **Would change if:** we get a sync-drift bug where evidence rows reference deleted parents. Then add periodic cleanup queries or move to the per-kind-column shape.
