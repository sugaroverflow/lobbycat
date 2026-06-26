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

---

### Phase A item 2 — F7.1 footer surprise line

**A-A2.1 — Surprise line uses `text-ink` (the design-token white),
not literal `text-white` / `#ffffff`.**

- Date: 2026-06-26 04:18 UTC
- Decision: Render the new footer line with `text-ink`, which resolves to
  `--fg-prose` (`#E0E0E0` under vaporwave). Fatima said "white"; in the
  lobbycat design system `text-ink` is the prose-white token and is what
  every other on-theme white surface uses (wordmark, primary copy).
- Alternatives considered:
  - (a) `text-white` (literal Tailwind `#fff`). Rejected: bypasses the
    token system and reads slightly hotter than the rest of the theme;
    would also drift if the theme palette ever changes.
  - (b) Keep it on `text-whisper` like the rest of the footer. Rejected:
    spec explicitly contrasts it with the existing footer treatment
    ("White, small font, separate line"), so it needs more presence than
    the whisper-muted version row.
- Would change if: Fatima sees it live and wants a hotter literal white,
  or a softer in-between tone.

**A-A2.2 — Same `text-xs` size + same `mono` + same
`uppercase tracking-[0.14em]` as the existing footer row.**

- Date: 2026-06-26 04:18 UTC
- Decision: The new line inherits the footer container's typography
  (`mono text-xs uppercase tracking-[0.14em]`) and only overrides the
  colour token. Spec says "small font"; `text-xs` is the footer's
  existing small.
- Alternatives considered:
  - (a) Drop uppercase / tracking so the line reads as a hand-written
    aside ("made as a surprise <3" in sentence case). Rejected: the
    footer reads as a system row, and breaking case/tracking on one line
    would look like a bug, not intent. The `<3` already carries the
    warm-aside register; the typographic frame can stay consistent.
  - (b) Bump to `text-sm` for more presence. Rejected: spec says small;
    keeping it at footer-row size respects "small font".
- Would change if: Fatima reviews live and wants the line in sentence
  case / softer typography to read more personal.

**A-A2.3 — Surprise line sits BELOW the existing
`lobbycat · est. 2026` / `v0 · napping` row, as a second flex-column
child, with `gap-2` between rows.**

- Date: 2026-06-26 04:18 UTC
- Decision: Restructured the footer inner `<div>` to `flex flex-col
  gap-2`. Row 1: existing two-span justify-between (whisper). Row 2:
  the surprise line (ink).
- Alternatives considered:
  - (a) Add the surprise line as a third span inside the existing
    justify-between row (would push the layout to three columns).
    Rejected: spec says "separate line".
  - (b) Put the surprise line ABOVE the existing row. Rejected: existing
    row is the system identity (name, year, version) and conventionally
    sits first; the surprise aside reads more naturally as a soft
    afterword underneath.
- Would change if: Fatima wants the surprise line above the system row,
  or rendered as its own footer band (e.g. centered, on its own border).

**A-A2.4 — Footer line ships on every page (not gated to dashboard
or first-visit).**

- Date: 2026-06-26 04:18 UTC
- Decision: The line lives in `SiteShell`, so it renders on every route
  that uses the shell (which is every user-facing page). Per spec:
  "the line is *for* Aadi and goes live AT the moment he gets the URL"
  — i.e. as soon as the v0.8.1 deploy lands, regardless of which page
  he opens first.
- Alternatives considered:
  - (a) Render only on `/` so it reads as a landing-page note.
    Rejected: he might land on `/about` or a deep-linked company first;
    the surprise framing should hold whichever URL opens.
- Would change if: Fatima wants the surprise line scoped to a specific
  route or hidden after a first visit / cookie.

**A-A2.5 — Fold the A-A1.4 doc-move
(`docs/REFACTOR-v0.8.1.md` → `agent-journal/REFACTOR-v0.8.1.md`)
into this same Phase A item 2 commit/PR.**

- Date: 2026-06-26 04:18 UTC
- Decision: Move the scope doc to `agent-journal/` in the same commit
  as the F7.1 footer change. A-A1.4 explicitly noted the move was owed
  and could ride along with the next Phase A PR; this is that PR.
- Alternatives considered:
  - (a) Ship the doc-move as a standalone tidy PR. Rejected: adds an
    extra round-trip on Fatima's merge queue with zero behaviour change.
  - (b) Defer to a later Phase A item. Rejected: every additional
    Phase A PR that references the scope doc will reference a stale
    path until the move lands; doing it now keeps assumption logs and
    commit messages pointing at the real path.
- Would change if: Fatima objects to mixing the doc-move with feature
  work in one PR.
