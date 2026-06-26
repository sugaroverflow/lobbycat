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

---

### Phase A item 3 — F1.1 vaporwave-but-readable inside cards

**A-A3.1 — Switch card-interior labels from `mono uppercase tracking-…` to plain `font-sans` lower-case at the small text scale.**

- Date: 2026-06-26 04:45 UTC
- Decision: For the HQ pill, "Latest" eyebrow, "Show more / Show less"
  toggle, "Recent publications" / "Open roles" h4 eyebrows, the per-bar
  frame-name label in `ScoreBar`, the "Overall" eyebrow next to the
  aggregate score, and the inactive `HiringBadge` states ("Not hiring",
  "Hiring · unknown"), drop the
  `mono text-[10px] uppercase tracking-[0.12em-0.18em]` treatment and
  replace it with `font-sans text-xs` (or `text-sm` for headings) at
  natural casing. This is what F1.1 calls "mono small-case or sans-small
  at higher contrast" — the all-caps mono micro-labels were the loudest
  bit of card-interior chrome.
- Alternatives considered:
  - (a) Keep mono, just drop letterspacing + uppercase. Rejected: the
    Share Tech Mono face at 10–11px is itself part of the readability
    problem Fatima flagged; sans (Orbitron) at the same small size reads
    notably cleaner inside the calm card interior, while leaving the
    company name's larger sans heading still distinctly "the vaporwave
    bit" because of scale (`text-xl`) and weight.
  - (b) Go full sans across the entire card body INCLUDING the company
    name. Rejected: F1.1 is explicit — keep vaporwave on the company
    name, tone down everything else. The h3 link is the one place
    inside the box that should still feel theatrical.
  - (c) Keep uppercase but bump contrast only (whisper → text). Rejected:
    the chrome that bothered Fatima ("the text in the boxes can be
    hard to read") is the combination of mono + uppercase + wide
    tracking at 10px more than the colour alone.
- Would change if: Fatima wants to preserve the all-caps mono eyebrow
  treatment but only fix contrast, or wants sans applied to the entire
  card body including the title.

**A-A3.2 — Bump card body reading text from `text-muted` / `text-whisper` to `text-card-interior-text` (full opacity).**

- Date: 2026-06-26 04:45 UTC
- Decision: The card description, the "Latest" headline line, the
  expanded-section list items (recent publications, open roles), and
  the link colours inside the expanded reveal switch from the legacy
  `text-muted` (0.8 alpha prose-soft) / `text-whisper` (0.6 alpha)
  utilities to `text-card-interior-text` (full opacity on the
  card-interior palette, `#E0DEF0`). Reserve
  `text-card-interior-muted` (0.7) for genuinely secondary chrome
  ("Overall" eyebrow, HQ pill, inactive Hiring states, empty-state
  italics, "latest" eyebrow word) and `text-card-interior-whisper`
  (0.45) for tertiary metadata (timestamps, counts in parens, the
  `[M]/[S]/[C]` weight glyph).
- Alternatives considered:
  - (a) Use the global `text-ink` everywhere inside cards. Rejected:
    `text-ink` resolves to `--fg-prose` (`#E0E0E0`) which is the prose
    voice; the v0.7.2 §3.4 card-interior subset deliberately offsets
    to `#E0DEF0` to read calmer against the warmer card interior bg.
    Using the card-interior token keeps the design system intent.
  - (b) Add a new `--card-interior-text-bright` step above
    `text-card-interior-text`. Rejected: F1.1 says "go one step further
    on contrast", and full opacity on the existing token already wins
    a clear step over the previous `text-muted` usage; adding a fourth
    tier overcomplicates the §3.4 subset.
- Would change if: contrast still reads weak in Fatima's next pass, in
  which case I'd consider stepping the card-interior text token toward
  `#F0EEFF` or pure prose `#E0E0E0`.

**A-A3.3 — Leave the active `● Hiring` magenta badge untouched.**

- Date: 2026-06-26 04:45 UTC
- Decision: The active hiring badge (border + magenta glow + magenta
  text) keeps its full vaporwave treatment. Only the inactive states
  ("Not hiring", "Hiring · unknown") get toned down.
- Alternatives considered:
  - (a) Tone down the active badge too (drop glow / uppercase / mono).
    Rejected: F1.1 is about chrome that's loud-but-not-saying-anything.
    "Hiring" is the one signal in the box that IS saying something
    rare and important; the same magenta glow that's noise on a "Latest"
    eyebrow is a meaningful flag when applied to a sparse "this company
    is hiring" pill.
  - (b) Move the hiring chip into the company-name line so it inherits
    the title's theatrical treatment. Out of scope — that's an F3.x
    layout question, not F1.1.
- Would change if: Fatima wants the hiring active state quieter too, or
  wants the signal moved out of the per-card chrome entirely.

**A-A3.4 — Leave the per-frame ScoreBar visual (cyan label + magenta→cyan progress bar) alone except for the label typography.**

- Date: 2026-06-26 04:45 UTC
- Decision: The score bar's frame-name label drops mono-uppercase-tracking
  for sans-small at the same `text-readout` (cyan) colour; the 80px bar
  itself, the `--vw-accent-bar` magenta→cyan fill, the `tabular-nums`
  score on the right, and the `[M]/[S]/[C]` weight glyph all stay.
- Alternatives considered:
  - (a) Also retire the cyan label colour for plain card-interior text.
    Rejected: cyan is the "readout / data voice" role in vaporwave;
    frame names ARE data labels. The colour is the right semantic. The
    issue F1.1 flagged was the typographic treatment of small labels,
    not the data-voice cyan.
- Would change if: Fatima wants the data-voice cyan also softened inside
  cards, in which case I'd switch to `text-readout-dim`.

**A-A3.5 — F1.1 is the only F1.x item in this PR.**

- Date: 2026-06-26 04:45 UTC
- Decision: Ship F1.1 alone. F1.2 (filter chip contrast) is the next
  scheduled Phase A item per §10 ordering and lands in its own PR on
  top of this branch.
- Alternatives considered:
  - (a) Bundle F1.1 + F1.2 since both are "readability contrast" passes.
    Rejected: PR collapse plan favours small, mergeable, per-feedback-id
    PRs that Fatima can review one feedback ID at a time; bundling
    erases the per-ID trail.
- Would change if: Fatima asks for fewer/bigger Phase A PRs.

---

## Phase A item 4 — F1.2 (filter chip contrast bump)

**A-A4.1 — Interpret "filter chips" as `ToolbarChip` (the actual on-dashboard filter affordance), not `FilterChip` from `src/components/filter-chip.tsx`.**

- Date: 2026-06-26 05:18 UTC
- Decision: The dashboard toolbar renders its boolean filters
  (Hiring / Open role / Recent pub / ✦ Fit-note) and the Tier 1/2/3
  selectors through a local `ToolbarChip` component inside
  `src/components/dashboard-cards.tsx`. The separately-defined
  `FilterChip` in `src/components/filter-chip.tsx` is not imported
  anywhere. Fatima's "gray on black, hard to see" feedback can only be
  about the chips she actually sees in dev — i.e. `ToolbarChip`. So
  F1.2 ships against `ToolbarChip` and leaves `filter-chip.tsx`
  untouched.
- Alternatives considered:
  - (a) Also retheme `FilterChip` for consistency. Rejected — it has
    zero callers; touching it adds dead-code churn without changing
    anything Fatima sees. If a future surface adopts it, that PR can
    align it then.
  - (b) Delete `filter-chip.tsx` as dead code in this PR. Rejected —
    out of scope for F1.2 (and risks fighting Glyphie if she's
    planning to use it).
- Would change if: someone wires `FilterChip` into a real surface, in
  which case F1.2's contrast treatment should be ported there too.

**A-A4.2 — Inactive `ToolbarChip` switches from `--fg-prose-muted` text on transparent / `--rule` border to `--readout-cyan` text on transparent / `--readout-cyan-dim` border.**

- Date: 2026-06-26 05:18 UTC
- Decision: F1.2 explicitly suggests "a softer cyan when inactive."
  The readout-cyan token is the established "data / instrument /
  readout voice" in the vaporwave system (already used by the eyebrow
  helper, the `Clear` button, sage/ochre aliases, etc.), so an
  inactive filter chip — a passive control awaiting input — reads
  cleanly as a readout. `--readout-cyan` for the text gives a clear
  jump above `--fg-prose-muted` against the page background;
  `--readout-cyan-dim` for the border keeps the chip's outline visible
  without competing with the page's `--rule` divider underneath the
  sticky toolbar.
- Alternatives considered:
  - (a) Inactive = full `--card-interior-text` (1.0 alpha white-ish).
    Rejected — that's the F1.1 *inside the box* token; using it on the
    page-level toolbar would flatten the page-vs-card hierarchy F1.1
    just established.
  - (b) Inactive = `--ink` neutral. Rejected — chips are interactive
    affordances, not body prose; tinting them as data-voice cyan tells
    the user "these are filters" at a glance, which `--ink` doesn't.
- Would change if: Fatima reads the inactive cyan as "looks selected"
  and asks for a more neutral resting state.

**A-A4.3 — Active `ToolbarChip` keeps the magenta accent but bumps the tinted background from `rgb(255 0 255 / 0.06)` to `rgb(255 0 255 / 0.12)`; border / glow / `--accent-action` text stay.**

- Date: 2026-06-26 05:18 UTC
- Decision: F1.2 also says "a clearer active state." The active treatment
  was already structurally right (magenta border + magenta glow +
  magenta foreground) but the 0.06 alpha fill was almost invisible
  against the page bg, so a user toggling a filter mostly only saw a
  faint border-colour change. Doubling the fill alpha to 0.12 makes
  the "this chip is on" reading unambiguous without overpowering the
  rest of the toolbar.
- Alternatives considered:
  - (a) Solid magenta fill with surface-coloured text. Rejected — way
    too loud for a row of four boolean filters; would dominate the
    toolbar and fight the magenta-left card edge below.
  - (b) Swap active to cyan-solid so active = cyan, inactive = cyan-dim.
    Rejected — the magenta-on-cyan polarity is what makes "selected"
    legible at a glance; flattening both to cyan removes the contrast
    Fatima asked for.
- Would change if: Fatima wants the active state louder still, in
  which case the next bump is fill 0.16–0.20 + a thicker (1.5px) border.

**A-A4.4 — Interpret F1.2 as covering the four filter-row inline labels (`Sort` / `HQ` / `Tier` / `N/N` count), not only the chip buttons.**

- Date: 2026-06-26 05:18 UTC
- Decision: The "filters are gray on black, hard to see" complaint
  applies equally to the `mono text-[10px] uppercase tracking-[0.16em]
  text-whisper` labels that sit on the same toolbar row as the chips
  — same colour family (`text-whisper` is the dimmest text token),
  same dark page bg, same row. Bumping chip contrast while leaving
  the labels at whisper would leave half the row still hard to read.
  So `Sort` / `HQ` / `Tier` move from `text-whisper` to `text-readout`
  (matching the new inactive chip foreground + the `Clear` button
  that's already cyan), and the `N/N` visible-count readout moves
  from `text-whisper` to `text-readout-dim` (one step softer, because
  it's a passive count, not a control affordance).
- Alternatives considered:
  - (a) Keep labels at `text-whisper` and only touch chips. Rejected —
    fails Fatima's actual readability complaint. The row IS the unit
    of attention.
  - (b) Bump labels all the way to `text-ink`. Rejected — labels for
    micro-controls don't need to be as loud as body prose; the cyan
    readout treatment correctly says "auxiliary control surface."
- Would change if: Fatima specifically scoped F1.2 to chips only and
  prefers labels stay quieter.

**A-A4.5 — Leave the `<select>` chrome (Sort / HQ dropdowns), the `Clear` button, and the sticky-toolbar bg + rule alone.**

- Date: 2026-06-26 05:18 UTC
- Decision: The two `<select>` controls already render with
  `var(--ink)` text and `var(--rule)` border, which is plenty
  readable against the page bg — they were not part of the "gray on
  black" complaint. The `Clear` button is already `text-readout` with
  a dotted underline; that's the visual baseline F1.2's other changes
  are converging on, so it stays. The sticky toolbar's
  `var(--bg-page)` bg + `var(--rule)` bottom border are structural
  page-layout chrome, not a contrast issue.
- Alternatives considered:
  - (a) Also reskin the selects to match the new chip language.
    Deferred — selects + chips are different control idioms; if
    Fatima wants visual unity across the whole toolbar, that's a
    separate F1.x item.
- Would change if: Fatima points at the selects as still "gray on
  black."

---

**A-A5.1 — F3.1 "{name} — {hq} — {overall}" header row keeps the
HiringBadge as a right-justified row trailer.**

- Date: 2026-06-26 05:46 UTC
- Decision: F3.1 explicitly says "no right-stack column" and asks for
  ONE row of `{name} — {hq} — {overall}`. The Hiring badge was
  previously in that right-stack column. Rather than hide it or
  invent a new surface, the badge moves to the right-justified
  trailer of the same header row (flex justify between an info
  cluster on the left and the badge on the right). The badge is the
  only filter/toggle the card surfaces at-a-glance ("Hiring") — it
  belongs at the very top of the card, not buried under "show more."
- Alternatives considered:
  - (a) Inline the Hiring badge into the same em-dash chain as
    `{name} — {hq} — {overall} — hiring`. Rejected — Hiring is a
    state badge, not a piece of factual prose; mashing it into the
    dash chain reads as a typo.
  - (b) Move the badge to the score-strip row or below the blurb.
    Rejected — that demotes Hiring, but F1.2 (which JUST shipped)
    bumped the Hiring filter chip's contrast precisely because
    Fatima treats it as a primary signal.
  - (c) Drop the badge entirely now and bring it back in F3.5. F3.5
    is about a star/favorite affordance, not Hiring. Rejected as
    out-of-scope shrinkage.
- Would change if: Fatima specifically points at the badge and says
  "move it" or "drop it from the card top".

**A-A5.2 — F3.1 "overall" stays the existing weighted aggregate
formatting (label "Overall " + tabular-nums readout).**

- Date: 2026-06-26 05:46 UTC
- Decision: The spec says `{name} — {hq} — {overall}`. I read
  `{overall}` as the same "Overall N.NN" treatment that lived in the
  right-stack column — i.e. a small "Overall" label + the number in
  the cyan readout treatment with `tabular-nums`, just inlined into
  the dash chain instead of stacked. The number itself bumps to
  `text-base` to read at the same weight as the HQ token in the row.
- Alternatives considered:
  - (a) Drop the "Overall" label and inline just the number. Rejected
    — without context the bare number reads ambiguously next to
    "{hq}" (could be a postcode, a count, etc.).
  - (b) Render `(overall)` parenthesized at the end. Rejected — the
    spec uses dashes between all three tokens; parens would break the
    rhythm.
- Would change if: Fatima sketches a mock where the overall number
  appears un-labeled or in a different position.

**A-A5.3 — F3.2 "calmer body text" reads as the muted card-interior
token, not the full-opacity card-interior text token.**

- Date: 2026-06-26 05:46 UTC
- Decision: F3.2 calls the blurb "calmer body text." The blurb was
  already there, but it was rendered in the same
  `text-card-interior-text` (full opacity) as the show-more body
  prose. To make it actually *calmer* the blurb now uses
  `text-card-interior-muted` — same weight, same size, lower visual
  emphasis. That keeps the header row (name + cyan overall readout)
  as the visual anchor and lets the blurb sit underneath as
  supporting context.
- Alternatives considered:
  - (a) Drop the blurb to `text-card-interior-whisper`. Rejected —
    whisper is for tertiary metadata (timestamps, counts); a company
    description is still substantive content.
  - (b) Leave blurb at full opacity and rely on F3.3 spacing alone to
    "calm" it. Rejected — F3.2 explicitly says "calmer body text," so
    a tone change is required, not just spacing.
- Would change if: Fatima reads the blurb as now too quiet against
  the new header row.

**A-A5.4 — F3.3 "score bars sit closer to the frames" = tighten the
header's bottom padding and the score-strip's top padding by one
step each.**

- Date: 2026-06-26 05:46 UTC
- Decision: F3.3 wants the score-strip to "read as the immediate body
  of the card." The strip already had `py-3` (top and bottom padding)
  and the header had `pb-3`. To collapse the gap without losing
  rhythm with the latest/show-more row underneath, the header's
  bottom padding drops to `pb-2`, the strip's top padding drops to
  `pt-2`, and the strip's bottom padding stays `pb-3` to preserve
  breathing room above "Latest." The blurb's top margin also drops
  from `mt-1.5` to `mt-1` so the whole upper cluster reads as one
  tighter unit.
- Alternatives considered:
  - (a) Drop the strip's `border-top` to fuse it visually with the
    header. Rejected — the cyan rule between header and score-strip
    is the existing card-interior language; killing it would change
    the card's identity, which is outside F3's scope.
  - (b) Drop strip padding to `py-1` for maximum tightness. Rejected
    — the bars themselves need vertical room to read as bars and not
    as overlapping rules; `py-2` (top) preserves that.
- Would change if: Fatima still reads the strip as "disconnected"
  from the header after this.

**A-A6.1 — F4.1 "frames helper copy" placement = right under the
"Frames" h2/border-rule, above the FrameScorer list.**

- Date: 2026-06-26 06:18 UTC
- Decision: F4.1 says add a one-liner *above the per-company frame
  scores on the company detail page*. The frames live in their own
  `<section>` under an `eyebrow` h2 (`"Frames"`) on
  `src/app/companies/[slug]/page.tsx`. The helper copy lands as a
  single `<p>` between the h2 (with its bottom rule) and the
  `divide-y` list of `<FrameScorer>` rows, so it sits inside the
  Frames section and clearly applies to that section only — not to
  Open roles above or NotesEditor below.
- Alternatives considered:
  - (a) Put the line above the section heading. Rejected — readers
    would see prose before they see the "Frames" label, and the
    sentence references "these" which only makes sense once Frames
    is identified.
  - (b) Put the line inline inside the eyebrow h2. Rejected — eyebrow
    is mono uppercase small caps; long sentence in eyebrow is
    unreadable and clashes with the tone Fatima wants ("calm
    explainer copy").
- Would change if: Fatima wants the line on a separate "explain
  scoring" panel or as a tooltip.

**A-A6.2 — F4.1 helper-copy typography = `serif text-sm
text-muted leading-relaxed`, max-w-2xl, mb-5.**

- Date: 2026-06-26 06:18 UTC
- Decision: The detail page uses two type families: `serif` for body
  prose (description, "no roles tracked yet", role titles), `mono
  uppercase` for eyebrows and metadata. F4.1's helper sentence is
  body prose explaining what users can do, so it sits in `serif`,
  matching the page's description / empty-state voice. Size
  `text-sm` (one step down from the description's `text-lg`) signals
  "supporting hint, not main content"; `text-muted` matches the
  description's foreground token for tonal consistency;
  `leading-relaxed` keeps the line breathable;
  `max-w-2xl` prevents the line from stretching across the full
  3-column grid on wide viewports; `mb-5` keeps it visually grouped
  with the frame list below rather than floating as its own block.
- Alternatives considered:
  - (a) `text-whisper` instead of `text-muted`. Rejected — whisper
    is reserved for tertiary metadata (eyebrow tier line, role
    location); helper copy is supporting prose, not metadata.
  - (b) `text-base`, matching role titles. Rejected — would compete
    with role titles and read as primary content, not a hint.
  - (c) `mono uppercase` matching eyebrow style. Rejected — Fatima's
    F1 readability complaint was explicitly that mono uppercase body
    text is hard to read; this is body text.
- Would change if: Fatima reads the line as too quiet against the
  frame cards.

**A-A7.1 — F4.3 Save-note button = `bg-action text-canvas
hover:bg-action-hover` (token-driven primary CTA).**

- Date: 2026-06-26 06:46 UTC
- Decision: Swap the Save-note button in
  `src/components/notes-editor.tsx` from `bg-ink text-white
  hover:bg-accent` to `bg-action text-canvas hover:bg-action-hover`,
  matching the primary-CTA convention already used by the wizard
  (`src/components/wizard.tsx` "next step" and progress chips). All
  other classes — `mono text-[10px] uppercase tracking-[0.14em]
  px-3 py-2 rounded-sm transition disabled:opacity-60` — stay the
  same; this is purely a contrast / token swap, not a size/shape
  change.
- Why: Fatima flagged this in v0.8.1 click-through feedback
  (REFACTOR-v0.8.1 §4 F4.3): "Save note button is white text on
  gray — hard to read." In the Vaporwave token surface,
  `bg-ink` aliases to `var(--fg-prose)` (light gray on the dark
  canvas), so white text on it is low-contrast — exactly the
  problem. `bg-action` is the bright accent token (the same one
  the wizard uses for its primary CTA), and `text-canvas` is the
  dark canvas color → high contrast in dark mode and consistent
  with the existing primary-action pattern. `hover:bg-action-hover`
  is the token's dimmed variant, replacing the previous
  `hover:bg-accent` (which was a no-op since `bg-accent` ==
  `bg-action` in the alias table).
- Alternatives considered:
  - (a) `bg-coral text-canvas` (signal-coral token). Rejected —
    coral is reserved for warning/destructive states (`<signal>`
    tier); save is a calm affirmative action.
  - (b) Custom dark button + lighten the text only. Rejected — the
    issue is the background contrast, not the text; and the codebase
    already has a token-driven primary-CTA pattern (`bg-action
    text-canvas`) the button should join, not diverge from.
  - (c) Also bump button size up (px-4 py-2.5, text-xs). Rejected —
    Fatima only flagged contrast, not size; the small mono uppercase
    chip-button is intentional for a "save your edits" affordance
    that sits to the right of a textarea. F4.4 (saved-state
    confirmation) will land in the next ship.
  - (d) Update the login-page button (same anti-pattern, also
    `bg-ink text-white`). Deferred — F4.3 in REFACTOR-v0.8.1 is
    scoped to the company-detail Save-note button; login styling
    isn't in Fatima's v0.8.1 feedback. Will be picked up in a
    later sweep if Fatima reacts to it.
- Would change if: Fatima wants the button to read more
  destructive/loud (coral) or quieter (ghost border + accent text).

## A-A8.1 — F4.4 saved-confirmation: placement under the textarea, above the button row

- Scope doc: "After a note is saved, show a small line below the
  textarea: *'saved to profile!'* Probably auto-clears after a few
  seconds."
- Placement decision: the new confirmation line lives in its own
  div BETWEEN the textarea and the existing right-aligned Save-note
  button row — i.e. directly under the textarea, full-width, left-
  aligned. Rationale: Fatima's spec says "below the textarea",
  not "below the button"; and putting it above the button row makes
  the affirmation feel attached to the textarea's content rather
  than to the button's click.
- The pre-existing top-right "saved HH:MM" indicator (next to the
  "Your notes" eyebrow) stays. It serves a different purpose
  (timestamp of last save / persistent reassurance), and removing it
  is out of scope for F4.4.
- The pre-existing "saved ✓" 2s state on the button itself also
  stays. It's a button-local affordance and F4.3 just shipped its
  contrast fix; pulling it out now would regress that.
- Alternatives considered:
  - (a) Replace the top-right "saved HH:MM" with "saved to
    profile!" Rejected — the two indicators do different jobs
    (timestamp vs affirmation), and Fatima explicitly said "below
    the textarea".
  - (b) Put the line on the same row as the button (e.g. left-
    aligned next to a right-aligned button). Rejected — gets
    visually muddled with the button's own "saved ✓" state during
    explicit save (two "saved" things, same row). Stacking keeps
    them legibly separate.

## A-A8.2 — F4.4 saved-confirmation: 3-second auto-clear

- Scope doc says "auto-clears after a few seconds" (range, not
  exact). Picked **3 seconds**.
- Rationale: 2s is the button's own "saved ✓" duration and would
  feel too fast for a separate affirmation that's meant to be read
  as a sentence. 5s drags. 3s is the standard "toast" duration and
  matches user expectations.
- Implementation: separate `confirmTimer` ref so the confirmation
  line and the button's "saved ✓" state can run independently (the
  button clears at 2s, the line at 3s — the line lingering ~1s
  past the button is intentional and reads naturally).
- Would change if: Fatima wants it shorter (2s, matching the
  button) or longer (5s+, sticky enough to notice on a slow scan).

## A-A8.3 — F4.4 saved-confirmation: fires for both autosave AND explicit save

- The textarea has two save paths: `onBlur` (autosave, fires
  `persist()` directly) and the Save-note button (`handleExplicitSave`,
  also routes through `persist()`).
- I hoisted `showConfirm()` into `persist()` itself, so any path
  that completes a save flashes the line. Rationale: Fatima's
  feedback was about "after a note is saved" — she didn't
  distinguish autosave from explicit save, and showing the line
  only on the button click would feel arbitrary (autosave is the
  more common path).
- Alternative considered: fire only on explicit save, on the
  theory that autosave is "silent". Rejected — autosave is exactly
  where reassurance matters most (the user didn't take an
  action; the affirmation tells them their typing was caught).

## A-A8.4 — F4.4 saved-confirmation: styling = mono uppercase accent

- Class: `mono text-[10px] uppercase tracking-[0.14em] text-accent`.
- Matches the visual language of the eyebrow + button (mono, small,
  uppercase, tracked) — sits in the same family as the other
  metadata around the editor. `text-accent` (Vaporwave accent
  token) gives it the affirmative "this happened, and it's good"
  hue without screaming. Coral/success-green were both rejected —
  coral is for warnings, and the design system doesn't have a
  success-green token (intentionally — affirmations use accent).
- The row reserves `min-h-[1.25rem]` so the textarea-to-button gap
  doesn't shift when the line appears/disappears.
- `aria-live="polite"` + `aria-atomic="true"` on the wrapper so
  screen readers announce the save without stealing focus.


## A-A9.1 — F5.1 frames page: section order frames → add-button → ask-lobbycat panel

- Scope: frame cards on top, "+ Add a new frame" button below the
  list, "Ask lobbycat for frame ideas" (CatSuggestions) at the very
  bottom. Previously CatSuggestions was at the top of the page.
- Implementation: single JSX reorder in `FramesEditor` — move
  `<CatSuggestions />` from above the `<ul>` to after `<NewFrameForm />`.
  No layout/spacing changes; the outer `space-y-8` already provides
  consistent vertical rhythm so the panel reads as a distinct
  bottom section rather than an inline footer of the form.
- Rationale (per Fatima's note in the scope doc): with frames
  already populated, the "ask the cat" panel is suggestion-tier,
  not primary action — sinking it below the frame list and the
  add-affordance puts the primary CTAs first.
- Would change if: empty-state behaviour (zero frames) needs a
  different shape — currently the empty `<li>` placeholder still
  renders above the add button, which is correct: the user sees
  "no frames yet" → "+ Add a new frame" without scrolling past
  the ask-cat panel.

## A-A9.2 — F5.2 add-frame: real button styled like the dashboard primary CTA

- Previously rendered as a bare text link
  (`text-moss hover:underline`, lowercase "+ add new frame").
- New: a proper button styled
  `bg-action text-canvas hover:bg-action-hover px-4 py-2 rounded` —
  the same primary-CTA pattern PR #55 established for the
  Save-note button (and which the scope doc says matches dashboard
  CTAs).
- Label also gets a capital "A": "+ Add a new frame" — matches
  scope-doc casing and reads as a button label, not a soft link.
- Kept inside the same conditional render (only shows when the
  form is closed); when the form opens the affordance is replaced
  by the form panel as before. No state-machine change.
- Would change if: dashboard CTAs later move off `bg-action` to a
  different primary token — we'd update both this and Save-note
  together.

## A-A9.3 — F5.3 pole-label font size: text-[10px] → text-xs

- The pole-label line at the bottom-right of each frame card
  ("Pre-product → Established · 1–5") was rendered at `text-[10px]`,
  too small to read comfortably per Fatima.
- Bump to `text-xs` (12px) — minimal, matches the other small
  metadata in the card footer (the weight radio buttons are also
  `text-xs`).
- Kept `mono`, `text-whisper`, `ml-auto` so colour, family, and
  right-alignment are unchanged.
- Considered `text-sm` (14px) — felt too prominent, would compete
  with the weight controls on the left of the footer for visual
  weight. `text-xs` is the smallest size that's comfortably
  readable on retina + non-retina displays in this typeface.
- Would change if: Fatima still finds it too small — bump again to
  `text-sm` and possibly drop `mono` for serif to match the card
  body.

## A-A9.4 — F5.4 weight vocab swap: labels only, tokens unchanged

- Swap `WEIGHT_LABEL` map:
  - high: Must → **dealbreaker**
  - medium: Should → **important**
  - low: Could → **nice to have**
- Tokens (`high` / `medium` / `low`) untouched — they're the DB
  enum values, the `FrameWeightLevel` type, the
  `setFrameWeights` server-action input, and the scoring engine's
  weighting key. Touching them would mean a migration, a server-
  action shape change, and a scorer rewrite. Scope doc explicitly
  says "Same underlying tokens — just the labels change."
- `WEIGHT_HELP` tooltip text also updated so the long-form
  description matches the short label ("dealbreaker — score this
  heavily", "important — default weighting", "nice to have —
  gentle nudge only"). Previously the help text already used
  "deal-breaker / matters / nice-to-have" phrasings; aligned to
  the new short labels for consistency.
- Labels are lowercase (per scope doc: "dealbreaker | important |
  nice to have"). The radio buttons themselves use `uppercase` in
  their className, so they'll render as DEALBREAKER / IMPORTANT /
  NICE TO HAVE in the UI — consistent with the previous MUST /
  SHOULD / COULD rendering.
- Scope: limited to `src/components/frames-editor.tsx`. The
  scoring engine (`@/lib/scoring/aggregate`), the FrameScorer
  component, and the DB schema all use the high/medium/low tokens
  directly and need no changes.

## A-B10 — F6.1 /about → /profile rename + 308 redirect + nav update (Phase B item 10)

- **A-B10.1** The page at `src/app/about/{page,error}.tsx` is renamed in
  place to `src/app/profile/{page,error}.tsx` via `git mv` — same file
  contents, only the route segment changes. No co-located components live
  under `src/app/about/`, so the rename is a clean two-file move.
- **A-B10.2** The 308 permanent redirect from `/about` → `/profile` is
  expressed via `next.config.ts` `redirects()` with `permanent: true`
  (Next.js maps `permanent: true` to HTTP 308). This is preferred over an
  `/about/page.tsx` stub that calls `permanentRedirect()` because (a) it
  avoids a stray route segment in the App Router, (b) it runs at the edge
  before the request reaches React, and (c) it's the one canonical place
  to find route renames.
- **A-B10.3** Nav label changes from "About" → "Profile" with `href`
  `/about` → `/profile` in `src/components/site-shell.tsx`. The 308 means
  the old href would still work, but updating the canonical link avoids
  the gratuitous redirect on every nav click.
- **A-B10.4** All eight `revalidatePath("/about")` call sites in
  `src/app/actions.ts` and `src/app/actions-wizard.ts` switch to
  `revalidatePath("/profile")`. These are server-action cache busts: the
  page they revalidate is now at `/profile`, so the path argument must
  match the new segment (revalidatePath is matched against the App Router
  route, not the public URL, so the 308 wouldn't help here).
- **A-B10.5** Doc-comment references to `/about` in `src/app/actions.ts`,
  `src/app/actions-wizard.ts`, `src/lib/queries.ts`,
  `src/components/replay-onboarding-link.tsx`, and
  `src/components/explainer-box.tsx` are also updated to `/profile` so
  future readers aren't sent looking for a route that no longer exists.
  Seed-data URLs containing `/about` (e.g. `deepmind.google/about/`) are
  external company URLs and are left untouched.

## Phase B item 11 — F2.2 / F2.3 (empty-updates state + vaporwave alert box)

Single file: `src/components/welcome-card.tsx`, inside the
`WelcomeBackDiff` subcomponent (the panel that already lives under the
welcome quote on the dashboard home).

- **A-B11.1** F2.3 "vaporwave alert box" reuses the established
  cyan-top + magenta-left + rule-right + rule-bottom frame from
  `src/components/dashboard-cards.tsx` §3.4, with the same `--card-interior-bg`
  body. Defined inline (`alertFrame`) rather than promoted to a shared
  primitive: it's the second use, not the third, and the rule of three
  for extracting a vaporwave-frame component is still better deferred
  until a third caller shows up. Token usage matches dashboard-cards so
  any future palette tweak in `vaporwave.css` propagates to both
  surfaces.
- **A-B11.2** F2.3 keeps the existing personalized headline
  ("New since you were last in, {firstName}…") rather than swapping to
  the spec's illustrative "what's new". Spec uses "like 'what's new'" so
  the headline copy was illustrative; the personalized line is the v0.7
  step-8 named greeting Fatima specifically wanted and reads warmer than
  a generic label. The headline color shifts from `text-whisper` to
  `text-readout` so it reads as a cyan eyebrow on the alert frame,
  consistent with eyebrow usage on dashboard cards
  (e.g. dashboard-cards.tsx line 130).
- **A-B11.3** F2.2 (empty state) gets the same alert frame as F2.3, not
  a smaller / different treatment. Rationale: the dashboard home should
  open with a real, recognisable panel even when there are no updates,
  so the eye doesn't land on dead vertical space below the welcome quote
  (that's the actual F2.2 complaint). The frame stays calm because the
  body is a single prose-face line in `text-card-interior-muted`, not a
  list, so the empty state is visually quieter than the populated one
  without disappearing.
- **A-B11.4** Empty-state copy: "nothing new since your last visit — the
  cat will let you know." Kept short, lobbycat-voiced, prose-face. The
  data-testid stays `welcome-back-empty` so any future smoke test that
  asserts the presence of the empty state still finds it; the
  `aria-label` is upgraded from implicit (the old div had none) to
  "no new updates since you were last in" for screen-reader parity with
  the populated state's `aria-label`.
- **A-B11.5** Bullet glyph color switches from the literal
  `var(--accent,#FF00FF)` fallback to `var(--accent-action)` (the
  vaporwave magenta token). The literal hex fallback was a v0.7 fallback
  for when the token wasn't guaranteed; in v0.8.1 the vaporwave tokens
  are always loaded via `globals.css → vaporwave.css`, so the fallback
  is dead code and only added drift risk if `--accent-action` ever moved.

## Phase B item 12 — F4.2 (Lobbycat-says fix)

**A-B12.1** "Enter to send, Shift+Enter for newline" is the right
default for a chat-shaped textarea. The spec said "Enter key should
also send" without specifying a modifier; modern chat UIs (Slack,
Discord, ChatGPT) all default to plain-Enter-sends with Shift+Enter
for newlines, and the textarea here is one-or-two lines of follow-up
prose, not a long-form composer. Kept ⌘/Ctrl+Enter as a parallel
shortcut so anyone with the old muscle memory from the v0.8 ship
isn't surprised. Also guarded against IME composition via
`e.nativeEvent.isComposing` so CJK typing doesn't accidentally fire
the send on the composition's terminating Enter.

**A-B12.2** "Real button" means matching F4.3's save-note CTA pattern
(`bg-action text-canvas hover:bg-action-hover` + `px-3 py-2 rounded-sm`).
Same component family, same page, immediately adjacent visually —
having two different "this is a real button" treatments on one page
would look like a bug. F5.2's "+ Add a new frame" button used the same
token family. So this is the third use of that pattern; it's getting
close to extract-time, but per rule-of-three I'm holding until a
fourth instance so the abstraction is shaped by actual variance, not
guessed.

**A-B12.3** "The feature doesn't actually work" — couldn't reproduce
a hard failure in the server action (`sendFitNoteMessage` correctly
persists the user row, calls Anthropic, persists the cat reply, then
revalidates). What DOES read as broken from the user's seat: after
hitting send, the textarea clears but **nothing visible happens for
several seconds** (Anthropic round-trip), AND if the thread was empty
the LoadingCat was gated behind `thread.length > 0` so the entire
follow-up area went blank. Fixed by (a) optimistically rendering the
just-sent user message via `pendingUserMessage` state, cleared in the
`finally` of the transition once revalidate brings the persisted row
back; and (b) showing the loading state and the optimistic message
even when `thread.length === 0`. If there's a deeper functional bug
Fatima saw (e.g. Anthropic key missing in prod, or revalidatePath not
bumping a particular user's cache), the optimistic render at least
makes the UI honest about what state it's in, and any thrown error
restores the draft so nothing is lost.

**A-B12.4** Kept `revalidatePath('/companies/[slug]', 'page')` even
though it looks suspicious — every other action in `src/app/actions.ts`
uses the exact same string-literal-bracket syntax and the save-note +
frame-score flows demonstrably work (F4.3/F4.4 confirmed it).
Next.js does support this form for dynamic segment revalidation; not
the bug.

**A-B12.5** The optimistic user-bubble uses `opacity-80` so it reads
as "in flight" without flashing or moving once the persisted row
arrives. The persisted row will have the same content + a real `id`,
so React swaps the keyed list entry cleanly (the optimistic `li` has
`key="pending-user"`; the persisted one keys off `m.id`). No
double-render in the window between revalidate and `setPendingUserMessage(null)`
because the `finally` block runs after the server action resolves,
which only happens once revalidatePath has been called — by which
point the persisted row is already in `thread`.
