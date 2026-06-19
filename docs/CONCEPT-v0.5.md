# Lobbycat v0.5 — Concept Doc

**Status:** DRAFT — pending Fatima's sign-off
**Authors:** Lotus 🪷 (in conversation with Fatima)
**Date opened:** 2026-06-19
**Supersedes:** v0.4 implementation plan (which over-built before the shape was right)

---

## What this doc is

A sign-off doc, not a feature ship. v0.4 shipped a working surface but over-built before the product shape was settled — too many features for a dataset and visual language that hadn't earned them yet. v0.5 is a deliberate narrowing: one city (London), one user (Aadi), a redesigned visual language, and a tightened information architecture that makes the **frames** the thing you actually use Lobbycat *for*.

Read this end-to-end before any code lands. Every section answers one question. When Fatima signs off, the implementation order in §9 becomes the build plan.

---

## 1. Product, one sentence

**Lobbycat is a curated map of London's AI-policy companies, organised across six frames, that helps Aadi scout the field and calibrate his sense of where each company sits — and, occasionally, prep before a meeting.**

Unpacked, briefly, so the sentence has teeth:

- **Curated** — not a directory, not a scraper output. Editorial choices, with rationale attached.
- **London** — the v0.5 dataset is London-only. The narrowing is the point: a small, well-known set we can score honestly and revisit when reality shifts.
- **Six frames** — the lens. Geographic remit, policy area scope, stage of company, policy posture, working style, team style. The frames *are* the IA (see §2).
- **Scout + Calibrate (sometimes Pre-meeting prep)** — the JTBD, in Fatima's words. Scout = "who's in this space?" Calibrate = "where do I think each one sits?" Pre-meeting prep = "what should I know before this conversation?" Everything else is a nice-to-have we are deliberately not building yet.
- **Aadi** — one user, one mental model, one set of priors. Designing for n=1 is the discipline that lets the frames carry editorial weight instead of pretending to be neutral.

Out of scope for v0.5, stated plainly so we don't drift: warm intros, ATS feeds, RSS ingestion, EU Transparency Register, US LDA, magic-link auth, in-app agent chat. v0.4 was the over-build; v0.5 is the pullback.

---

## 2. The six frames

The frames are the product. Everything else — the Map, Compare, Surprise, fit-notes — is a way of putting a frame between Aadi and a company so he can see the company *in that light*. v0.4 shipped five frames; v0.5 adds a sixth (**Team style**) and renames/sharpens the others to match how Aadi actually talks about the field.

Each frame is a 1–5 scale with named poles. The poles aren't moral ("1 is bad, 5 is good") — they're directional, and which end is interesting depends on what Aadi's scouting for that day. The scores are editorial, with a one-sentence rationale stored alongside each (company × frame) cell. When the rationale and the score disagree on a re-read, the rationale wins and the score updates.

### 2.1 Geographic remit

**1 — Very UK-bound  ↔  5 — Globally distributed**

How much of the company's policy work happens *in and for the UK* versus across multiple jurisdictions. A 1 is a London shop that briefs UK regulators, talks to UK media, hires from UK PhD programmes, and treats Brussels and DC as someone else's problem. A 5 is a multi-hub operation where the London office is one node among several, the policy team coordinates across timezones, and "UK position" is a thing they have *opinions* about rather than a default.

For Aadi: relevant because the bet on the UK-specific career path narrows or widens depending on where a company's centre of gravity actually sits. A London office isn't the same as a London company.

### 2.2 Policy area scope

**1 — Single-issue specialist  ↔  5 — Broad multi-domain**

How wide the company's policy surface is. A 1 has picked one fight — model evaluations, or copyright, or open-weights licensing — and gone deep. A 5 touches everything from compute export controls to age-appropriate design to public-sector procurement, and accepts the cost of being shallower in any one area.

For Aadi: the specialists are where you learn the dossier; the generalists are where you learn the *shape* of the field. Both are interesting; they're interesting for different reasons.

### 2.3 Stage of company

**1 — Pre-product / early-stage  ↔  5 — Scaled / established**

Where the company sits on the maturity curve — funding, headcount, product-in-market, regulatory footprint. A 1 is six people in a WeWork with a Stripe account and a strong opinion. A 5 has a global comms team, a regulatory affairs function, and a seat at the table when the AI Safety Institute calls a meeting.

For Aadi: not a quality signal — early-stage shops do some of the most consequential policy thinking precisely because they have to define their own posture rather than inherit one. But the *kind* of work, and the *speed* of learning, differ sharply by stage.

### 2.4 Policy posture

**1 — Frontier-defining  ↔  5 — Compliance-maintaining**

Whether the company is *writing* the rules of the game or *playing* the existing ones well. A 1 publishes Responsible Scaling Policies, drafts model cards before anyone asks for them, and shows up to consultations with new frameworks rather than responses to existing ones. A 5 has a mature compliance function, reads every new statutory instrument carefully, and competes on doing the known thing reliably.

For Aadi: this is the frame that most often *changes his mind* about a company. The two ends look superficially similar from the outside (both are "the policy team"); the day-to-day work could not be more different.

### 2.5 Working style

**1 — Writing-led  ↔  5 — Government affairs-led**

How the policy team spends its hours. A 1 is a writing shop: long-form public posts, position papers, technical reports, blog essays that other people in the field quote. A 5 is a government affairs shop: meetings in Westminster, briefings to officials, coalition work, off-the-record conversations that show up in regulation months later.

For Aadi: a personal-fit frame. He can do either; he has a preference for one. Knowing where a company actually sits (not where they say they sit on a careers page) is most of the question for him.

### 2.6 Team style

**1 — Set the frontier  ↔  5 — Execute the playbook**

Whether the team is figuring out what good looks like as they go, or executing a known playbook well. A 1 is a small team building the practice from scratch — no template to follow, lots of judgement calls, lots of "we'll know in two years if this was right." A 5 has a clear set of plays, runs them tightly, and measures the team on consistency rather than novelty.

For Aadi: closely related to **Policy posture** but distinct — a company can be frontier-defining on its *public* posture (1 on §2.4) while running a tight internal playbook (5 here), and vice versa. This frame is about what a Monday morning on the team actually feels like.

---

### A note on what the frames are *not*

They are not a scoring system that ranks companies. There is no "best frame" and no aggregate "lobbycat score" anywhere in v0.5. A company that's a 1 on every frame and a company that's a 5 on every frame are equally valid; the frames exist so Aadi can find the *interesting variation* across the field, not so the field can be linearly ordered.

They are also not stable across time. A company's stage changes; a posture can shift after a leadership hire; the geographic remit moves when a hub opens. The (company × frame) scores are editorial *as of a date*, and a re-curation pass is part of the v0.5 implementation order (§9).

---

## 3. Information architecture

v0.4 had five top-level destinations (`Map`, `Compare`, `Frames`, `Companies`, `About`) plus an inline-expand drawer on `/companies` and a pinned drawer on the Map. It worked, but it taught us the wrong thing: the list page kept pulling Aadi *out* of the frame-shaped reading and back into directory mode, where the editorial work is hardest to see. v0.5 collapses the nav around the frames and makes the list a fallback, not a destination.

### 3.1 Global nav

**`Map · Compare · Frames · About`** — four items, in that order.

- **Map** is the home view. The first thing Aadi sees is a 2D plot of London companies positioned on the two frames he's chosen (axis-picker right above the plot), with hover-preview and click-to-pin behaviour carried over from v0.4. Map is where most sessions start and where most sessions return between detours.
- **Compare** is the side-by-side reading. Pick 2–4 companies; see their frame scores, fit-notes, open roles, and recent publications in adjacent columns. This is the view Aadi opens when he's already narrowed down — pre-meeting prep lives here as much as scouting does.
- **Frames** is the editor and the explainer. It lists the six frames with their pole labels and one-paragraph descriptions (the prose in §2), lets Aadi edit the descriptions on his own copy, and — in v0.5 — lets him re-weight how heavily each frame contributes to the implicit "fit" sort wherever a sort exists. Frames is also the canonical place to *read* what the six frames mean if onboarding skipped it.
- **About** is the personal-state surface: profile (name, current role context, weights, concerns), the "show me around again" replay link for onboarding, the next-role textarea (the cat's diff-review loop carried over from v0.4 N2), and the small printed list of who built this and when.

What's gone from the nav: **`Companies`**. The list page dies as a destination (see §3.4 below for the migration path).

### 3.2 The home view in detail

Home is `Map` — there is no separate landing page. The home route renders:

1. A **single-sentence product line** at the top (the §1 sentence, or a tightened version of it), small and quiet — not hero copy.
2. The **axis-picker row**: two `<select>`s, one for the X-axis frame and one for the Y-axis frame, defaulting to *Policy posture* × *Working style* (the pair Aadi reaches for most). Changing either axis re-plots without a route change.
3. The **map plot** itself: a 2D positioning of every London company in v0.5's dataset, dotted by tier, with pinned-state opening the `<CompanyDrawer>` below the plot (carried over from v0.4 N1 part 3 — see §8).
4. A **Surprise button** anchored top-right of the plot area: a single, prominent button labelled `Surprise me`. Clicking opens the Surprise modal (full spec in §5). The button is the *only* entry point to Surprise — no global nav slot, no separate page.

That's the whole home view. No "featured companies" carousel, no "recent activity" feed, no curated rail. The frame-shaped Map is the editorial statement; Surprise is the playful escape hatch.

### 3.3 Surprise as a modal, not a page

The Surprise feature lives behind a **modal button**, not as a sibling of Map / Compare / Frames. This is deliberate.

- **It's a moment, not a section.** Surprise is the equivalent of flipping to a random page of a well-edited magazine — fun precisely because it interrupts the structured reading. Putting it in the global nav would turn it into a destination Aadi feels he *should* visit, which kills the delight.
- **It always answers from the current Map context.** Because Surprise is summoned from home, it can know which two frames are currently on the axes, which companies are visible in the current viewport, and which tier filters (if any) are active. Variant logic (§5) uses this context.
- **It never blocks navigation.** The modal is dismissable with ESC, click-outside, or an explicit `Close`. Picking a Surprise result navigates to the company drawer (in-place on the Map) — not a separate detail page.

### 3.4 What replaces the Companies list page

The `/companies` route, the inline-expanded rows, and the dedicated "browse the full list" link are removed in v0.5. Reading a company in v0.5 happens through one of three routes, in priority order:

1. **From the Map.** Click a dot → `<CompanyDrawer>` opens below the plot with roles + publications + frame scores + fit-note + a link to the full company page. This is the dominant path.
2. **From Compare.** Pick a company in the compare selector → it appears as a column with the same drawer-shaped content. Used when Aadi already has a shortlist in mind.
3. **From Surprise.** A Surprise pick opens the same drawer in-place on the Map. Used when Aadi wants to be nudged.

There is no fourth route. If Aadi wants to scan the whole field flat, he uses the Map with no axis filtering — the plot *is* the index. The `/companies/[slug]` deep-work route survives unchanged (linked from every drawer's `Open full view →`) because that's the home of fit-notes, full publication lists, and frame-score editing; it's just no longer reachable from a list page.

### 3.5 What the IA is *for*

The load-bearing claim of this section is: **every primary surface in v0.5 puts a frame between Aadi and a company.** Map plots companies on two frames at once. Compare reads companies along all six frames in parallel. Frames is the frames themselves. Surprise picks a company because of a frame-shaped reason. About holds the weights that re-rank everything across the frames.

When we're tempted to add a feature in v0.5, the test is: *does this put a frame between Aadi and a company, or does it route around the frames?* If it routes around them, it doesn't belong in v0.5 — it belongs in v0.6 or in the drawer of "things v0.4 over-built."

---

## 4. First-time experience flow

The first session sets the editorial register for everything that follows. v0.4's onboarding was a driver.js coachmark tour layered over the live Map — functional, but it leaked the product *into* the explanation: Aadi met Lobbycat by being walked around its UI chrome. v0.5 inverts that. Before he touches the surface, he reads a four-panel comic strip that says what this is, who it's for, and how the frames work. Then a gentle password gate. Then he lands on the home Map with a Surprise *already cued up*, so the first thing he does is pull a lever, not stare at axes.

The ordering is the point: **story → gate → first delight**, in that sequence. Each step is one screen, dismissable forward only, no skip until panel 4.

### 4.1 The four comic panels

The panels are styled in the v0.5 design language (§6): mono-forward type, deep-navy panels, the pixel-retro-terminal cat as the recurring character, cyan readouts and coral signals for the small interface details inside the comic. Each panel is one screen at mobile and desktop; advancing is a single button — `Next →` on panels 1–3, `Open the door` on panel 4. There is no back button (the comic is short enough that re-reading means restarting from About → "show me around again").

**Panel 1 — "This is Lobbycat."**

The pixel-retro-terminal cat sits in front of a CRT showing a sparse 2D plot of dots. One-line caption above: *A curated map of London's AI-policy companies.* One-line caption below, in the cat's voice: *I read the field so you can pick where to point next.* This panel does the **what** — a sentence and an image, no scrolling, no chrome. Aadi should be able to close the tab here and have an accurate mental model of the product.

**Panel 2 — "Six frames."**

The cat is at a desk with six labelled cards laid out in front of it (the §2 frames, named, one short pole-pair each). The cards aren't legible as a reading surface — they're props that show *there are six*, that they have *named poles*, and that they're *editorial cards, not metrics*. Caption, cat's voice: *Every company gets read along these six. You'll see them on the axes, in compare, and behind every nudge I give you.* This panel does the **lens** — it plants the frames as the load-bearing concept before Aadi sees the Map.

**Panel 3 — "Two at a time."**

The cat is pointing at a stylised version of the home Map: an X-axis and a Y-axis labelled with two of the frames, a scatter of dots, one dot pinned with a small drawer-stub underneath. Caption, cat's voice: *Pick any two frames for the axes. Hover a dot to peek, click to pin, dig in below.* This panel does the **how** — it pre-loads the map gesture (hover / click / drawer) so the first session on the real Map doesn't need a tooltip to explain itself. No driver.js, no coachmark, no live-element highlight.

**Panel 4 — "And when you don't know where to look —"**

The cat is mid-shrug, paws on a single button reading `Surprise me`. The button on screen is the same one Aadi will see on the Map seconds later — same shape, same type, same colour treatment. Caption, cat's voice: *— I'll pick one for you, and tell you why.* Button reads `Open the door`. The transition from panel 4 to the password screen is the only "don't break the spell" moment in the onboarding: the comic panel fades, the password input rises into the same frame, and the cat stays on screen during the gate.

### 4.2 The password gate

v0.5 is a small, named pre-launch product for one user; it does not need real auth and does not yet have a magic-link flow. A single shared password — **`candy-kittens-pink`** — gates the surface. The gate exists for two reasons:

1. **It keeps the surface unindexed.** Bots and link-share previews can't reach the Map. The robots.txt + the gate together mean a stray tweet doesn't surface the URL to the open web.
2. **It marks the threshold.** The password is the small ritual that says *you are entering a curated thing, not a directory*. "candy-kittens-pink" carries that register on purpose — it's whimsical, low-stakes, and unmistakably *not* enterprise auth.

Mechanics: one input, monospaced placeholder *enter the password*, submit button reads `Unlock`. Wrong password shakes the input and shows *try again* in coral; no rate limit, no lockout, no "forgot password" link (if Aadi forgets, the cron-running operator tells him). Right password sets a long-lived cookie (`lc_v05_unlocked`, 90 days, `httpOnly`, `sameSite: lax`) and pushes him to home. The cookie's presence — not a session table — is the entire auth state. Logout is `Forget me` on About, which clears the cookie.

The gate is **outside** the comic strip. Re-arriving on the gate (cookie expired, new device) does *not* replay the comic — the comic ran once and the user-profile row remembers that. Re-replay is opt-in from About (the v0.4 *show me around again* affordance survives, now triggering the comic instead of the coachmark tour).

### 4.3 First home — Surprise already cued

After the gate, Aadi lands on `/` — the home Map (§3.2). The first-session render differs from every subsequent render in exactly one way: **the Surprise modal is already open**, with a freshly generated pick visible.

- The Map renders behind the modal at default axes (*Policy posture* × *Working style*), so when he closes the modal he's already on the canvas.
- The Surprise inside the modal is a variant A (Adjacency) pick by default for the first run (see §5.2 for variant logic) — Adjacency is the most legible variant for a cold start because its reason references the axes Aadi can see behind the modal.
- The modal is dismissable normally (ESC, click-outside, `Close`). Clicking the pick navigates to that company's drawer on the Map, in-place; the modal closes behind him.
- A small whisper line under the pick reads *every surprise has a reason — here's yours.* This line only appears on the first-session modal; subsequent Surprise opens don't repeat it.

**Why open the modal automatically.** Panel 4 of the comic just promised "I'll pick one for you." The first-home modal *delivers* on that promise inside the same gesture. The alternative — landing on an empty Map and waiting for him to find the Surprise button — would teach him that the comic's promises and the surface's behaviour are weakly linked. The auto-open is the only place in v0.5 where the product does something for him without being asked; that one indulgence pays for the comic's editorial weight.

**Why default to variant A.** The Adjacency reason ("this company sits close to *X* on the axes you're viewing") is the only Surprise reason that's *immediately verifiable* against the Map behind the modal. Recency and Underrated both need context Aadi doesn't yet have on first run (the recency of the field's publications, his own under-attention pattern). Variant A is the kindest first taste.

### 4.4 What the first session does *not* include

Things deliberately not in the first-time experience flow, with reasons:

- **No name / role / weight collection on first run.** v0.4 asked for these upfront and slowed the time-to-first-Surprise to a minute. v0.5 lets the About page collect them whenever Aadi gets there; the comic and the first Surprise both work without a profile row. (Frame weighting defaults to uniform until he sets it.)
- **No tutorial on Compare or Frames.** Those surfaces are reached from the global nav and are self-explanatory enough that explaining them in panels 5 and 6 would push the comic past its readable length. Compare's first-visit can carry one whisper line; Frames is its own explainer (it *is* the explainer).
- **No "meet the cat" anthropomorphism beyond the panels.** The cat is the comic's narrator and a small presence on About; it does *not* live in the corner of the Map giving running commentary. The frames carry the editorial voice on the live surface; the cat carries it in the onboarding moment and in the diff-review loop on About.
- **No skip-to-end on the comic.** The skip button on panels 1–3 reads `Skip` and dismisses the *whole* comic (goes straight to the password gate), it does not advance to panel 4. Skipping is allowed but it's all-or-nothing — partial onboarding is worse than no onboarding for setting the editorial register.

---

## 5. Surprise modal spec

Surprise is v0.5's only piece of *generated* editorial. Everything else on the surface is curated-up-front: the frames, the scores, the fit-notes, the Compare columns. Surprise is the moment where Lobbycat behaves a little less like a map and a little more like a colleague who's read the field and says *have you looked at this one?* — and tells you why they brought it up. The "why" is non-negotiable: there is no version of Surprise in v0.5 where a company is recommended without a reason attached. A pick without a reason is just a random row; a pick with a reason is editorial.

### 5.1 Anatomy of the modal

One pick per open. Centred, ~520px wide, deep-navy panel on a dimmed Map backdrop, mono type. The contents, top to bottom:

1. **Variant tag** — a short pill in cyan readout style: `ADJACENCY`, `RECENCY`, or `UNDERRATED`. Three letters max plus the word. Lowercase the word, uppercase the letters — the tag is a *label*, not a header. It tells Aadi *what kind* of surprise this is in one glance, so he can calibrate how much weight to give it before he reads the reason.
2. **The company name** — the only headline-weight type in the modal. Clickable; clicking it (or the explicit `Open →`) closes the modal and routes to the company drawer on the Map (§3.4 route 3).
3. **One-sentence frame-shaped reason** — the load-bearing line. Two clauses, joined by an em-dash or a comma. The first clause names the frame(s) involved; the second clause says what's interesting given that frame. Concrete examples in §5.3.
4. **A four-cell mini-frame readout** — the company's score on the four frames the reason *doesn't* mention, shown as `frame name · n/5` rows in dimmed cyan. This is the "and here's the rest of the picture" beat: the modal commits to one frame-shaped reason in prose, but it shows the other four scores so Aadi isn't reading the pick in a vacuum.
5. **Two buttons in a row** — `Open →` (primary, electric blue) and `Surprise me again` (secondary, ghost-style). `Open` navigates to the drawer. `Surprise me again` re-rolls in place — same modal, new pick, with the variant *rotated* (A → B → C → A) rather than re-randomised, so Aadi sees one of each kind within three rolls.
6. **A close affordance** — `Close` text link bottom-left, plus ESC and click-outside. Closing the modal returns to the Map exactly as it was before opening (axes preserved, pinned drawer preserved, scroll preserved).

What the modal does **not** contain: a frame-score chart for the picked company (lives in the drawer), the company's roles or publications (drawer), a "more like this" rail (would dilute the one-pick discipline), a "save for later" star (no saved-picks list in v0.5 — see §7).

### 5.2 The three variants

Three variants, in deliberate order. Every Surprise is one of these and *only* one — the variant determines the reason-shape, which determines what the pick is "for."

**Variant A — Adjacency.**
*"Sits close to *[anchor company]* on the axes you're viewing — but [diverges on frame X]."*
The pick is chosen because, plotted on the two axes Aadi currently has on the Map (§3.2), it lands within a small neighbourhood of an *anchor* — either a currently-pinned company, or, if nothing is pinned, the company at the visual centre of the current viewport. The reason names the anchor *and* names the frame on which the pick differs most sharply from the anchor (highest delta across the four non-axis frames). Use case: scout. Adjacency surfaces companies Aadi would have found himself with one more click, with an editorial nudge about *what* makes the second one different from the first. This is the variant the first-session modal uses (§4.3).

**Variant B — Recency.**
*"Just shifted on [frame X] — [direction] — because of [event/publication]."*
The pick is chosen because the editorial record (the score-change log on `(company × frame)` cells) shows a movement on one of the six frames within the last ~60 days, attached to a logged reason (a publication, a hire, a regulatory action). The reason in the modal *quotes* the logged reason verbatim — Surprise here is essentially "let me show you a recent re-score and why." Use case: calibrate. Recency keeps Aadi's mental model up to date by surfacing the *changes* in the field rather than the steady state. If there are no recent re-scores in the dataset (a real possibility in early v0.5), the variant falls back to **A** silently — never to a recency reason fabricated from a publication date.

**Variant C — Underrated.**
*"Aadi hasn't opened this one — and on [frame X], it's a [pole-label] outlier worth a look."*
The pick is chosen from the long tail of companies the user has never opened in any session (tracked by the cookie + a lightweight server-side `seen_company` log keyed on the cookie ID, not on user-PII). The pick is then narrowed to companies that score at an *extreme* on at least one frame (a 1 or a 5, where the field's median is 3). The reason names the frame and the extreme pole. Use case: scout + a gentle nudge against status-quo bias. Underrated is the variant that does the most editorial work — it explicitly tells Aadi *you've been looking the same way; here's a thing you haven't*. If `seen_company` is empty (cold start), Underrated falls back to **A** (same fallback rule as Recency).

### 5.3 The reason, by example

Three worked examples, one per variant, in the prose register the modal should hit:

- **Adjacency** (Map axes: *Policy posture* × *Working style*; pinned: Anthropic London) — *Sits close to Anthropic London on this view — but is a 2 on **stage of company**, where Anthropic is a 5; the policy posture is similar, the resource picture isn't.*
- **Recency** (no axis context required) — *Moved from 3 to 4 on **policy area scope** in May, after they took on the public-sector procurement brief; the team's surface widened, and it shows in the last two posts.*
- **Underrated** (Aadi has opened ~20 companies; this isn't one) — *You haven't opened this one — and it's a 1 on **working style**, the writing end, in a field that mostly leans government-affairs; if writing-led is the cut you care about, this is one of three.*

The pattern: each reason names *one* frame as the load-bearing fact, situates the pick on that frame, and gives a second clause that earns the pick's interestingness. No reason ever names more than two frames. No reason ever says "you'll like this" — the modal's voice is editorial-first, not personalised-first.

### 5.4 Variant rotation, fallback, and freshness

- **Rotation across re-rolls.** Within a single open of the modal, `Surprise me again` rotates A → B → C → A. Across separate opens (close, reopen later), the starting variant rotates too — open 1 starts on A, open 2 on B, open 3 on C, open 4 on A. Aadi sees the variant types evenly without having to ask.
- **Fallback chain.** B falls back to A if no recent re-scores exist. C falls back to A if `seen_company` is empty. A has no fallback — if the Map has fewer than ~5 visible companies in the current axis-pair (very narrow filter), Surprise refuses to open and the button shows a one-line tooltip: *not enough room — widen the axes.* Better to decline than to surface a fake pick.
- **Freshness window.** Within a session, the same company never surfaces twice as a Surprise. Across sessions, a 7-day cooldown applies before any company can be picked again (per variant, not globally — so Underrated can resurface a company that was an Adjacency pick last week if its score has shifted, but Adjacency cannot re-pick its own recent picks). The cooldown is stored in the same `seen_company` log used by Underrated.

### 5.5 What Surprise is explicitly *not*

Surprise in v0.5 has three variants. It does **not** have a fourth.

- **No counter-recommendation variant ("Variant D").** A "you said you cared about *writing-led*, here's a strong *government-affairs* company you might be missing" pick was on the table during the brainstorm; we cut it. Two reasons: (a) it requires a confident model of Aadi's stated preferences before the dataset is rich enough to model *anything* confidently, and (b) it makes Surprise feel like a contradiction engine rather than a colleague. We will revisit in v0.6 only if the three variants prove to be too narrow in practice.
- **No multi-pick Surprise.** One company per open. A rail of "three surprises" was floated and rejected — it turns the editorial moment into a feed, and feeds train a different gesture (scan + skip) than the one Surprise is for (read + consider).
- **No surfacing without a reason.** Every pick is reason-bearing. If the dataset cannot produce a frame-shaped reason for a candidate company, that company is not eligible for Surprise — full stop. The modal copy is allowed to be short; the modal copy is *not* allowed to be absent.
- **No personalisation beyond `seen_company`.** v0.5 deliberately stops there. Frame-weights from About affect sort order on the Map and the implicit fit-rank in Compare, but they do *not* steer Surprise — Surprise is supposed to surprise.

---

## 6. Design language brief

v0.4 read as *a Tailwind starter kit with editorial intent painted on top*. The frames did editorial work; the chrome did not. v0.5 reverses that: the visual language *itself* carries the editorial register — quiet, mono-forward, machine-ish, with a small, restrained colour vocabulary doing specific jobs. The frames are the load-bearing concept; the chrome should look like *a piece of equipment for reading frames*, not a generic dashboard.

This section is a brief, not a spec. It names the system, the palette by role, the type, the chrome, and the cat — at the level of detail Fatima can sign off on. The exact hex values, the type-scale numbers, and the spacing tokens are tuned in a paired swatch session immediately after sign-off (see §9, step 2). The point of the brief is to constrain that session, not to substitute for it.

### 6.1 The system: Machine tokens

The design system is named **Machine** — internally, in the codebase, and in the file structure (`src/styles/machine.css`, `tokens.machine.ts`, etc.). The name is a small commitment: it tells the next person opening the repo that this is not a Bootstrap-ish thing, not a shadcn-ish thing, and not a brand-warm thing. It's instrument panel. It reads scores. It logs deltas. The cat lives inside it.

Machine is token-first: every colour, type, space, radius, and motion value used on the surface comes from a named token, not an inline literal. The token names use the role (`--bg-panel`, `--fg-readout`, `--signal-warn`), not the value (`--navy-900`, `--cyan-300`) — so a swatch change in the paired session updates one file, not 200 components. Tailwind utilities reference the tokens via `@layer` extensions or CSS-variable arbitrary values; no hard-coded `bg-blue-600` in components. This is the discipline that lets v0.5's visual revamp ship as one tight diff rather than a sprawling find-and-replace.

Machine is also *narrow on purpose*: a small palette, two type families, four spacing steps, two radii, two motion curves. The point isn't completeness; it's *consistency under constraint*. A narrow system is harder to template — there's nowhere for a stock component to hide because the chrome it brings doesn't match the tokens it can't find.

### 6.2 Palette, by role

Six roles. Every colour on the surface answers to one of these. Exact hex values are TBD in the swatch session; the character notes below pin the *feel* tightly enough that the swatch session is a tuning pass, not an open question.

- **`--bg-canvas` — deep navy.** The background of every full-bleed surface (home, Compare, Frames, About). Dark enough that a white-on-canvas type passes WCAG AA at body sizes without strain; not so dark it becomes pure black (which would lose the navy character and read as terminal-emulator generic). Think: *the inside of a quiet instrument case at night.*
- **`--bg-panel` — dark green.** Cards, the Surprise modal, drawers, the comic panels, the gated login surface. A *very* dark green — closer to navy than to forest — so it reads as a sibling of the canvas rather than a contrasting block, with a subtle warmth that keeps the surface from feeling sterile. The navy/green pairing is Fatima's call and it's the single most distinctive choice in the system: it gives Machine its character without leaning on an accent for it.
- **`--accent-action` — electric blue.** Primary buttons (`Open →`, `Unlock`, the Surprise CTA), the active state on axis-picker `<select>`s, the highlight on the currently-hovered Map dot, the underline-on-focus for links. The *only* colour the eye should track as "that's the thing I can press / that's where the surface wants me to look next." Used sparingly — never decoratively, never as a background fill on more than one element per viewport.
- **`--readout-cyan` — cyan readouts.** Frame names in the mini-readout under Surprise picks, the `n/5` score values throughout, the axis labels on the Map, the variant pill (`ADJACENCY` etc.), the password placeholder. Cyan is the *data voice* of the system: anything that's a parsed-from-the-DB value rather than prose copy gets the cyan readout treatment. A clear semantic separation from `--accent-action` (which is for things you press) and `--fg-prose` (below, for things you read).
- **`--signal-coral` — coral signals.** Errors (`try again` on the password gate), the strikethrough on a remove-concern diff, the small destructive affordance (`Forget me` on About), the "recent change" tag on a frame score that's moved within the freshness window. Coral, not red — softer, less alarm-system, more "flagged for your attention." Used even more sparingly than electric blue: most viewports should contain zero coral. When coral appears, it *means* something.
- **`--fg-prose` — warm off-white.** Body copy on the canvas and panels. Not pure white (`#ffffff` against deep navy is hostile at long reading lengths); a slight warmth toward bone/parchment that pairs against the green-navy without picking up a tint. The fit-note prose, the §2-style frame descriptions, the comic captions, the cat's voice — all `--fg-prose`. A dimmed variant `--fg-prose-muted` (~60% opacity) handles whispers, metadata, the *every surprise has a reason* line, and the *click dot to pin* hint in `HoverCard`.

That's the full vocabulary. No tertiary accent, no chart palette, no per-tier company colour (tier is expressed through size + weight, see §6.4). If a v0.5 surface ever needs a seventh colour, the conversation is *which existing role does this collapse into*, not *which new token do we add*.

### 6.3 Type

Two families, used deliberately:

- **A monospace** as the system default. Not the IBM Plex Mono / JetBrains Mono / Fira Code obvious picks — those have become the *templated* mono look. Reach for something with character (e.g. Berkeley Mono, MD IO, Departure Mono, or a self-hosted unloved-but-perfect option) in the swatch session. The mono carries: all UI labels, all readouts, all nav, all button copy, all the cat's voice in the comic and the next-role summary, all metadata. It does *most* of the visible type on the surface.
- **A neutral sans** as the prose face — used only for body copy at reading lengths (the §2-style frame descriptions, the fit-notes, the About profile blurb, the comic captions when they run over ~12 words). Something with low personality (Inter is fine, a quieter alternative is finer) so it sits behind the mono rather than fighting it. The sans is the *prose voice*; the mono is *everything else*.

The ratio is deliberate: ~80% of visible glyphs are mono, ~20% are sans. This is the inverse of a typical dashboard. It's the single fastest visual cue that Lobbycat isn't a templated product.

No serif anywhere. No display face for headings (mono at scale handles the header weight). No italic except in the cat's voice (Surprise reasons, comic captions, About summary) — italic in v0.5 *means* "this sentence is the cat speaking."

### 6.4 Chrome, motion, and edges

- **Edges.** Two radii: `--radius-tight` (~4px, for buttons, pills, inputs, small chips) and `--radius-panel` (~10px, for cards, modals, drawers). No fully rounded shapes anywhere; no zero-radius hard edges either. The radius is small enough to read as *instrument*, not card-app.
- **Borders.** 1px borders in `--fg-prose-muted` at ~25% opacity, used to separate panel from panel and section from section. No drop shadows on panels — the navy/green pairing does the layering work that shadows usually do, and drop shadows pull the system toward a stock-card aesthetic.
- **Motion.** Two curves, two durations. Fast (~120ms, ease-out) for state changes on already-visible elements: hover, focus, the variant pill changing on `Surprise me again`, the axis re-plot. Slow (~280ms, ease-in-out) for surface transitions: modal open/close, drawer open/close, comic-panel advance. No spring physics, no parallax, no decorative ambient motion. The cat blinks; nothing else animates without a reason.
- **Tier expression.** Companies on the Map carry tier (S, A, B from v0.3+) via *dot size + stroke weight*, not via colour. S-tier dots are larger and have a 1.5px stroke; A-tier dots are mid-sized and 1px stroke; B-tier dots are smallest and stroke-less. Tier never gets its own colour because colour is already spoken-for (palette is role-based, §6.2) — and "bigger dot = more important" is the legible map convention regardless.
- **Scrollbars, focus rings, selection.** All themed to the palette — scrollbar track in `--bg-panel`, thumb in `--fg-prose-muted`; focus ring in `--accent-action` at 2px offset; text selection in `--accent-action` at ~30% opacity. These are the easy details every templated product skips; getting them right is most of the "non-templated" feel.

### 6.5 The cat

v0.4 shipped a cartoon cat — friendly, rounded, slightly *children's-app*. It worked as a placeholder; it does not work as a load-bearing character for a curated editorial product. v0.5 replaces it with a **pixel-retro-terminal cat**: low-resolution pixel art (think 32×32 to 64×64 base sprites, rendered crisp at integer scales), monochrome or two-tone, sitting *inside* the Machine palette — the cat is a `--fg-prose` silhouette with `--readout-cyan` for its eyes, drawn as if it lives on the CRT not in front of it.

What this gets us:

- **The cat looks native to the surface.** A cartoon cat reads as a mascot pasted onto a dashboard. A pixel-terminal cat reads as a character the dashboard *summoned* — and the dashboard's whole register (mono type, cyan readouts, deep navy) prepares the eye for it. Aesthetic coherence is editorial coherence.
- **The cat has fewer poses, with more weight.** Pixel art at this size is expensive per-frame, which is the point: rather than a cartoon cat with 20 expressions, the pixel cat gets ~5 (idle, blink, paw-up, mid-shrug, points-at-thing) and each one is a deliberate beat. The comic strip in §4.1 uses four of these.
- **The cat is not on the Map.** As stated in §4.4, the cat lives in the onboarding comic, on the About page (next to the next-role textarea), and in the Surprise modal's micro-byline (a small sprite next to the variant pill). It does *not* sit in the corner of the home Map giving running commentary; the frames carry the editorial voice on the live surface, and the cat is reserved for the moments where editorial voice *is* the product.

The pixel cat's design — exact pixel grid, palette inside the silhouette, idle-loop frames — is a swatch-session deliverable alongside the colour values. Brief for the swatch session: *a small, slightly tired cat with one ear bent, eyes the same cyan as the readouts; reads as a kept companion at a workstation rather than a mascot.*

### 6.6 Non-template guardrails

The failure mode for a small editorial product is *templated-by-accident* — Tailwind defaults, shadcn primitives unstyled, generic radii, generic shadows, blue links. Machine resists this by construction:

- **No raw Tailwind colour utilities in components.** `bg-blue-600`, `text-gray-500`, `border-slate-700` are forbidden by lint rule. Every component reaches for tokens via `bg-[--bg-panel]` / `text-[--fg-prose]` arbitrary values, or via the `@layer` extensions that map token roles to short utility names (`bg-canvas`, `text-prose`, `border-muted`). The lint rule is the discipline.
- **No shadcn/Radix component imported unstyled.** When a primitive comes in (a `Dialog`, a `Select`, a `Popover`), the v0.5 surface re-skins it in Machine *before* it ships — never "good enough for now, theme later." Themed later means never.
- **No icon library used at default weight.** If we use Lucide or similar, weights are pinned (e.g. 1.25px stroke) and sizes are pinned to one of two values across the whole surface; icons sit in `--fg-prose-muted` and brighten to `--fg-prose` on hover only when interactive. Decorative icons are off the table — every icon either *labels a control* or it doesn't render.
- **No stock empty-states.** Empty states (no companies in current filter, no recent re-scores for Recency, no `seen_company` rows for Underrated) get hand-written one-line copy in the cat's voice, not a centered illustration with a generic CTA.
- **No "powered by" / "built with" badges anywhere.** The footer says who built this and when (per §3.1's About description), in `--fg-prose-muted` mono, and stops there.

The test for every new visible element on the v0.5 surface: *could this element appear, unmodified, on a different startup's dashboard tomorrow?* If yes, it isn't ready.

---
