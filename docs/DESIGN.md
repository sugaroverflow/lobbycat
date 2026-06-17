# Design system

Reference: [europe2031.ai](https://europe2031.ai/) — editorial, thoughtful, warm-neutral. The goal is for lobbycat to feel like a long-read briefing from a serious shop, not a SaaS dashboard.

## Principles

1. **Editorial over enterprise.** Generous whitespace, hairline rules, no heavy borders or shadows. Density only where data density helps the reader.
2. **Warm neutrals, never pure black or white.** Off-white background, ink-dark text, slate body copy.
3. **Two type personalities.** A serif for human-written words (company names, headings, narrative copy). A mono for data (dates, counts, tags, IDs, "as of"). The contrast does the design work.
4. **Restrained accent.** One blue for interactive things. One warm red, used sparingly, for "act on this" moments. Everything else is neutral.
5. **No cat overload.** The 🐱 in the wordmark and an occasional ❤️ "lobbycat says" callout. The rest is grown-up.

## Tokens

```css
/* Surfaces */
--bg:            #FBFBF7;  /* warm off-white, page background */
--surface:       #FFFFFC;  /* card / panel, slightly brighter */
--surface-sunk:  #F4F2EC;  /* subtle inset, e.g. table stripe */

/* Ink */
--ink:           #0E1217;  /* headings, primary text */
--body:          #1B2330;  /* body copy */
--muted:         #4A5260;  /* secondary text */
--whisper:       #98A1AC;  /* tertiary, labels, meta */

/* Hairline */
--rule:          #E2E2E2;  /* dividers */
--rule-strong:   #B1B7CD;

/* Accent */
--accent:        #406896;  /* interactive primary */
--accent-soft:   #BDD6F2;
--accent-wash:   #EBF3FB;

/* Signal */
--warm:          #B85048;  /* "act on this" */
--warm-soft:     #F2D9D6;
--positive:      #1C6C34;
--positive-soft: #DCEEDF;
```

## Typography

- **Display & body serif:** [Fraunces](https://fonts.google.com/specimen/Fraunces) (variable, optical sizing built in, free). Use it for company names, page headings, narrative copy, fit notes.
- **UI sans:** [Inter](https://fonts.google.com/specimen/Inter) at small sizes for buttons, form fields, table headers. Subtle, doesn't compete with the serif.
- **Mono:** [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) for dates, counts, tags, IDs, "as of" timestamps, code-like data.

Scale (rem):

| Token | Size | Use |
|---|---|---|
| `text-xs` | 0.75 | mono labels, table cells |
| `text-sm` | 0.875 | secondary copy |
| `text-base` | 1 | body |
| `text-lg` | 1.125 | call-outs |
| `text-xl` | 1.375 | section heads |
| `text-2xl` | 1.75 | page heads |
| `text-3xl` | 2.25 | hero |
| `text-display` | 3rem | company name on detail page |

Weights kept conservative: 400 body, 500 emphasis, 600 headings. Avoid 700+ except in the wordmark.

## Layout

- **Max content width:** `64rem` (1024px) for grid/list views.
- **Reading width:** `42rem` (672px) for narrative/note text (fit notes, the "lobbycat says" panel).
- **Grid gutter:** `1.5rem` mobile, `2rem` desktop.
- **Vertical rhythm:** 8px base, all spacing in multiples of 8.

## Components

### Wordmark

```
🐱 lobbycat
```

Always lowercase, always with the cat first. Serif. Tight tracking.

### Page header

Pattern: small mono eyebrow + big serif headline + thin rule.

```
COMPANY · TIER 1
Anthropic
─────────────────
```

### Tag chip

Soft pill, no border. Background `--surface-sunk`, text `--body`, mono. Use sparingly — a company should rarely show more than three tags at once.

### Table

- No outer border.
- Hairline rule between rows (`--rule`).
- Mono for data columns (dates, counts, scores).
- Serif for the leftmost "name" column.
- Hover state: row background `--surface-sunk`, no other change.

### Fit notes panel ("lobbycat says")

A bordered callout, `--surface` background, `1px` `--rule` border, generous padding. Heading is a small mono eyebrow:

```
LOBBYCAT SAYS ❤
```

followed by serif body copy. Inline citations to publications/lobbying records render as small mono links.

### Buttons

- **Primary:** filled `--accent`, white text, slight letter-spacing, mono.
- **Secondary:** transparent, `--ink` text, `1px` `--rule` border.
- **Destructive:** filled `--warm`, used very rarely. Never for "delete" without confirmation.

### Frames (scoring axis)

A frame is rendered as a labelled horizontal scale, score shown both as a number (mono) and a position on the scale. Rationale is a short serif line below.

```
UK-pigeonholed?         3 / 5  ●────●────●────○────○
  Big UK policy ops, less EU/US presence.
```

## Don'ts

- No drop shadows on cards. Hairlines only.
- No gradient backgrounds.
- No rounded-2xl-everywhere SaaS look. Border radius is small (4–6px) and consistent.
- No motion for motion's sake. Subtle 150ms ease on hover/focus only.
- No emoji-as-icons in tables. The 🐱 lives only in the wordmark and in "lobbycat says" callouts.
