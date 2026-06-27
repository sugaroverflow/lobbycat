# Fatima's v0.7/v0.7.2/v0.8.1 feedback — current-prod audit

**Date:** 2026-06-27 08:55 UTC
**Auditor:** Lotus 🪷
**Prompt:** Fatima clicked through https://lobbycat.vercel.app/ and reported
that some of her v0.7 feedback (cards + fonts) didn't fully land. This doc
walks back through the spec and checks each item against current prod.

---

## TL;DR — three real bugs, two design gaps

### 🔴 Bugs (definitely-not-working)

1. **Orbitron is never used.** `document.fonts` confirms all 4 Orbitron
   weights are `unloaded`. The spec (REFACTOR-v0.7 §4.2) says Orbitron for
   headings; the codebase uses `.serif` for headings, which globals.css
   aliases to mono: `--font-serif: var(--font-mono)` ("v0.4 .serif callsites
   retarget to mono — no serif in Vaporwave"). **76 `.serif` callsites
   across `src/`** — every `<h1>` on home/frames/profile/wizard/companies
   is rendering in Share Tech Mono. There is NO visual distinction between
   heading and body anywhere on the site.

2. **The static `/cat/*` assets are auth-walled.** `curl -I
   https://lobbycat.vercel.app/cat/lobbycat.png` → 307 redirect to
   `/login?from=...`. The middleware is matching too broadly. The wordmark
   on the login page renders as a broken-image icon because the page tries
   to load the cat sprite but gets redirected. This affects the very first
   moment Aadi sees the brand. (Techie's middleware domain, but the
   symptom is product-facing — flag to her.)

3. **Login "Enter" button is unreadable.** Computed style:
   `bg: rgb(224, 224, 224)` (light gray), `color: rgb(255, 255, 255)`
   (white). `bg-ink text-white` on dark theme — `--color-ink` aliases to
   `--fg-prose` which on dark = light. White text on light-gray background.
   Contrast ~1.1:1. Aadi's first interaction with the product is a button
   he literally can't read.

### 🟡 Design gaps (the work landed but the result is subtle/off)

4. **Card-interior contrast vs page bg is too subtle.** v0.7.2 §3.4 was
   right — the cards SHOULD have a calmer interior. But:
   - Page bg: `#090014` (void purple)
   - Card bg: `#14102A` (only ~5 lightness units lighter)
   - The card frame is a 1px cyan-top / 1px magenta-left border on
     otherwise-rule colored edges.
   The cards don't *feel* like cards — they blend into the page with thin
   neon racing-stripes. They need either (a) a stronger panel bg
   differential, or (b) thicker/more present border treatment, or (c) a
   subtle box-shadow that says "this is a contained surface."

5. **The mono-forward shift made every screen look like a terminal.**
   v0.7's spec said *Orbitron for headings, mono for body* — a 20/80
   intentional split where the personality came from the typographic
   tension between the two faces. Current state: 100% mono everywhere,
   which removes the tension and makes the dashboard feel uniformly flat.
   When Fatima reads "the font" she's probably feeling this — there's only
   one font in play even though the spec called for two.

---

## What the v0.7/v0.7.2 spec actually said

### Cards (REFACTOR-v0.7 §3.2, REFACTOR-v0.7.2 §3.4)

> "Cards have neon-coloured borders (cyan top / magenta side, per the spec)
> but the geometry stays straight" — v0.7 §4.1
>
> "Card frame stays full-vaporwave (cyan top border, magenta side border,
> hover glow). Card *content* gets the readable palette. Best of both."
> — v0.7.2 §3.4

**Current state:** Card-interior tokens (`--card-interior-bg`,
`--card-interior-text`, `--card-interior-text-muted`,
`--card-interior-rule`, etc.) are defined in `vaporwave.css` and used
correctly in `dashboard-cards.tsx`. ✅ Structurally landed.

**Gap:** The card-interior bg is too close to page bg. They don't read
as contained surfaces from a distance. (See finding #4.)

**Gap:** No hover glow on cards currently — spec said "hover glow on a
card is *that card is alive*." Check this against prod after auth.

### Typography (REFACTOR-v0.7 §4.2)

> "Headings: Orbitron (400/500/700/900) — geometric, futuristic, used for
> hero headlines and section heads
>  Body / UI / Code: Share Tech Mono — monospace, terminal-flavoured, used
> for body, buttons, labels, status text"

**Current state:** Both fonts are *registered* in `src/app/layout.tsx`
via `next/font/google`, and the CSS variables `--font-sans-loaded`,
`--font-mono-loaded` are wired into `--font-sans` and `--font-mono` in
`vaporwave.css`. ✅ Wiring is correct.

**Bug:** **Nothing in the codebase actually uses `font-sans`.** Every
heading I checked uses `.serif` (= mono) instead. `font-sans` (= Orbitron)
appears only on **0 of the 6 main page-level h1 elements** I sampled:

- `src/app/frames/page.tsx:35` → `<h1 className="serif text-4xl ...">`
- `src/app/favorites/page.tsx:50,81` → `<h1 className="serif ...">`
- `src/app/companies/[slug]/page.tsx:62` → `<h1 className="serif ...">`
- `src/components/profile-editor.tsx:90` → `<h1 className="serif text-5xl ...">`
- `src/components/wizard.tsx:178,787` → `<h1 className="serif ...">`
- `src/components/frames-editor.tsx:158,461,490` → frame-card titles in `.serif`
- `src/components/clarify-conversations-index.tsx:62` → `<h2 className="serif ...">`
- `src/app/login/page.tsx:33,36` → wordmark + tagline in `.serif`

The 38 `font-sans` callsites are mostly tiny: card metadata, score bars,
inline labels. Those should arguably *stay* mono. The h1/h2 heading sites
should swap.

---

## Action plan — proposed v0.8.2 (one focused PR, design pass)

### A. Headings actually become Orbitron (the headline fix)

For every `<h1>` and `<h2>` that's currently `.serif`, swap to `font-sans`
+ keep the existing size/weight/tracking. Test points:

- Login wordmark + tagline → Orbitron 500/400
- `/frames` h1 "Frames" → Orbitron 500
- `/profile` h1 → Orbitron 500
- `/favorites` h1 → Orbitron 500
- Wizard step 1 hero h1 → Orbitron 700 (this is the hero per spec)
- Company detail page h1 (company name) → Orbitron 500
- Welcome card heading → Orbitron 500
- Conversations index h2 → Orbitron 500

Frame-card titles (`frames-editor.tsx:158`) probably stay mono — they're
not section heads, they're list-item titles. Judgement call.

After: count Orbitron usage in prod. Target: at least the 8 h1/hero sites
above are using it, with `document.fonts` showing `Orbitron 400` and
`Orbitron 500` as `loaded` after a real page interaction.

### B. Fix the unreadable "Enter" button

`src/app/login/page.tsx:54` — replace `bg-ink text-white` with the
themed-button pattern used elsewhere. Probable target:
`bg-accent text-canvas` or `bg-readout text-canvas` (cyan or magenta
button → void-purple text). Match an existing CTA button so it's
consistent.

### C. Card-interior contrast bump

Two small token tweaks in `vaporwave.css`:
- `--card-interior-bg`: `#14102A` → `#1C1438` (slightly more separation
  from `#090014`)
- Add a subtle `box-shadow` on `.dashboard-card` for depth — something
  like `0 1px 0 rgb(0 255 255 / 0.05), 0 0 20px rgb(0 0 0 / 0.4)` so cards
  feel anchored.

### D. Hover-glow on cards (spec called for this)

REFACTOR-v0.7 §4.4: *"hover-glow on a card is **that card is alive**."*
The current card has no hover treatment. Add subtle border-color brighten
+ a soft cyan glow on hover. Don't go full-theatre — this is calm-cousin.

### E. (Techie hand-off) Static `/cat/*` should be public

Not my domain. Flag to Techie via INBOX:
- `middleware.ts` (or wherever the auth check lives) needs to exclude
  `/cat/*`, `/_next/*`, `/favicon.ico`, `/*.svg`, `/*.png` from the
  auth-wall. Static brand assets should be reachable pre-login so the
  login page renders properly.

---

## What I won't change

- **The mono-forward decision itself.** v0.7's `globals.css` comment is
  explicit: *"Mono-forward: chrome, controls, nav, labels, readouts all
  mono. Components that need prose-length reading opt in via .prose-face."*
  That's the right base default. The fix is to OPT IN to Orbitron on
  headings, not to flip the default.

- **The `.serif` alias.** It's load-bearing for v0.4 backward compat.
  Don't kill it — just don't use it for new headings. The 76 callsites
  can be migrated as we touch them; the urgent ones are the page-level
  h1s.

- **The vaporwave palette itself.** Fatima loved that aesthetic — the
  issue isn't the colors, it's the lack of font contrast and the subtle
  card depth.

---

## Status

- Audit done: 2026-06-27 ~08:55 UTC.
- Next step: write up a PR scope, but ALSO finish the #69 review first
  per Fatima's instruction ("then do the 69 review").
- The v0.8.2 design-pass PR comes after #69.
