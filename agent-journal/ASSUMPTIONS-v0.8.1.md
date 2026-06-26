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
