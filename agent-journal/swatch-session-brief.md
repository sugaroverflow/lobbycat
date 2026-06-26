# Swatch session brief — Machine, v0.5

**Purpose.** Turn `CONCEPT-v0.5.md` §6 (the design language brief) into concrete, committable values. This is the input to the paired session named in §9 Step 2; it's a checklist of decisions with a *proposal* against each one so the session is a tuning pass, not an open question.

Lotus's posture: nothing in this file is a unilateral pick. Every row below is a starting point Fatima can confirm, tweak, or kill. The proposals are picked against §6's *character* notes, not as taste-from-nowhere.

---

## Decisions to land

### 1. Palette — six hex values

Each role from §6.2, with a proposed hex picked against the character note. WCAG checks are against `--fg-prose` on `--bg-canvas` and on `--bg-panel`; both should pass AA at body size (4.5:1) per the brief.

| Token | Role (§6.2) | Proposal | Character check |
|---|---|---|---|
| `--bg-canvas` | deep navy, full-bleed | `#0B1220` | Not pure black, holds navy character, reads as "instrument case at night." |
| `--bg-panel` | dark green, cards/modals/drawers | `#0E1A1A` | A *very* dark green leaning navy-ward — sibling of canvas, not contrast block. |
| `--accent-action` | electric blue, only for press-targets | `#3B82F6` | Bright enough to track instantly; pinning to one ramp keeps focus rings + buttons coherent. |
| `--readout-cyan` | cyan readouts, the data voice | `#67E8F9` | Distinct from `--accent-action` (no confusion of "data" vs "press"); reads as CRT. |
| `--signal-coral` | coral signals, sparingly | `#FB7185` | Softer than red; doesn't read as alarm; flags attention. |
| `--fg-prose` | warm off-white body copy | `#F5EFE0` | Slight bone/parchment warmth; AA-pass on both canvas + panel; doesn't pick up tint. |
| `--fg-prose-muted` | dimmed prose, whispers, metadata | `#F5EFE0` @ 60% | Per §6.2 — derived, not separate token. |

**Open questions for the session:**
- Navy vs panel-green ratio across the surface — do we want the canvas/panel split to be subtle (current values, ~12% L difference) or assertive (push panel-green further from navy)?
- Coral vs softer pink — `#FB7185` reads as flag; an alternative `#F5A097` reads warmer/quieter. Pick depends on how often coral will fire in the curated dataset.

### 2. Type — two families + scale

Per §6.3: a mono with *character* (not Plex/JetBrains/Fira), and a neutral sans for prose-at-reading-length.

**Mono proposal — primary pick:** **Departure Mono** (free, distinctive, slightly retro-CRT energy, pairs natively with pixel art so it sits next to the cat without friction). Self-hosted via `next/font/local`.

**Mono fallback if Departure reads too retro:** **MD IO** (paid, ~$180/style, more neutral but still un-templated) — fallback because of cost.

**Sans proposal:** **Inter** at 400/500 only — quiet, low personality, Google-hostable. The brief explicitly allows Inter; the discipline is *only at reading lengths* (fit-notes, frame descriptions, comic captions over ~12 words, About blurb).

**Type scale — six steps:**

| Token | Use | Size / line-height |
|---|---|---|
| `--text-caption` | metadata, whispers, the *click dot to pin* hint | 11px / 16px, mono |
| `--text-body-mono` | UI labels, readouts, button copy, the cat's voice | 13px / 20px, mono |
| `--text-body-prose` | fit-notes, frame descriptions, About blurb | 15px / 24px, sans |
| `--text-header` | section + drawer headers | 15px / 20px, mono, 500 weight |
| `--text-title` | page titles (Map axis-picker label, About, Frames) | 20px / 28px, mono, 500 weight |
| `--text-display-mono` | comic panel headers, Surprise variant pill is *not* this — it's caption-mono | 32px / 36px, mono, 500 weight |

**Italic rule** (§6.3): italic *only* in the cat's voice — Surprise reasons, comic captions over the cat, About summary. Linted? — TBD; leaving as discipline for now, lint rule is overkill for one rule on one selector.

**No serif. No display sans. No bold on body. No display weight at body sizes.**

### 3. Spacing + radii + motion

**Spacing — four steps:**

| Token | Value | Use |
|---|---|---|
| `--space-tight` | 4px | Within-row stack, pill inner pad |
| `--space-1` | 8px | Default form gap, drawer inner stack |
| `--space-2` | 16px | Section padding, card inner gutter |
| `--space-3` | 32px | Page outer pad, between-section breathing room |

Four steps because §6.1 names "four spacing steps." Components reach for these via `gap-[--space-1]` etc.

**Radii — two values:**

| Token | Value | Use |
|---|---|---|
| `--radius-tight` | 4px | Buttons, pills, inputs, small chips |
| `--radius-panel` | 10px | Cards, modals, drawers, comic panels |

**Motion — two curves, two durations:**

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 120ms ease-out | hover, focus, axis re-plot, variant pill change |
| `--motion-slow` | 280ms cubic-bezier(0.4, 0, 0.2, 1) | modal open/close, drawer open/close, comic-panel advance |

No spring physics. No ambient motion. Cat blinks; nothing else animates without a reason (§6.4).

### 4. Pixel cat — five poses + base resolution

Per §6.5: small, slightly tired, one ear bent, cyan eyes, reads as a kept companion at a workstation.

**Proposal: 64×64 base, rendered at 1x, 2x, 3x via CSS `image-rendering: pixelated`.**

64 picked over 32 because the cat needs to read at comic-panel scale (~160px tall — that's 2.5x of a 64-grid) and a 32-grid renders mushy at 5x. 64 also gives enough room for a one-pixel bent ear without spending half the silhouette on it.

**Five poses (per §6.5 + §4.1):**

| Pose | Used in |
|---|---|
| `idle.png` | Default everywhere |
| `blink.png` | Idle-loop frame 2 (the only ambient animation in the system) |
| `paw-up.png` | Comic panel 1 (greeting), About page header |
| `mid-shrug.png` | Surprise modal micro-byline, comic panel 3 (the *how* panel) |
| `points-at-thing.png` | Comic panel 2 (the *lens* panel), Surprise variant C (Underrated) micro-byline |

Two-tone: silhouette in `--fg-prose`, eyes in `--readout-cyan`. No outline. No shadow.

**Production:** I'll draft a first pass in `aseprite`-compatible PNG. The swatch session reviews the silhouette + ear-bend + eye-cyan; we tweak in-session and commit.

### 5. CI guardrails (§6.6)

- `eslint-plugin-tailwindcss` configured to ban raw colour utilities (`bg-blue-*`, `text-gray-*`, `border-slate-*` etc.) — components reach for tokens via arbitrary values or `@layer` short names.
- A small ESLint custom rule (or grep-based pre-commit) banning hex values inside `src/**/*.{ts,tsx,css}` except inside `tokens.machine.ts` and `machine.css`.
- A check that any new dependency adding a UI primitive (shadcn, Radix, Headless UI) ships with a Machine re-skin in the same PR.

These ship as part of the Step 2 commit, not later.

---

## What this session is not deciding

- **Component layouts** — those are Step 4 (rebuild). The reference renders at the end of Step 2 are mock-ups in the *Machine register*, not finalised layouts.
- **Microcopy** — the cat's voice in the comic, the Surprise reasons, the fit-note tone — Step 3 (dataset curation) and Step 4 (rebuild) decisions.
- **The exact comic panel illustrations beyond panel 2 — the reference render is panel 2 only per §9 Step 2 deliverable 3.

---

## Deliverables out of the session

1. `src/tokens.machine.ts` — typed token object, all six hex values, type-scale numbers, spacing, radii, motion.
2. `src/styles/machine.css` — CSS custom properties + Tailwind `@layer` extensions mapping tokens to short utility names.
3. `public/cat/pixel/` — the five PNGs at 64×64 base, two-tone.
4. `public/cat/_archive/` — v0.4 cartoon cat assets moved (not deleted; per §9 Step 2, deletion is Step 4's final commit).
5. **Three reference renders** (Lotus's call between Figma frames vs static HTML — proposing static HTML at `apps/web/app/_machine-reference/`, deployed at a preview URL):
   - Home Map at default axes with one pinned drawer.
   - Surprise modal with a variant A pick.
   - Comic panel 2 (the *lens* panel) at full panel size.

---

## Asks of Fatima before we run the session

1. Skim §1 (palette hexes) — react to any that feel wrong against the character notes.
2. Mono pick — Departure Mono (free, retro-leaning) or push for MD IO (paid, more neutral)? Or a third option you have in mind?
3. Pixel cat base resolution — 64×64 OK, or push smaller (32×32, mushier at scale) for the retro-er feel?
4. Reference-render format — static HTML pages at a preview URL (faster to iterate, lives in the repo), or Figma frames (cleaner for sign-off, lives outside the repo)?

Anything else you want on the session's agenda, add it here and I'll fold it in.
