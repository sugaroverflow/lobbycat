# Assumptions log — v0.8 the soul (clarify skill + Lobbycat-as-agent)

Per Fatima's standing rule (2026-06-24 21:09 UTC, reaffirmed 2026-06-25
20:56 UTC "why haven't you been shipping?"): don't pause for questions
during the v0.8 build. Make defensible assumptions, log them here with
timestamp + alternatives + "would change if", and ship. The plan of
record is `docs/REFACTOR-v0.8.md` (a copy of PR #16's scope doc). Follow
its §10 step order; permission to ship is already granted.

---

## Step 1 bootstrap — land scope doc + assumptions skeleton on main (2026-06-25 21:16 UTC)

### A1b.1 — Ship the v0.8 scope doc to main now, despite PR #16's "waiting on Fatima's v0.7 click-through" status.

- **Assumed:** The heartbeat playbook (`HEARTBEAT.md`, 2026-06-25) overrides
  the PR #16 ⚠️ wait-condition for *me, Lotus, doing build work*. The wait
  was for Fatima's sign-off on the *concept*; Fatima's 20:56 UTC message
  ("why haven't you been shipping?") explicitly authorised proceeding
  without that sign-off, while still respecting the §10 step order. So the
  doc lands on main now, in its current DRAFT-pending form, and §10 Step 2
  ("concept sign-off") remains a real future gate Fatima can apply by
  editing the doc or rejecting a later PR — but it doesn't block Step 1.
- **Alternatives:** Keep the doc on the `scope/v0.8` PR branch only and
  let Step 2 land it. Rejected — that's exactly the soak-spiral pattern
  the playbook calls out ("2026-06-25 lesson"), and it leaves later steps
  with no in-tree spec to reference.
- **Would change if:** Fatima says "pause" / "stop" / "wait", or
  substantively rewrites the scope doc on her side and wants me to rebase
  before any further v0.8 work.

### A1b.2 — Branch name `scope/v0.8-step1-doc-and-assumptions` instead of the cursor's `scope/v0.8/step1-<name>`.

- **Assumed:** `scope/v0.8` already exists as the open PR #16 head
  branch. Git refuses to create `scope/v0.8/<anything>` while a leaf ref
  with that prefix exists (D/F conflict). Flattening the second slash to
  a dash preserves the cursor's intent and keeps both branches alive.
- **Alternatives:** Delete the local `scope/v0.8` ref and re-create the
  hierarchy; rejected — that branch is the open PR. Or use a different
  prefix like `lotus/v0.8-step1-...`; rejected — keeps less continuity
  with the cursor's naming.
- **Would change if:** Fatima or Techie standardise a different branch
  convention for v0.8.

### A1b.3 — Doc copied verbatim from `origin/scope/v0.8:docs/REFACTOR-v0.8.md`; no edits.

- **Assumed:** The PR #16 branch is the source of truth for the scope
  doc. Any rewrites belong in their own commit after Fatima's
  click-through. This commit is a pure move-into-main.
- **Alternatives:** Tidy or restructure the doc as part of this commit.
  Rejected — would conflate "land the plan" with "edit the plan" and
  make diffs harder for Fatima to review.
- **Would change if:** The doc had a clear bug (broken markdown, wrong
  step numbering) — I'd fix in a follow-up commit, not silently here.

---

## Step 0 — Lobbycat agent wakes up

*(Infra-shaped; Techie's domain per `HEARTBEAT.md`. Lotus drafts the
identity files; Fatima/Techie run `openclaw agents add lobbycat`.
Assumptions logged when the identity-files PR opens.)*

---

## Step 1 — `clarify` skill authored (2026-06-25 21:50 UTC)

### A1.1 — Skill lives at `skills/clarify/` in the lobbycat repo, not directly at `~/.openclaw/plugin-skills/clarify/`.

- **Assumed:** The repo is the source of truth for the skill body, so
  Vercel can bundle and load it at invocation time (the inline path —
  §3.3 path 1 — needs the SKILL.md text inside the deployed bundle).
  Techie's existing install task (`inbox/2026-06-25-lobbycat-agent-install.md`)
  is the right place to add a copy/symlink step from
  `<repo>/skills/clarify/` into `~/.openclaw/plugin-skills/clarify/` for
  the path-2 (spawned-agent) consumers landing in v0.9. The scope doc
  says "authored as an OpenClaw skill at
  `~/.openclaw/plugin-skills/clarify/SKILL.md`" — I'm reading that as a
  *deployment* location, with the repo as the canonical authoring source.
- **Alternatives:** Author directly under `~/.openclaw/plugin-skills/`
  and symlink into the repo. Rejected — git history would live outside
  the repo, Vercel couldn't see it without extra build steps, and PR
  review would be invisible to Fatima. Or commit at both locations.
  Rejected — two sources of truth.
- **Would change if:** Techie objects to the symlink direction, or
  there's an existing convention for how lobbycat-repo skills are
  installed that I'm not seeing.

### A1.2 — Six moves taxonomy lifted verbatim from scope doc §2.5; no additions, no renames.

- **Assumed:** The scope doc is the spec; my job is to expand each move
  with *when / data needed / phrasings / what to listen for / follow up*,
  not invent new moves. The doc explicitly says "See §10 build steps" for
  the expansion, so the expansion happens here in `reference/moves.md`.
- **Alternatives:** Add a seventh move (e.g. "the silence" — when the
  cat says nothing and waits). Rejected — that's a tactic inside other
  moves, not its own move; lives in `voice.md` ("earn the silence")
  instead.
- **Would change if:** Fatima reads it and says a move is missing, or
  Aadi's real sessions reveal a recurring pattern that doesn't fit one
  of the six.

### A1.3 — `voice.md` derived primarily from `lobbycat/SOUL.md`, not from `lobbycat-quotes.json`.

- **Assumed:** SOUL.md (just shipped in Step 0) is the more recent and
  more grill-context-shaped voice doc. The quotes JSON is for ambient UI
  states (loading, welcome-back, fitNoting); the conversation tone
  belongs to SOUL. `voice.md` is the conversation-specific gloss on top
  of SOUL — explicitly says so at the top of the file.
- **Alternatives:** Synthesise from quotes JSON only. Rejected —
  third-person ambient voice ("the cat is reading…") doesn't translate
  to first-person session voice. Or duplicate SOUL contents into
  `voice.md`. Rejected — drift risk; better to reference and gloss.
- **Would change if:** SOUL gets edited and `voice.md` needs to track,
  or Fatima wants a single source of voice truth (probably SOUL, with
  `voice.md` as a pointer).

### A1.4 — Three worked examples in `examples.md`: one contradiction, one hidden-frame, one clean-exit (no insight).

- **Assumed:** Coverage of the most-likely opening moves (contradiction,
  hidden frame) plus the "nothing surfaced" path is the highest-value
  selection. The other four moves (forced trade, drift check, honest
  mirror, exit) are well-covered by their move-doc entries and don't
  need a worked transcript each.
- **Alternatives:** Six examples, one per move. Rejected — long file,
  diminishing returns, and the patterns across them are what matter, not
  one per move. Or one example only. Rejected — the clean-exit path is
  important enough to demonstrate explicitly (the cat must be allowed to
  end without a fake insight).
- **Would change if:** Real sessions reveal one of the four un-exampled
  moves is harder to get right than the move doc captures.

### A1.5 — End-of-session proposal output uses a fenced text block with `KIND: weight|frame|note|none`, not JSON. ~~(SUPERSEDED by A4.7 on 2026-06-26 01:10 UTC — see below.)~~

- **Assumed:** A simple line-oriented format is easier for the
  `runClarifySession` server action (Step 4) to parse out of a streamed
  response than JSON, and tolerates the model occasionally adding
  surrounding prose. JSON inside a stream is a known source of
  half-parsed-object bugs. Step 4 will define the exact parser; this is
  the shape it has to handle.
- **Alternatives:** JSON object. Rejected — fragility with streaming +
  the model wanting to add commentary around it. Or function-calling /
  tool-use. Deferred — that's a Step 4 implementation choice, and the
  skill should still emit human-readable end-of-session text even when
  wrapped in a tool call.
- **Would change if:** Step 4 prefers structured tool-use; the skill
  output block stays as a fallback for path-2 (spawned agent) consumers
  that don't have tool-use wired up.
- **What actually happened:** Step 4 shipped (PR #34) with a parser
  that reads a fenced \`\`\`proposal JSON block, not the PROPOSAL:/KIND:
  text block this assumption committed the skill to. The mismatch was
  caught while resolving #34's merge conflict and is corrected in Step
  4.1 by aligning the skill to the parser. See A4.7.

### A4.7 — Step 4.1: skill rewrites the proposal contract from PROPOSAL:/KIND: text to a fenced ```proposal JSON block, matching the parser shipped in PR #34.

- **Assumed:** The parser is the more constrained surface. It compiles,
  it has a regex, it's used by the database write path. The skill is
  free-form Markdown loaded into a system prompt; rewriting its
  end-of-session contract is cheaper than rewriting the parser, and
  keeps Step 4's typed `ClarifyProposal` shape (`kind`, `summary`,
  `data`) intact. The three valid `kind` values are exactly the three
  the parser accepts: `frame-weight`, `new-frame`, `company-note`.
- **Concrete changes:**
  - `skills/clarify/SKILL.md` end-of-session section rewritten with
    three worked JSON-fence examples + hard rules.
  - `skills/clarify/reference/examples.md` Session A/B/C proposal
    blocks rewritten to match. Session A's "tag as constraint"
    proposal repurposed into a `frame-weight` (weight→Could) since
    there's no `constraint-flag` kind in v0.8.
  - Move tag (`<!-- move: <name> -->`) documented in SKILL.md with the
    seven valid kebab-case names the parser accepts.
- **Verification:** end-to-end parser smoke test against four sample
  outputs (one per kind + a clean-exit). All four extract cleanly:
  typed `kind`, `summary`, `data` preserved verbatim, `body` stripped,
  `ended` flag accurate. No malformed-JSON paths hit.
- **Alternatives:** Rewrite the parser to read the old text block.
  Rejected — changes more lines, breaks typed `data` payloads, harder
  to evolve. Or function-calling / tool-use. Deferred — same answer as
  A1.5; tool-use is a Step 4+ refactor, not Step 4.1.
- **Would change if:** The model proves unreliable at emitting valid
  JSON inside the fence (likely at smaller models, fine at
  claude-sonnet-4-x). Step 4 already swallows malformed JSON
  gracefully ("treat the block as prose"), so the failure mode is
  "session ends without a proposal", which is also a valid outcome.

### A1.6 — Validation: `skill-creator/scripts/quick_validate.py` passed ("Skill is valid!") on `/root/projects/lobbycat/skills/clarify` at 21:50 UTC.

- **Assumed:** Passing `quick_validate.py` is sufficient validation for
  the skill author step. Behavioural validation (does the cat actually
  sound like the cat?) happens in Step 12 (Lotus-side tuning pass)
  against real seeded sessions.
- **Alternatives:** Stand up a throwaway invocation now and read a
  generated session. Rejected — that's the Step 4/12 surface, not Step
  1's.
- **Would change if:** Fatima reads the skill and wants edits before
  Step 3 starts.

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

## Step 2 — Concept sign-off (this doc)

*(Pending Fatima.)*

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

---

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

---

## Step 5 — Chat panel UI (2026-06-26 01:25 UTC)

### A5.1 — The panel is a controlled component; mount in Step 6 with an `open` prop.

- **Assumed:** `<ClarifyPanel open trigger onClose onProposalAccepted>` is
  stateless about its own visibility. The parent (Step 6's persistent
  bottom-right button + the wizard / welcome-back / company-detail
  entry points landing in Steps 6–8) owns the open/closed state. This
  keeps Step 5 self-contained — you can drop the panel anywhere with a
  one-line prop and let the parent decide when it shows.
- **Alternatives:** Have the panel own its own "is open?" state behind a
  global context. Rejected — four entry points means four call sites,
  all of which already have local UI state; a global context is
  overkill and forces Step 5 to ship a provider Step 6 has no need
  for.
- **Would change if:** A future cross-page persistent surface (e.g.
  panel survives navigation) wants it. v0.9 candidate.

### A5.2 — Session opens lazily on first paint of `open=true`, not on mount.

- **Assumed:** `useEffect(() => { ... }, [open])` triggers
  `startClarifySession()` exactly when the panel becomes visible. If
  the parent mounts the component already-open (e.g. wizard step 5),
  the session opens immediately; if the parent mounts it hidden and
  later flips `open=true`, the session opens then. Either path works
  with no extra ceremony.
- **Alternatives:** Open the session on mount unconditionally.
  Rejected — parents that mount the panel hidden (for fade-in setup)
  would burn an Anthropic call before the user did anything.
- **Would change if:** Latency-sensitive entry points (e.g. welcome-
  back card) want the session pre-warmed. Then add an `eager` prop.

### A5.3 — Closing the panel mid-flow ends the session server-side. No save-as-draft.

- **Assumed:** Per REFACTOR-v0.8 §4.3: "closing the panel mid-flow ends
  the session; next click starts a fresh one." The `handleClose`
  handler fires `endClarifySessionAsClosed(sessionId)` (Step 4 server
  action) for any session that hasn't already ended via a proposal.
  Local state is reset so a re-open starts truly clean (new session
  row, new opening turn from the cat).
- **Alternatives:** Persist the in-flight message buffer to localStorage
  and resume on re-open. Rejected — explicitly out of scope; the
  product intent is that each clarify is a discrete sitting.
- **Would change if:** Aadi tells us he wants drafts. (Won't.)

### A5.4 — Enter sends; Shift-Enter newline. No multi-modal input, no command palette.

- **Assumed:** Standard chat input shape. The textarea auto-resizes up
  to a 160px cap (about 7 lines), then scrolls. Enter triggers send;
  Shift-Enter inserts a newline.
- **Alternatives:** Send button only, no Enter shortcut. Rejected —
  unfamiliar from every other chat surface; would feel broken. Or a
  voice-input affordance. Rejected — v0.8 is text-only by design.
- **Would change if:** Mobile keyboard ergonomics need work (likely
  candidate: Enter newline + a prominent send button on mobile only).
  Defer to Step 11 / first real-device pass.

### A5.5 — The proposal card lives inline in the message stream, not as a separate modal.

- **Assumed:** When the cat ends the session with a proposal, the card
  renders at the bottom of the conversation thread (above the footer's
  `done` button which replaces the textarea). Inline is honest — the
  proposal is the natural end of the conversation, not a popup
  interrupting it. The card has `do it` (accept) and `not yet`
  (reject) buttons; both transitions to a `decided` state that locks
  the choice (no second-guessing inside the same session).
- **Alternatives:** Modal overlay on the panel. Rejected — modal-on-
  modal-on-page reads as panic-stacking. Or a footer-only card.
  Rejected — splits the conversation from its conclusion visually.
- **Would change if:** Real testing shows the card scrolls off the top
  on long sessions and users don't realise it shipped. Mitigation
  candidate: auto-scroll to the card on append + a subtle pulse.

### A5.6 — The card *visibly* records accept/reject but doesn't *apply* the change. Application is downstream wiring.

- **Assumed:** Step 4 already persists the proposal payload on the
  session row (`clarify_sessions.proposal_data` etc.). Actually
  applying the payload (bumping a frame weight, inserting a company
  note, creating a new frame) is a per-`kind` mutation that touches
  four-ish DB surfaces; sequencing that with the UI accept-click is
  Step 6+ work. Step 5's accept button calls
  `onProposalAccepted?.(proposal)` so the parent (Step 6's launcher)
  can wire it up when it lands.
- **Alternatives:** Apply the proposal directly from the panel.
  Rejected — Step 5 ships before the application wiring exists. Or
  defer the accept button entirely until Step 6+. Rejected — the
  panel is incomplete without it; the accept-but-don't-apply seam is
  honest about what v0.8 Step 5 ships.
- **Would change if:** Step 6 lands the application wiring before this
  PR merges. Then collapse the seam.

### A5.7 — `clarifying[]` quote rotation during long waits is a Step 10 surface; Step 5 leaves a static "…" marker.

- **Assumed:** Per REFACTOR-v0.8 §8 the quote-line rotation is its own
  step (10) layered on top of a working panel. Step 5 ships a static
  italic `…` placeholder during the `thinking` transition so the
  panel doesn't go dead-air; Step 10 swaps it for a rotating
  `clarifying[]` quote with a fade.
- **Alternatives:** Ship the rotation now. Rejected — mixes Step 10's
  quote-curation scope into Step 5 and ties a UI ship to a copy ship.
- **Would change if:** Real first-token latency in path-1 (inline) is
  bad enough that even a 2s static `…` reads as broken. Then we
  promote Step 10 ahead of Step 6.

### A5.8 — Panel uses the card-interior token subset (v0.7.2 §3.4), not the full vaporwave palette.

- **Assumed:** The chat panel is a reading surface like the card
  interior — long-form text the user looks at for minutes at a time.
  The card-interior subset (calmer purple bg, softer cream text, muted
  accents) is exactly what this needs. The cyan-top border on the
  panel itself is the vaporwave signature without overwhelming.
- **Alternatives:** Full vaporwave palette. Rejected — same reason
  CompanyCard interior switched in v0.7.2: hot magenta + cyan stacked
  on long reading is exhausting.
- **Would change if:** A future tuning pass wants the panel to feel
  more theatrical (it shouldn't — the cat is calm, not theatrical).

---

## Step 6 — "Talk to lobbycat" button on dashboard + company detail

*(Pending. Assumptions to log: button placement, z-index vs other
floating UI, scoped-session signal to the server action, analytics.)*

---

## Step 7 — Wizard step 5 → seeded clarify session

*(Pending. Assumptions to log: seed-message shape, what happens if the
seeded session fails mid-onboarding, whether the old textarea data is
preserved in the DB.)*

---

## Step 8 — Welcome-back card: optional clarify offer

*(Pending. Assumptions to log: drift-detection heuristic, frequency cap
enforcement, how Glyphie hints are surfaced.)*

---

## Step 9 — `/about` Conversations tab

*(Pending. Assumptions to log: list ordering, transcript redaction,
delete confirmation, whether deletes are hard or soft.)*

---

## Step 10 — `clarifying[]` quote array + animations

*(Pending. Assumptions to log: animation library, quote source / count,
reduced-motion behaviour.)*

---

## Step 11 — README + deploy

*(Pending. Assumptions to log: changelog framing, version bump
(0.7.2 → 0.8.0 vs 0.7.2 → 0.8.0-beta), deploy gating.)*

---

## Step 12 — Lotus-side tuning pass

*(Pending. Assumptions to log: test-session corpus, what counts as
"tuned enough", how tuning diffs are tracked.)*