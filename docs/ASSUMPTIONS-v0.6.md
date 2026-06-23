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

## 2026-06-23 12:55 UTC · Step 4 scoring engine · model = claude-3-5-sonnet-latest
- **Assumption:** Sonnet is the right cost/quality tradeoff for per-cell scoring (420 cells × ~1 rescore/day worst case). Haiku is too thin for nuanced 1–5 rationales; Opus is overkill at the scale we'd be running.
- **Alternative considered:** Haiku with stricter prompt + multi-shot examples (cheaper, less consistent), or Opus (better but ~10× cost). Rejected for v0.6 — Sonnet is what we already use for fit-notes; one model, fewer surprises.
- **Would change if:** rescore costs blow up (>$5/day on Aadi alone) or rationale quality is visibly thin in re-curation. Then switch to Haiku for "stale-but-evidence-unchanged" refresh path only.

## 2026-06-23 12:55 UTC · Step 4 scoring engine · short-circuit on evidence_version hash
- **Assumption:** If the (publications+lobbying) evidence set is byte-identical to what was used last time, returning the existing score without re-calling Anthropic is correct. Frame definition changes go through `force: true` from the frames page.
- **Alternative considered:** always re-call (simpler, no hash) or hash on prompt text rather than evidence ids (more semantically correct but brittle to wording tweaks). Rejected — id-based hash is robust enough and saves the $$.
- **Would change if:** we see scores drift between definition versions without rescoring. Then expose evidence_version + profile_version on the staleness UI and force-rescore when either changes.

## 2026-06-23 12:55 UTC · Step 4 scoring engine · cron pulls 20 cells/run, prioritises never-scored then oldest
- **Assumption:** A nightly /api/cron/rescore picking the 20 stalest (company, frame) cells balances Vercel function budget (under maxDuration=300s) and catch-up rate (covers 420 cells over ~3 weeks of nightly runs, or instantly via manual ?max=420 trigger). Catch-up doesn't need to be aggressive — interactive rescore lives behind the home button.
- **Alternative considered:** rescore everything nightly (would blow function budget + cost), or only rescore on demand (then never-scored cells stay empty forever). Rejected.
- **Would change if:** 20/run feels too slow in practice. The `?max=` knob is right there — Fatima can punch up the schedule cap.

## 2026-06-23 12:55 UTC · Step 4 scoring engine · client-side aggregate (useLiveAggregates) is the source of truth for ranking
- **Assumption:** Aggregate = weighted mean of per-frame scores using L=1/M=2/H=3 multipliers. No persisted aggregate column — the table re-ranks instantly on weight change without a server round trip. Per-frame scores remain server-authoritative.
- **Alternative considered:** persist `aggregate_score` and re-server-render on weight change. Rejected — adds latency and a stale-cache class of bugs for zero correctness benefit.
- **Would change if:** Aadi wants ranking that's not a weighted mean (e.g. lexicographic by highest-weight frame). Then promote ranking to a strategy fn but keep client-side eval.

## 2026-06-23 13:20 UTC · Step 6 · Frame definition edits do NOT auto-rescore
- **Assumption:** Saving a frame name/lowLabel/highLabel/description does not
  fire `rescoreCompanyFrame` for every affected (company × frame) cell. Step 6
  ships the L/M/H weights panel and keeps the existing `updateFrame` action
  unchanged. Aadi can still trigger a rescore via the home "re-score now"
  button when scores look stale, and step 13's re-curation pass does the full
  reseed.
- **Alternative considered:** Hook `rescoreCompanyFrame` into `updateFrame` as
  a fire-and-forget. Rejected for v0.6 — a typo in a label would cost 70 Sonnet
  calls. Better to give Aadi an explicit "rescore this frame" button later
  (step 13 / v0.6.1) once the editorial muscle is built.
- **Would change if:** Anthropic cost drops by 5× OR the dataset stays <30
  companies AND Fatima explicitly asks for live rescoring on label edits.
