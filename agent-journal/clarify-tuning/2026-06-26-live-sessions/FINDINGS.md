# v0.8 Step 12 pass 2/2 — live tuning findings

**Date:** 2026-06-26
**Method:** 7 seeded clarify sessions run against the live skill via
`scripts/clarify-tune-live-sessions.ts`. Each scenario covers a
different combination of (trigger, seed company, user-reply pattern).
The harness bypasses the DB persistence path so prod data stays clean;
only the system prompt + Anthropic call match the live UI.

Transcripts: `session-{01..07}-*.md` in this directory.

---

## What's working well

- **Voice is consistent and recognisable.** Lowercase friendly, dry,
  italic for thinking out loud, no flattery, no list-making. The cat
  sounds like the cat I authored in SKILL.md.
- **Specific data citation, not generic.** Every opener references the
  user's actual frame names ("Working style", "Policy posture"),
  weights ("Must", "Low"), and where relevant their scores ("4.8/5
  on Stage of company"). Cat is reading the grounding, not improvising.
- **The honest-mirror move lands hard when triggered.** Session 2
  ("i don't actually want to move") and session 3 ("i don't want to
  admit it's the obvious answer") produce the sharpest, most honest
  cat responses in the set.
- **Session 5 ends without a proposal.** When the user has no signal
  ("haven't had bandwidth"), the cat closes clean instead of forcing a
  fake insight. This is exactly the empty-session contract from
  voice.md §closer-2 working as designed.
- **Session 6 (Apollo) is the model session.** Hidden-frame surfaces
  organically, user's own language ("argue with each other in
  public") becomes the proposed frame name. This is the shape every
  session should aspire to.

## Findings to address

### F-tune-1 — Five of seven sessions open with the SAME contradiction.

Sessions 1, 4, 5, 6, 7 all open with some version of:

> "you marked *Working style* and *Team style* as Must... but
>  *Policy posture* sits at Low. that's the tension."

The cat is identifying the loudest signal in Aadi's frame weights and
opening on it deterministically. That's correct for a single session,
wrong for an aggregate — repeated openers across triggers don't read
as "the cat noticed something this time", they read as "the cat has
one note and keeps playing it."

**Fix candidate:** moves.md should explicitly note that the contradiction
move should *vary the signal* if there's any other usable data — recent
scores, recent notes, the seed company itself, the seed frame, glyphie
feed events. Pick the freshest or most relevant signal first; only fall
back to the loudest static weights when nothing recent is available.

### F-tune-2 — Wizard trigger opens identically to manual.

Session 4 (`trigger=wizard`) opened with the same Policy-posture
contradiction as Session 1 (`trigger=manual`). The `openerPrompt()`
in run-session.ts hints at "3-question seeded opener per the skill",
but SKILL.md and moves.md have no guidance on what a *wizard-seeded*
opener should look like.

A wizard session is mid-onboarding — the user just finished setting
frames and weights. Opening with "your weights are inconsistent" is
wrong; they haven't lived with the frames yet. A wizard opener should
be more *welcoming* and *calibrating* — naming what the user said in
the wizard, asking a soft what-mattered question.

**Fix candidate:** moves.md needs a §6.5 or §7 note (or a dedicated
move) for the wizard opener. Something like: "in a wizard-trigger
session, lead with what the user *just told you* in the open-text
answers, not with what their weights might contradict. They haven't
had time to drift yet."

### F-tune-3 — `cold-open` move tag mislabelled in session 1.

Session 1 turn 1 is tagged `*(move: cold-open)*` but the body is a
softer restatement of the same contradiction the cat opened with. The
cold-open move is for *no-data* situations (moves.md §6 — "I'm coming
in cold today — no recent scores, no notes from this week"). Tagging
a follow-up turn as cold-open is a category error.

The cat seems to be reaching for `cold-open` because the user said
"nothing specific" — interpreting "thin user signal" as "thin
context." Those are different things.

**Fix candidate:** moves.md §6 (cold-open) should distinguish more
sharply: "the cold-open move is about *the data the cat has at session
start*, not about how the user is engaging mid-session. If the user
gives a non-committal reply mid-session, the right move is usually
exit or a softer hidden-frame, not a re-cold-open."

### F-tune-4 — Hidden-frame is the proposal in 4 of 7 sessions.

Sessions 1, 2, 3, 6 all propose adding a new frame. Some of these are
genuine (session 6's "argue-with-able" is exactly right), but some
read as the cat's default fallback when a contradiction has been
surfaced. Sessions 2 ("location constraint") and 3 ("narrative
unexpectedness") are reasonable proposals but the convergence on
new-frame as the only proposal kind across sessions is itself a
signal.

The other valid kinds — `frame-weight` (bump an existing frame's
weight) and `company-note` (add a one-line note on a company) — are
proposed in zero sessions. That's a meaningful absence.

**Fix candidate:** SKILL.md "End-of-session proposal" section should
note that `frame-weight` and `company-note` proposals are often the
*lighter* and *more accurate* shape — adding a frame is a real
commitment, and the cat should prefer "bump this weight" or "add this
note" when the insight is smaller in scope. moves.md exit move §6
could echo this.

### F-tune-5 — "the cat" self-reference is inconsistent.

Mid-session, the cat sometimes refers to herself in the third person
("the cat is sitting with that", "the cat will leave it there") and
sometimes implicit-first-person (no self-reference, just speaks
directly). Both registers appear in 6 of 7 sessions, often within the
same session.

Voice.md SOUL section calls for "third person on session notes,
first-person ('you', no 'i') in conversation" — but in practice the
live cat slips into third-person self-reference *inside* the
conversation. Sometimes it works (when used as a thinking-out-loud
beat), sometimes it reads as performative.

**Fix candidate:** voice.md should sharpen the rule: "third-person
self-reference (\"the cat will leave it there\") is allowed at most
once per session, used as a soft closing beat. Default to direct
address (no 'i', no 'the cat') for normal turns."

### F-tune-6 — Italic-cat-thinking-out-loud appears in every session.

*"the cat pauses"*, *"the cat is sitting with that"*, *"holding that
for a second"*, *"reading that twice"*. This is the same anti-pattern
as F-tune-5 in italics. It's evocative the first time, becomes
mannered on repeat.

**Fix candidate:** SKILL.md "Refuse to" or voice.md §don'ts should add:
"italic thinking-out-loud beats (\"the cat is sitting with that\")
are allowed at most once per session. Beyond that they read as a tic,
not as honest pause."

### F-tune-7 — Proposal IDs are invented (low severity).

Session 2 proposed `frame-weight` on a frame that doesn't exist
("location constraint"). The proposal markup the parser caught was a
plain string ("add a new frame: 'location constraint'") — clean enough
for human reading, but the `proposal_data` JSON the parser stored
would have no real frameId to act on. The apply-proposal action
(applyClarifyProposal in src/lib/clarify/apply-proposal.ts) would
need to handle "this is a new frame, not a bump" gracefully.

This is a Step 5/6 quality issue, not a skill-tuning one — but worth
flagging.

**Fix candidate:** none in skill. apply-proposal.ts should validate
proposal payload kinds against real DB IDs before writing, with a
clear error path back to the panel if the cat proposes something
unactionable.

---

## What ships in this commit

Tuning to SKILL.md + reference/{moves,voice,examples}.md addressing
F-tune-1, F-tune-2, F-tune-3, F-tune-4, F-tune-5, F-tune-6.

F-tune-7 is flagged for a separate `applyClarifyProposal` hardening
pass — not part of Step 12.

Transcripts kept in `agent-journal/clarify-tuning/2026-06-26-live-sessions/`
as the evidence base; future tuning passes can re-run the same
scenarios and diff the cat's behaviour.
