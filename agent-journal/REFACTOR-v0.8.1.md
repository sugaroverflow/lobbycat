# Lobbycat v0.8.1 — Fatima click-through feedback

**Status:** SCOPING. Captured from Fatima 2026-06-26 02:19 UTC after her first end-to-end click-through of v0.8 in dev/preview.
**Author:** Lotus 🪷
**Premise:** v0.8 ships the `clarify` skill and the cat-as-agent architecture. v0.8.1 is the polish + readability + product-hygiene pass on top — fixes things Fatima actually noticed when using it, plus a small product surface (favorites).

---

## What this doc is

Verbatim capture of Fatima's feedback, restated as a bulleted scope. Each item gets a numbered ID so commits and assumptions can reference it. Order roughly groups by surface (dashboard → company card → company detail → frames → /about → footer), not by ship priority — the §10 implementation order picks ship priority separately.

When implementation starts, every item becomes either: (a) shipped with an assumption logged, (b) deferred to v0.8.2+ with a reason, or (c) merged into another item. No item gets silently dropped.

---

## 1. Readability — vaporwave-but-readable, take 2

> the vaporwave theme is really great, but the text in the boxes can be hard to read, let's simplify that a bit. Let's keep the fun text for the title of the company and everything else more readable.

**F1.1 — Keep the vaporwave on the company name (h3 / link), tone down everything else inside the box.**
- Card title (company name) → stays in the existing font-sans Orbitron-like treatment.
- Card body (description, location, scores, fit-note, recent activity) → softer foreground, less letterspacing, fewer all-caps mono labels. Default to the card-interior token subset (v0.7.2 §3.4) which is already pretty calm, but go one step further on contrast.
- HQ pill, frame score numbers, "Latest" eyebrow, "Show more" — all currently mono uppercase at 10–11px. Drop to mono small-case or sans-small at higher contrast.

**F1.2 — Filters are gray on black, hard to see.**
- The filter chips on the dashboard top need a contrast bump. Probably bump them from `--card-interior-text-muted` (0.7 alpha) to full `--card-interior-text` (1.0) or a softer cyan when inactive, and a clearer active state.

---

## 2. Dashboard copy + alert states

**F2.1 — Dashboard intro sentence is too coy.**
- Current: *"pick your priorities, the cat will surface the matches"*
- New: *"here are your matches based on your answers!"*
- Voice cleanup: the dashboard is the answer, not the question; the cat asks elsewhere (in clarify / fit-notes).

**F2.2 — Empty-updates state needs a real "no updates" message.**
- Current: silent / weird empty space.
- New: an explicit "no new updates" line.

**F2.3 — When there ARE updates, format them as a list inside a vaporwave-esque alert box.**
- New component (or extension of an existing one): a bordered alert box with the vaporwave cyan-top / magenta-left edge treatment, headline like "what's new", then a bullet list of update items inside.
- Surface lives at the top of the dashboard, above the company list.

---

## 3. Company card layout

**F3.1 — Header line: Title — location — overall score.**
- Currently: title + HQ pill on one line, overall score in the top-right corner stack.
- New: a single line with `{name} — {hq} — {overall}` together. One row, no right-stack column.

**F3.2 — Blurb under the header.**
- One-line description below the header row, in the calmer body text.

**F3.3 — Score bars sit closer to the frames.**
- Currently: header → blurb → score-strip → "Latest" → show-more. The score-strip is visually disconnected.
- New: collapse the space between the header/blurb and the score-strip. The strip reads as the immediate body of the card.

**F3.4 — "Show more" reveal restructure.**
- Currently shows: Recent publications + Open roles + a Fit-note CTA + a "Leave a note" link.
- New, under "show more":
  - Recent publications (last 6mo) | Recent roles
  - Recent news
  - Recent controversy
  - Single CTA button: **"Explore in detail →"** that takes the user to the company-specific page. Replaces the dual "Fit-note + notes" + "Leave a note" affordances.

**F3.5 — Star / favorite affordance.**
- A simple way to mark a company as a favorite (a star icon on the card, probably in the header row).
- A "Favorites" entry in the main nav that filters/sorts to just starred companies.
- Persisted server-side per user.

---

## 4. Company detail page

**F4.1 — Frames helper copy.**
- Above the per-company frame scores on the company detail page, add a one-liner:
  - *"these are scored based on your onboarding quiz, but you can change these scores and leave yourself notes"*

**F4.2 — Lobbycat-says affordance fix.**
- The "send" button isn't a clear button (looks like a link or label).
- Enter key should also send (currently doesn't appear to).
- The feature doesn't actually work — needs functional debug pass.

**F4.3 — Save-note styling fix.**
- "Save note" button is white text on gray — hard to read.
- Probably bump to a token-driven background that has real contrast.

**F4.4 — Saved-state confirmation.**
- After a note is saved, show a small line below the textarea: *"saved to profile!"*
- Probably auto-clears after a few seconds.

---

## 5. Frames page

**F5.1 — Section order: "+ add new frame" above "ask lobbycat for frame ideas".**
- Currently `<CatSuggestions>` (the ask-lobbycat panel) is at the top, then the frame list, then the add-new affordance.
- New order: frame cards → "+ Add a new frame" button → "Ask lobbycat for frame ideas" panel at the very bottom.

**F5.2 — "+ Add a new frame" is a real button.**
- Currently a `+ add new frame` text link.
- New: a proper button, same affordance shape as the dashboard CTAs.

**F5.3 — Pole-label readability.**
- The "Pre-product → Established · 1–5" line under each frame card is too small to read comfortably.
- Bump the font size on that line.

**F5.4 — Weight vocabulary swap.**
- Currently: Must / Should / Could.
- New: **dealbreaker | important | nice to have**.
- Same underlying tokens (`high` / `medium` / `low`) — just the labels change.
- Tooltip help text also updates to match.

---

## 6. /about → /profile

**F6.1 — Rename "/about" to "/profile" (and the nav entry).**
- The page is, in product terms, the user's profile (their info + their notes + their conversations).
- Nav label: "Profile".
- URL: `/profile` (with a 308 redirect from `/about` to avoid breaking any out-of-band links).

---

## 7. Footer touch

**F7.1 — Add a small "made as a surprise <3" line in the footer.**
- White, small font, separate line from existing footer content.
- This is the first place the surprise framing surfaces in copy (currently the surprise discipline only lives in the architecture).
- **Confirmed by Fatima 2026-06-26 02:31 UTC:** include the line. Lands with the v0.8.1 deploy. The line is *for* Aadi and goes live AT the moment he gets the URL.

---

## 8. Data work — coordinate with Glyphie

**F8.1 — Glyphie pulls real-content streams for the "show more" reveal:**
- **Recent news** — press releases from the company pages (currently we don't surface a `news[]` feed shape).
- **Hiring links** — the roles[] work she's already shipped in #38/#40 lands this for free, but we need to render it.
- **Controversies** — the controversies[] migration on #40 gives us the table; we need to render it.

**F8.2 — Render plumbing on the dashboard card show-more (F3.4) and probably the company detail page.**
- Per-company fetch already runs in `getCompaniesWithExpandableDetails()`; the controversies + news fields plug into the same shape.
- Need: friendly empty states for each ("no recent news in the last 6 months").

**F8.3 — Glyphie ownership boundary.**
- I (Lotus) build the rendering + the queries.
- Glyphie writes the daily research feeds that populate the new shapes.
- Her PR #40 lands the schema; v0.8.1's rendering work consumes it.
- If she needs to extend the controversy shape or add a `news[]` array to her feed JSON, that's her call — I follow.

---

## 9. What's NOT in v0.8.1 (deferred / out of scope)

- **Tabify /about → /profile** with real tabs (Profile / Notes / Conversations). A9.1 from v0.8 said "ships untabbed today, future polish wraps all sections." Still polish. Could land here, but Fatima didn't ask, so default no.
- **Per-frame "constraint" semantics** (the v0.7 constraint-not-a-frame thing surfaced in clarify examples). v0.9 candidate.
- **Lobbycat agent runtime registration in Techie's domain** — still pending from v0.8 Step 0. Doesn't block v0.8.1.
- **Step 12 v0.8 tuning pass** — still scheduled to land before v0.8.1 builds start, so the cat sounds right when v0.8.1's polish goes live.

---

## 10. Implementation order

**Phase A — surface polish (no data dependencies):**
1. F2.1 — Dashboard intro copy ("here are your matches").
2. F7.1 — Footer surprise line.
3. F1.1 — Vaporwave-but-readable inside cards (text-only contrast/treatment pass).
4. F1.2 — Filter chip contrast bump.
5. F3.1 / F3.2 / F3.3 — Company card header row + blurb + score-bar tightening.
6. F4.1 — Frames helper copy on company detail.
7. F4.3 — Save-note button contrast fix.
8. F4.4 — Saved-state confirmation.
9. F5.1 / F5.2 / F5.3 / F5.4 — Frames page reorder + button + font + label swap.

**Phase B — feature work:**
10. F6.1 — `/about` → `/profile` rename + 308 redirect + nav update.
11. F2.2 / F2.3 — Empty-updates state + vaporwave alert box.
12. F4.2 — Lobbycat-says feature debug + Enter-to-send + button styling.
13. F3.5 — Star/favorite (schema column on user_profile or new join table, header-star UI, Favorites nav entry, filtered view).

**Phase C — data + Glyphie coordination:**
14. F3.4 — "Show more" reveal restructure: recent publications | recent roles, recent news, recent controversy, "Explore in detail →" CTA. (Renders the data Glyphie's feeds + schema land.)
15. F8.x — Coordinate with Glyphie on news[] feed shape (if she doesn't already have one), controversies render, hiring links render.

**Phase D — ship:**
16. README pass + version bump + deploy.

---

## 11. Sign-off

This doc captures verbatim feedback. Lotus will:

- Open a `scope/v0.8.1` branch with this doc landed.
- Wait for v0.8 to merge fully before starting v0.8.1 implementation (no point polishing surfaces that are still in PR review).
- Drop Glyphie a note in her INBOX about F8.x (the data dependencies) before Phase C starts.
- Per the standing rule (Fatima 2026-06-24 21:09 UTC + 2026-06-25 20:56 UTC): ship without waiting for explicit per-step sign-off, log assumptions, keep moving.

**Glyphie PR #40 review ordering (Fatima 2026-06-26 02:31 UTC):** review Glyphie's #40 **at the end** of v0.8.1, not at the end of v0.8 — because the controversies / roles fields she's adding will likely need shape edits once we have concrete renderers in v0.8.1 (F3.4, F8.2). Reviewing now would lock the shape prematurely. Order becomes:

1. v0.8 Steps 10–12 + PR collapse + deploy.
2. v0.8.1 Phase A (surface polish) + Phase B (feature work).
3. v0.8.1 Phase C — build renderers against Glyphie's shape, surface needed shape edits, **then** review/merge #40 with any necessary tweaks in the same pass.
4. v0.8.1 Phase D — README + deploy.

This flips the original "#40 after v0.8 collapse, before v0.8.1" plan. The reason: don't review a data shape until you have a rendering shape to test it against.

— Lotus 🪷
