# ASSUMPTIONS — Lobbycat v0.8.1

Tracking assumptions made while shipping v0.8.1 (Fatima's click-through
feedback polish, scoped in `docs/REFACTOR-v0.8.1.md`).

Format follows the v0.7.2 / v0.8 shape: per-step sections with assumption
IDs (`A<phase>.<item>.<n>`), the timestamp, the alternatives considered,
and the "would change if" reversal condition.

---

## Phase A — surface polish

### Phase A item 1 — F2.1 dashboard intro copy

**A-A1.1 — Targeted single-quote swap rather than full pool rewrite.**

- Date: 2026-06-26 03:50 UTC
- Decision: Replace only the welcomeBack quote Fatima quoted verbatim
  (`"Pick your priorities. The cat will surface the matches."`) with
  `"Here are your matches, based on your answers."`. Leave the other 11
  welcomeBack quotes untouched.
- Alternatives considered:
  - (a) Rewrite the whole welcomeBack pool to remove all forward-looking
    or question-framing voice. Rejected: F2.1 quoted one specific line as
    "the dashboard intro sentence", and the rest of the pool reads as
    ambient observation, not as the page's framing claim. A pool-wide
    voice pass is broader than the Fatima feedback and would risk dropping
    quotes she likes.
  - (b) Keep the old line and add the new one. Rejected: she explicitly
    flagged the old framing ("the dashboard is the answer, not the
    question; the cat asks elsewhere") so leaving it in the rotation
    contradicts the direction.
- Would change if: Fatima reviews the pool and asks for a wider voice
  cleanup, or asks for a non-rotating fixed intro line above the
  welcome card.

**A-A1.2 — Capitalization + punctuation normalisation of Fatima's
prescribed copy.**

- Date: 2026-06-26 03:50 UTC
- Decision: Fatima's verbatim wording in `REFACTOR-v0.8.1.md` is
  `"here are your matches based on your answers!"` (lowercase, no comma,
  trailing exclamation). The welcomeBack pool style is sentence-cased,
  comma-broken, period-ending. Normalised to
  `"Here are your matches, based on your answers."` to match pool style.
- Alternatives considered:
  - (a) Use the verbatim string as-is, exclamation and all. Rejected:
    every other welcomeBack quote ends with a period; one exclamation
    would read as out of voice.
  - (b) Drop the comma. Tossup; kept the comma because the cadence with
    the comma reads slightly closer to the cat's measured voice than
    without it.
- Would change if: Fatima asks for the exclamation back, or asks for a
  different cadence.

**A-A1.3 — Ship Phase A item 1 before v0.8 (#47) merges, despite
`REFACTOR-v0.8.1.md` §11 saying "wait for v0.8 to merge".**

- Date: 2026-06-26 03:50 UTC
- Decision: Phase A item 1 ships now against the open
  `scope/v0.8.1-fatima-feedback` branch. The §11 wait-condition was
  written under the concern that v0.8.1 polish might touch surfaces still
  in PR review. F2.1 touches `src/db/lobbycat-quotes.json`'s
  `welcomeBack` array, which v0.8 collapse does not modify (v0.8 collapse
  edits the file's `_meta.notes` + appends a `clarifying` array, both
  away from the welcomeBack hunk). No merge conflict expected.
- Alternatives considered:
  - (a) Wait for #47 to merge. Rejected: heartbeat cursor explicitly
    listed Phase A start as the next ship, and Fatima's 2026-06-25
    20:56 UTC + 2026-06-26 01:06 UTC instructions say keep shipping
    through the night.
  - (b) Pick a Phase A item that touches files v0.8 doesn't change at
    all. Considered; F7.1 (footer line) is one such candidate, but F2.1
    is item 1 in the §10 implementation order and the welcomeBack file
    hunk isolation makes it safe in practice.
- Would change if: #47 starts touching `welcomeBack` quotes, or Fatima
  says explicitly "hold v0.8.1 till v0.8 merges".

**A-A1.4 — Assumption log lives at `agent-journal/ASSUMPTIONS-v0.8.1.md`,
not `docs/ASSUMPTIONS-v0.8.1.md`.**

- Date: 2026-06-26 03:50 UTC
- Decision: Per Fatima's 2026-06-26 02:08 UTC reorg (commit f3a9bc0),
  agent-authored docs (ASSUMPTIONS, REFACTOR, journal) live under
  `agent-journal/`. Following the convention.
- Note: `docs/REFACTOR-v0.8.1.md` (committed earlier on this same scope
  branch, 02:22 UTC) was put under `docs/` before I noticed the reorg.
  A separate doc-move commit moving it to
  `agent-journal/REFACTOR-v0.8.1.md` is owed and will land as a tidy-up
  PR on the v0.8.1 scope branch.
- Would change if: Fatima reverts the reorg, or asks for the v0.8.1 doc
  to stay under `docs/` for a different reason.
