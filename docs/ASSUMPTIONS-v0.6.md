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

## Step 7 — Compare with alt-weights sandbox (2026-06-23 13:35 UTC)

- **Assumed:** Sandbox weights live in client state only — no persistence, no URL serialisation. Refreshing the page resets the sandbox to the user's saved weights.
  - Alternatives: (a) persist sandbox to localStorage; (b) encode in query string so a sandbox view is shareable.
  - Would change if: Aadi says "I tuned the sandbox, switched tabs, and lost my exploration" — then promote to localStorage.

- **Assumed:** Rationales collapsed by default with click-to-expand per cell. No bulk "expand all" affordance yet.
  - Alternatives: rationales visible by default (heavier wall of text); top-level toggle.
  - Would change if: Aadi reports he wants to scan rationales side-by-side without clicking through.

- **Assumed:** "Recent activity" column (called out in §3.4) is deferred from step 7. The aggregate row + per-frame rationales were the load-bearing comparison surface; the activity strip is a nice-to-have we can fold in alongside step 13's curation pass.
  - Alternatives: ship the 90-day dot pattern now (we have the bucketing logic in `getRankedHomeData`).
  - Would change if: step 7 review flags the comparison as feeling thin without temporal signal.

- **Assumed:** Companies in the comparison table are auto-sorted by sandbox-overall (descending). Selection chip order is preserved in the picker but the table re-orders to show ranking.
  - Alternatives: respect insertion order; let user toggle sort.
  - Would change if: comparing-by-rank turns out less useful than comparing-in-Aadi's-selection-order.

## Step 8 — Surprise modal (2026-06-23 13:55 UTC)

- **Assumed:** `claude-3-5-haiku-latest` is the right model for the
  "why this pick" sentence (≤30 words, one call per pick, up to 3 picks
  per session).
  - Alternatives: sonnet (more nuanced, ~5× cost), template-only (zero
    cost, less voice).
  - Would change if: lines feel flat or repetitive in re-curation. Bump
    to sonnet for the surprise surface only — it's bounded at 3 calls
    per session, so cost ceiling is tiny.

- **Assumed:** `company_notes` presence is the right engagement proxy
  ("user has opened this company"). No separate view-history table.
  - Alternatives: add a `company_views` table + write on detail-page
    load; or use cookie-based session view history.
  - Would change if: Aadi reports the surprise repeatedly pitches
    companies he's clearly read but not written notes on.

- **Assumed:** Modal resets pick state on close — picks do NOT persist
  across re-opens of the modal in the same session.
  - Alternatives: persist to sessionStorage so closing/reopening keeps
    the cat "tired" until full page reload.
  - Would change if: closing the modal accidentally is annoying — Aadi
    loses his 3 picks. Then promote to sessionStorage with a "fresh
    deck" affordance.

- **Assumed:** "Recency" looks back **21 days** and requires score
  ≥3.5 on the user's top-weighted frame for relevance.
  - Alternatives: 7 days (tighter, often empty); no score gate (any
    publication, ranked by date only).
  - Would change if: the variant is starving (no candidates) or noisy
    (irrelevant publications). Move to 14d gate-off as a first lever.

- **Assumed:** "Adjacency" uses score-on-top-frame within ±1.0 of the
  anchor as the similarity heuristic. Anchor = user-engaged top scorer.
  - Alternatives: cosine similarity across the full 6-frame vector (more
    "similar" semantically), or co-occurrence in user-clicked sets.
  - Would change if: adjacency picks feel arbitrary. 6-frame cosine is
    the natural upgrade and we already have all the scores.

## Step 9 — Per-company notes (2026-06-23 14:00 UTC)

- **Assumed:** `saveCompanyNotes` should *delete* the row when body
  trims to empty, rather than store an empty string.
  - Alternatives: keep an empty row (acts as a "this company was
    visited" marker); soft-delete with a `deleted_at` column.
  - Would change if: we later want the notes table to double as an
    engagement / view-history signal (see Step 8 assumption). Then
    keep empties and add `deleted_at` instead.

- **Assumed:** The /about notes index lists every note, ordered by
  `updatedAt` desc, with a flat ~220-char snippet inline (no search,
  no pagination, no per-company grouping).
  - Alternatives: search/filter box; group by tier or tag; full-body
    expansion in place; client-side fuzzy search.
  - Would change if: Aadi accumulates >30 notes and scrolling becomes
    the bottleneck. Add a simple substring filter first; search is
    cheap and avoids a heavier index.

- **Assumed:** The legacy `companies.notes` column stays untouched for
  now — the v0.4 free-text is left as dead data until the v0.5 kill
  sweep (Step 12) clears it. New writes only land in `company_notes`.
  - Alternatives: backfill `company_notes` from `companies.notes` on
    this commit; drop the legacy column immediately.
  - Would change if: Step 12 reveals real content in `companies.notes`
    worth preserving — then add a one-shot backfill migration before
    dropping the column.

## Step 10 — Consultation submissions pipeline (2026-06-23 15:40 UTC)

- **Assumed:** v0.6 ships with a *hand-curated* seed of public
  consultation submissions (`src/db/consultations-seed.json`, ~28 rows
  across 21 slugs) rather than a live scraper. The cron route only
  re-ingests the seed file.
  - Alternatives: build a gov.uk + EU Have-Your-Say scraper now;
    skip the table and infer consultation behaviour from publications.
  - Would change if: Fatima wants real-time signal — then add a scraper
    that writes `source = 'scraped'` rows. Schema and scoring already
    handle that case.

- **Assumed:** `(company_id, consultation_name)` is the dedupe key.
  Re-ingestion is upsert: existing rows get their summary / topics /
  url / submittedAt overwritten from the seed.
  - Alternatives: include regulator + jurisdiction in the key (allows
    the same consultation name across regulators); never-update,
    insert-only.
  - Would change if: a regulator name actually collides across
    jurisdictions in the curated set. None do today.

- **Assumed:** The scoring engine treats consultation submissions as a
  slightly higher-signal evidence kind than publications or lobbying
  records — citation weight `1.2` vs `1.0`. They're the company's own
  arguments to a regulator, not blog spin.
  - Alternatives: equal weight (1.0) across all evidence kinds.
  - Would change if: we find Anthropic citations skew artificially
    toward submissions in spot-checks. Easy single-number knob.

- **Assumed:** Vercel cron schedule for ingestion is weekly
  (`15 7 * * 1` — Mondays 07:15 UTC). The seed is small and curated;
  daily would just be noise.
  - Alternatives: daily; manual-only (no cron).
  - Would change if: the seed grows past a few hundred rows or a
    scraper lands. Bump to daily then.

## Step 11 — Safety frameworks pipeline (2026-06-23 15:55 UTC)

- **Assumed:** v0.6 ships with a *hand-curated* seed of safety
  frameworks (`src/db/safety-frameworks-seed.json`, 19 rows across 17
  slugs) — no scraper. These documents update once or twice a year per
  lab; weekly re-ingest is overkill but cheap.
  - Alternatives: build an RSP scraper now; auto-watch a list of URLs
    with diff detection.
  - Would change if: Fatima wants automated change-detection on
    e.g. Anthropic's RSP page. Schema already supports `source =
    'scraped'` for that path.

- **Assumed:** Dedupe key is `(company_id, title)`. Re-ingestion is
  upsert: existing rows get their `version`, `url`, `publishedAt`,
  `summary`, `commitments`, `strength`, `rawExcerpt`, `source`
  overwritten from the seed.
  - Alternatives: include `framework_type` in the key (would allow the
    same title across types); include `version` (would create a new
    row per version, useful for history).
  - Would change if: we want a version history of RSPs over time. Add
    a separate `safety_framework_versions` child table then.

- **Assumed:** Safety frameworks are the *highest-signal* of the four
  evidence kinds — citation weight `1.5` (vs submissions `1.2`,
  publications/lobbying `1.0`). These are the company's own committed
  posture, harder to walk back than a blog or a regulator filing.
  - Alternatives: equal weight (1.0); higher weight when `strength >=
    4`; downweight aspirational AUPs.
  - Would change if: spot-checks show the model over-anchors on RSPs
    relative to actual behaviour. Strength-aware weighting is the
    obvious next knob.

- **Assumed:** Editorial `strength` (1–5) is stored but *not* fed into
  the scoring prompt this release — it'll be used for a UI hint on the
  evidence panel later (e.g. "⚖️ named thresholds" vs "📝 principles").
  The model sees `commitments[]` instead, which is more legible.
  - Alternatives: feed strength to the model as a numeric prior;
    expose it in the rationale.
  - Would change if: the rationales come back over-trusting weak
    governance charters. Then pipe strength into the prompt.

- **Assumed:** Vercel cron schedule is weekly (`30 7 * * 1` — Mondays
  07:30 UTC, 15 minutes after the consultations job).
  - Alternatives: monthly; manual-only.
  - Would change if: a scraper lands. Bump to daily then.

- **Assumed:** The 19-row seed is enough breadth for v0.6 ship. The
  long tail of the 70 companies (policy think tanks, consultancies,
  regulators) don't publish their *own* safety frameworks — they
  comment on others'. Leaving those rows empty is correct, not a gap.
  - Alternatives: invent placeholder rows for all 70; treat each
    regulator's published "AI assurance approach" as a framework row.
  - Would change if: we want regulator framing docs (e.g. CMA's
    AI-foundation-models update) treated as evidence. Add them under
    `framework_type = 'governance_charter'` then.

## 2026-06-23 16:10 UTC · Step 11.5 · Auto-rescore on frame edit + animated cat

Overrides the deferred-rescore assumption from Step 6. Per `v0.6-FATIMA-FEEDBACK.md`
(2026-06-23 15:43 UTC), frame definition edits now fan out a background
rescore across every company; an animated pixel cat in the bottom-right
surfaces while cells are stale.

- **Assumed:** Background fan-out via Next 16's `after(() => …)` inside the
  `updateFrame` server action. Returns the action immediately; the worker
  rescores each (company × frame) cell sequentially.
  - Alternatives: queue table + cron drainer; client-side fire-and-forget
    fetch to a worker route. Rejected — `after` is the canonical primitive
    on Vercel for "do this after the response flushes" and it survives the
    function lifetime under the same invocation.
  - Would change if: a single frame edit blows past the Vercel function
    `maxDuration` for 70 companies. Then chunk into multiple `after` slices
    triggered by an internal route.

- **Assumed:** "Meaningful change" = trimmed/whitespace-normalised diff of
  `name`, `description`, `kind`, `scale`, `lowLabel`, `highLabel`, `prompt`.
  `lowDescription`/`highDescription` are in the schema but not yet exposed
  in the FramesEditor UI; they're omitted from the diff so reads-as-null
  doesn't false-positive into a rescore.
  - Alternatives: SHA-hash the prompt the model would actually see and
    compare. More semantically correct, but requires invoking the prompt
    builder server-side just to diff.
  - Would change if: editorial descriptions land in the form. Add them.

- **Assumed:** 2-second debounce isn't *currently* needed because the
  FramesEditor saves on explicit form submit (not per-keystroke). Live-edit
  debounce becomes relevant only when we move to keystroke-saving. Skipping
  it for now means simpler code; the "no double rescore for the same frame
  version" guarantee is provided by the worker setting `stale_at` up-front
  and the action only firing on save.
  - Alternatives: implement the 2s debounce client-side anyway, in case the
    form gains autosave.
  - Would change if: per-keystroke saves land. Then add a `setTimeout(…2000)`
    client-side around the rescore trigger.

- **Assumed:** `stale_at timestamptz` column on `frame_scores` is the single
  source of truth for "cell in flight". `/api/rescore-status` counts rows
  where `stale_at IS NOT NULL`; the cat polls every 2s while pending and
  every 8s while idle.
  - Alternatives: Redis/PG NOTIFY pub-sub; client-side optimistic state only.
  - Would change if: poll volume gets visible in logs. Switch idle poll to
    every 30s, or move to Server-Sent Events.

- **Assumed:** Animated cat is a CSS-only treatment over the existing
  `public/cat/lobbycat.png` sprite — tail-sway keyframes + a brightness
  blink — not a sprite-sheet. Sprite-sheet animation can land later under
  `public/cat/pixel/sprites.png` (which already exists).
  - Alternatives: ship the sprite-sheet animation now.
  - Would change if: Fatima wants the animation richer for the v0.6 LIVE
    moment. Swap in a `steps()` background-position animation against the
    existing sprite sheet.

- **Assumed:** `/api/rescore-status` is unauthenticated — payload is just
  counts and frame ids, no user data, no rate-limit concern at Aadi's
  traffic volume.
  - Alternatives: gate behind the existing session cookie.
  - Would change if: lobbycat ever becomes multi-tenant.
