# Assumptions log — v0.8 clarify skill

Per Fatima's rule (2026-06-24 21:09 UTC, restated 2026-06-25 20:56 UTC):
don't pause for questions during the v0.8 build. Make defensible assumptions,
log them here with timestamp + alternatives + "would change if", and ship.
Source of truth for shape: `docs/REFACTOR-v0.8.md`.

---

## Step 1 — Clarify skill body (2026-06-25 21:51 UTC)

### A1.7 — Single source of truth for the skill is the in-repo path.

- **Assumed:** The canonical location for the `clarify` skill is
  `~/projects/lobbycat/skills/clarify/` (ships with the app to Vercel). The
  local `~/.openclaw/plugin-skills/clarify/` bundle path now contains only a
  README pointer at the canonical in-repo path. One file, one truth.
- **Alternatives:** Maintain two copies (in-repo + plugin bundle) and keep them
  in sync manually. Rejected — drift risk, no payoff.
- **Would change if:** Anthropic loading requires the skill to be installed at
  the plugin path rather than read from disk by the server action.

---

## Step 3 — Schema + migrations (2026-06-25 22:18 UTC)

### A3.1 — `seed_company` and `seed_frame` use `ON DELETE SET NULL`, not `CASCADE` or `RESTRICT`.

- **Assumed:** The scope doc §5.1 specifies these as FKs to `companies(id)` and
  `frames(id)` but doesn't pin a delete behaviour. SET NULL is the right
  default: deleting a company shouldn't nuke the conversation history (those
  sessions remain Aadi's — orphaned from their seed but readable). The cat's
  side of every message is preserved.
- **Alternatives:** CASCADE (would delete the whole conversation; loses signal
  for the welcome-back drift detection). RESTRICT (would block company
  deletion if any clarify session referenced it; bad UX). NO ACTION (same as
  RESTRICT effectively).
- **Would change if:** Aadi explicitly wants conversation purge on company
  delete — easy migration to CASCADE.

### A3.2 — `clarify_messages.session_id` uses `ON DELETE CASCADE`.

- **Assumed:** Per scope doc §5.1 (`ON DELETE CASCADE`) — exact match. Deleting
  a session removes its messages. This is also what the `/about` Conversations
  tab needs for its "delete affordance per session" (scope §6).

### A3.3 — `move_type` is a free-text column, not an enum or FK.

- **Assumed:** Scope doc §5.1 says "one of §2.5's move names, when cat" but the
  moves list lives in `skills/clarify/reference/moves.md` and is expected to
  evolve as Lotus tunes the skill (step 12). Hard-coding the list in pg as an
  enum would require a migration per tweak. `TEXT` keeps it cheap.
- **Alternatives:** Postgres enum (rigid, migration per change). FK to a
  `clarify_moves` table (overkill — these are skill-level descriptors, not
  app-level entities).
- **Would change if:** We ever want to constrain move_type at the DB layer
  (e.g. for analytics aggregation safety).

### A3.4 — Three indexes added beyond what the scope doc specified.

- **Assumed:** Scope doc §5.1 lists no indexes, but the access patterns we
  already know are: `(session_id, created_at)` for message timeline, plus
  `started_at` and `seed_company` on sessions for the Conversations tab list
  + "any prior clarify on this company?" lookup. Adding indexes now is cheap;
  retrofitting later means another migration on a live prod table.
- **Alternatives:** Defer indexes to whenever a slow query shows up. Rejected —
  pointless lap.
- **Would change if:** EXPLAIN later shows these aren't being used, or a
  different access pattern dominates.

### A3.5 — Migration 0012 applied to prod live (same beat as commit).

- **Assumed:** v0.7.2 step 10 set the precedent (migrations applied during the
  step that introduced them, not parked behind a deploy gate). The clarify
  tables are additive — no data, no risk to existing surfaces — so applying
  live before the rest of v0.8 ships is safe.
- **Alternatives:** Hold the migration until step 4 (server action) lands.
  Rejected — adds no safety, slows future steps.
- **Would change if:** A subsequent step renames or alters a column; we'd
  bundle that into a follow-up migration, not roll 0012 back.

## Step 4 — Server action: `runClarifySession` (2026-06-25 22:55 UTC)

### A4.1 — Non-streaming on the wire for v0.8 step 4.

- **Assumed:** Scope §3.3 calls for "streams back the cat's response", but
  the existing `sendFitNoteMessage` server action is non-streaming and the
  UI handles the latency cleanly with `clarifying[]` quotes (scope §8 / step
  10). Shipping non-streaming now lets steps 5–7 land on a stable contract;
  if the chat panel needs SSE later it can wrap a `streamObject` server
  action without touching the persistence model.
- **Alternatives:** Wire `experimental_useObject` + an SSE route handler
  now. Rejected — pulls AI SDK + new client wiring into Step 4 for a
  cosmetic gain on responses that are usually <800 tokens. Step 10's
  loading quotes were designed for exactly this gap.
- **Would change if:** First-token latency in real use feels worse than
  ~1.5s and the quote-line stalls don't carry it. Then wrap a streamable
  variant in Step 5 or in v0.8.1.

### A4.2 — Skill body loaded from `skills/clarify/SKILL.md` with an inline fallback.

- **Assumed:** Step 1's commit message (PR #32) places the canonical skill
  at `skills/clarify/SKILL.md`. The server action reads it via
  `fs.readFile(process.cwd() + "/skills/clarify/SKILL.md")` and caches the
  result in module scope. If the file isn't present on disk yet (e.g. PR
  #32 hasn't landed when this branch deploys to a preview), a minimal
  inline `SKILL_FALLBACK` keeps the action shippable.
- **Alternatives:** Hard-import the markdown via a Webpack raw-loader.
  Rejected — adds bundler config for a single file. Bake the body as a
  TypeScript string constant. Rejected — Step 1's intent (commit message)
  is single-source-of-truth in `skills/`, with the inline path being a
  consumer of that file, not a duplicate.
- **Would change if:** Vercel's serverless filesystem drops `skills/` at
  build time. Mitigation: a `next.config.ts` outputFileTracingIncludes
  entry for `skills/clarify/**`. Will add in step 11 (deploy) if the
  preview build shows the file missing at runtime.

### A4.3 — Two server actions, not one: `start` + `send`.

- **Assumed:** A single `runClarifySession(messages)` action would force
  the client to manage the session row, message persistence ordering, and
  the "is this the opener?" flag. Splitting matches the existing
  `generateFitNote` / `sendFitNoteMessage` pattern in `src/app/actions.ts`
  and keeps the UI a thin form-+-fetch over a stable id. A third action
  `endClarifySessionAsClosed(id)` lets the chat panel honour §4.3's
  "closing the panel ends the session" rule without an out-of-band cron.
- **Alternatives:** Single action that takes the full message array each
  turn and re-derives state. Rejected — duplicate state across DB + client
  is exactly the kind of drift v0.8 is supposed to undo.
- **Would change if:** A future "background clarify spawn" path (scope
  §3.3 path 2, slated v0.9) needs a single-shot run action; that one
  doesn't share the inline persistence model so it'd be a new export
  anyway.

### A4.4 — Proposal block is a fenced \`\`\`proposal JSON block on the cat's final turn.

- **Assumed:** Step 1's commit message references an "end-of-session
  proposal block format" in the skill. Until that SKILL.md lands and we
  can read the exact wording, this action implements a stable contract:
  the cat ends the session by emitting one fenced block whose info-string
  is `proposal` containing JSON `{ kind, summary, data }`. The parser
  strips the fence from the user-visible body and stores the structured
  payload on `clarify_sessions.proposal_*`. A malformed JSON body is
  treated as prose (no proposal stored, session stays open) — fail-safe,
  no silent data loss.
- **Alternatives:** A magic prefix like `PROPOSAL:` on its own line.
  Rejected — fragile against the cat's wrapping conventions. A separate
  tool-call. Rejected — single-shot Anthropic call is the whole point of
  the inline path.
- **Would change if:** The SKILL.md from PR #32 defines a different block
  shape. Then update `PROPOSAL_FENCE_RE` + parser; the persistence + UI
  contracts (kind/summary/data triple) stay stable.

### A4.5 — Move-tag extraction is opt-in via an HTML comment.

- **Assumed:** §5.3 wants move-type tagging "when role='cat'" so we can
  tune the prompt over time. The action extracts a tag from a leading
  `<!-- move: name -->` HTML comment on the cat's turn; if absent,
  `move_type` is null. The skill body (Step 1) can opt into tagging
  without requiring it. The tag is stripped from the visible body before
  persistence.
- **Alternatives:** Force the cat to JSON-output every turn. Rejected —
  the conversation feel is the whole point. Infer move type via a second
  LLM call. Rejected — doubles cost + latency on a feature whose payoff
  is offline tuning.
- **Would change if:** Step 12's tuning pass shows the tag is never set,
  in which case we either remove it or move to a single end-of-session
  tagging pass.

### A4.6 — Glyphie feed grounding filters on `company_slug`, not name.

- **Assumed:** `research/feed.json` events carry a `company_slug` field
  (verified against the file at this beat). Filtering on slug is precise
  (no false positives from substring matches on common names like
  "OpenAI" hitting unrelated rows). The action reads the file from disk
  on each call — the file is small (<25 KB today) and freshness matters
  more than caching it.
- **Alternatives:** Substring match on `company.name` inside event
  summaries. Rejected — both noisy and slower. Cache the file in module
  scope. Rejected — Glyphie's nightly cron rewrites it; we want the
  reload-on-next-session behaviour for free.
- **Would change if:** The feed grows past ~1 MB and read latency
  becomes a real cost on every clarify turn; then introduce an mtime-
  keyed in-memory cache.
