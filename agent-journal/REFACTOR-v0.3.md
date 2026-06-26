# Refactor plan — v0.3

The single source of truth for the v0.3 build. Updated as work lands.

## Why

After v0.2 (17 → 30 companies, /about, name greet) the dashboard was honest but underwhelming:

- The editorial restraint went too far for what is fundamentally a *tool*.
- Compare submission was broken (inline `<script>` hijacking).
- Tag taxonomy read as dev-coded (`hiring-policy`, `frontier-lab`) not human (`international policy`, `product/GTM`).
- Fit-notes were paragraph-shaped; the user wants bullets and follow-ups.
- The user (Aadi) needs to drive the evaluation system, not just consume it: edit profile, edit frames, define new frames as questions.
- Frames need to be more than 1–5 scales — they should support tag-shaped and question-shaped frames too.
- The home should be a *room*: an interactive map plus a live tracker, both responsive to filters.

## The product, in one sentence

> An interactive map of where AI-policy companies sit on the scales that matter to you. Sort it however you want. Re-define the scales themselves whenever your thinking changes. The cat keeps up.

## Build order (locked)

| # | Step | Status | Est | Notes |
|---|---|---|---|---|
| 1 | Fix `/compare` submission bug | ✅ done | 5m | Replaced inline `<script>` with `CompareForm` client component (useRouter + state) |
| 2 | Earthcore palette + better tag pills | ✅ done | 25m | Sage, moss, ochre, terracotta; tag colours + bigger pills; new tag taxonomy (2a palette, 2b pills+colour map, 2c human labels + seed prune) |
| 3 | Fit-note rewrite: bullets + chat thread | ✅ done | 40m | 3a ✅ schema + migration (`fit_note_messages`). 3b ✅ regen-as-bullets. 3c ✅ chat UI + `sendFitNoteMessage` server action. |
| 4 | Wire chosen cat (cat-3) | ✅ done | 15m | `Wordmark`/`CatMark` components; replaced 🐱 in site-shell + login; cat avatar in fit-note header + empty state |
| 5 | Frames CRUD + frame kinds | ✅ done | 60m | `kind`: `scale`/`tag`/`question`. 5a ✅ schema + migration (`kind` col, `frame_answers` table, `prompt` col). 5b ✅ CRUD UI (`/frames` group-by-kind, inline edit, add, delete; `createFrame`/`updateFrame`/`deleteFrame` actions). 5c ✅ cat suggestions (`suggestFrames` action returns structured JSON of 2–3 gap-filling frames; `CatSuggestions` panel offers one-click adds). **CHECKPOINT DEPLOY** |
| 6 | The Map | ✅ done | 75m | 2D scatter, axes = any two scale-kind frames, hover-cards, click-through. 6a ✅ route split (`/` = map, `/companies` = tier list) + axis pickers + SVG scatter + hover-card v1. 6b ✅ richer hover-card (top-4 tag pills + fit-note preview) + click-to-pin with × close. 6c ✅ filter chips (tier / HQ / tag) reduce plotted set + legend + unscored counts in place; axis-swap button between pickers; pinned/hover state clears when filtered out. |
| 7 | Live tracker table | ✅ done | 60m | 7a ✅ data shape + sortable table scaffold. 7b ✅ filter chips (tier/HQ/tag/status) via shared `FilterChip` + honest `Showing N of M` count. |
| 8 | Profile editor on `/about` | ✅ done | 25m | Per-section inline edit (header, bio, concerns, weights, sources) via `ProfileEditor` client component + `updateProfile` server action |
| 9 | Cat-led onboarding overlay | ✅ done | 35m | `OnboardingOverlay` client component, 4 steps (room / frames / tracker / questions), `lc_onboarded` cookie (365d, samesite=lax) gates rendering, dismissible at every step. Step 4 offers `addDefaultOnboardingQuestions` server action that idempotently inserts 3 starter question-kind frames. |

Total: ~6 hours of focused work.

## Architectural changes

### Schema additions

```ts
// frames table gets a `kind` column
frames: { ..., kind: 'scale' | 'tag' | 'question' }

// new table for question-kind frames
frame_answers: { companyId, frameId, answer (text), updatedAt }

// new table for fit-note conversation threads
fit_note_messages: {
  id, companyId, role: 'user' | 'cat',
  content (text), createdAt
}
```

### New routes

| Path | Purpose |
|---|---|
| `/` | Map + Tracker dashboard (new primary home) |
| `/companies` | Tiered list (moved from `/`) |
| `/frames` | Frames CRUD (was read-only) |
| `/about` | Profile editor (was read-only) |

### Visual system update

| Token | New value | Was |
|---|---|---|
| `--color-bg` | `#F4F1E8` (warm cream) | `#FBFBF7` |
| `--color-surface` | `#FFFEF8` | `#FFFFFC` |
| `--color-moss` | `#3E5C3A` | (new) accent — buttons, links |
| `--color-sage` | `#A8C09A` | (new) — tag pills, chart slices |
| `--color-sage-soft` | `#D9E5C9` | (new) — pill backgrounds |
| `--color-ochre` | `#C49A4B` | (new) — secondary signal |
| `--color-terracotta` | `#B85048` | (was `--warm`) signal |
| `--color-mushroom` | `#857366` | (new) muted accent |
| `--color-cream-dark` | `#E8E1CC` | (new) — tracker stripes |

Hairline rules stay. Type system stays (Fraunces + Inter + Geist Mono). Cat illustration replaces the 🐱 emoji in wordmark and panel headers.

### Tag taxonomy (human, coloured)

| Old | New | Colour |
|---|---|---|
| `hiring-policy` | `Hiring policy lead` | terracotta |
| `first-policy-hire` | `First policy hire` | ochre |
| `established-policy-team` | `Established team` | mushroom |
| `frontier-lab` | `Frontier lab` | moss |
| `voice-AI` | `Voice / media AI` | sage |
| `agentic` | `Agentic / coding AI` | sage |
| `self-driving` | `Autonomous / mobility` | sage |
| `open-weights` | `Open weights` | sage-dark |
| `UK-HQ` | `UK` | (geography pill, neutral) |
| `EU-HQ` | `EU` | (geography pill, neutral) |
| `US-HQ` | `US` | (geography pill, neutral) |

Plus product-shape pills derived from focus area: `International policy`, `Product / GTM`, `Regulatory counsel`, `Government affairs`, `Trust & safety`.

## Risks

- **Scope.** 6 hours is the plan; reality will be more. Mitigation: deploy after step 5 so we have a checkpoint to roll back to.
- **The Map.** Scatter on 30 companies with hover-cards is straightforward; making it *fun* takes iteration. Time-box step 6 at 75m and ship a usable v1 even if it's not jaw-dropping.
- **Cat dependence.** Steps 5 and 6 don't need the cat illustration. Don't block on assets again.

## Surprise discipline

This refactor doc lives in `docs/`. Like the other repo docs it reads as a product spec, not a gift. No sentiment in commits, no gift-coded copy in the UI. The cat is the messenger; never the gifter.
