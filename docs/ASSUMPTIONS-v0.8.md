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
