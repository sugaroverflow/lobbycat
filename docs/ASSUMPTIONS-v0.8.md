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

## Step 1 — `clarify` skill authored

*(Pending. Assumptions to log when the skill files land:
move-set choices, voice-doc tone, example selection, validation
output.)*

---

## Step 2 — Concept sign-off (this doc)

*(Pending Fatima.)*

---

## Step 3 — Schema + migrations (`clarify_sessions`, `clarify_messages`)

*(Pending. Assumptions to log: column shapes, FK/cascade choices,
proposal storage shape, migration numbering after 0011.)*

---

## Step 4 — Server action: `runClarifySession`

*(Pending. Assumptions to log: streaming approach, model/provider
choice, error handling, message-store ordering, context shape passed to
the skill.)*

---

## Step 5 — Chat panel UI

*(Pending. Assumptions to log: panel mount point, mobile breakpoint,
keyboard handling, message-stream rendering, proposal-card affordances.)*

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
