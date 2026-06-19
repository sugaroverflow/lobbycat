# Refactor plan — v0.4

The single source of truth for the v0.4 build. Updated as work lands.

## Why

v0.3 shipped The Map + Tracker + editable frames + cat-led onboarding. Real feedback after Aadi-as-Fatima clicked through:

- Onboarding is a modal — should be in-page step-by-step coachmarks with progress.
- Onboarding copy needs a warmer hello and a "Fatima's fleet of agents built this for you" framing.
- Tags are repetitive — same idea expressed multiple ways across pills.
- Selecting frames/tags in the dashboard doesn't replot the Map.
- Map axis labels are short slugs; need full descriptive phrases like "UK policy only ↔ international remit" or "Enterprise team / established function ↔ build a new function / first policy hire."
- Tracker says "no tracked publications" — we shipped the table but never seeded publications.
- `/compare` has empty cells in the score columns because no frame scores have been entered.
- The full companies list lives in the nav bar — should be linked from the home, not occupying global chrome.
- Want company detail to expand inline from the map/list (drop-down summary) rather than a full page navigation every time.
- Want a LinkedIn integration: Aadi signs in, we surface who he knows who knows someone in the policy or recruiting team at each company.
- Want a free-text "what I'm looking for in my next role" field on /about — Lobbycat reads it and applies the inferences to concerns/weights/frame scores.

## The product, in one sentence (refined)

> An interactive map of where AI-policy companies sit on the scales that matter to you, with the cat acting as a research familiar that listens to what you want and re-frames the room.

## Build order (locked)

| # | Step | Status | Est | Notes |
|---|---|---|---|---|
| 1 | Tag taxonomy de-dupe | pending | 25m | Audit overlap, collapse synonyms, single source of truth in seed-data; reseed |
| 2 | Map: replot on frame + filter changes (no-op bug) | pending | 30m | Suspected: filter state isn't a controlled query param; map data fetched on server with stale slugs |
| 3 | Map axis labels: full descriptive phrases | pending | 15m | Add `axisLowDescription` / `axisHighDescription` to frames; render as full sentences below the axes |
| 4 | Seed publications (10–20 hand-picked) | pending | 25m | Populate `publications` for each company so the tracker has rows |
| 5 | Frame scores seed pass | pending | 30m | Hand-score the seeded companies on the seed frames so `/compare` and the Map have data |
| 6 | Move companies list out of global nav | pending | 15m | Nav: Map, Compare, Frames, About. `/companies` lives as a link from the Map empty state and a small "browse all" affordance |
| 7 | Inline-expandable company row on Map + list | pending | 60m | Click → drawer/disclosure with summary, roles, latest publications, tags, frame scores. Replaces "always-page-nav" pattern for browsing |
| 8 | Free-text "next role" field on /about + LLM inference | pending | 60m | Textarea on /about; `inferFromIntent` action runs Claude over text, returns proposed updates to concerns/weights/frame_score suggestions. User reviews before applying |
| 9 | Onboarding rewrite: in-page coachmarks | pending | 75m | Replace modal with progressive disclosure. Use `driver.js` (MIT, no React deps, tiny). Step 1: cat says hi with Fatima framing; Step 2: walk through frames; Step 3: walk through the map. Persist `onboardedAt` on user_profile |
| 10 | LinkedIn integration (research spike → impl) | pending | 90m+ | Likely OAuth → LinkedIn API for first/second-degree connections matched to seeded company employees. Spike first: scope feasibility + API access |

Total: ~7 hours of focused work. Step 10 may slip to v0.5 depending on API access feasibility.

## Onboarding copy (locked)

Step 1:
> Hi Aadi! Fatima's fleet of agents built this dashboard for you to explore different opportunities and lenses as you're looking into your next adventure!
>
> Here's how it works:

Steps then progressively reveal: First, **edit your frames** (the lenses you'll use to judge companies). Then, **map the companies** on any two of them. Then, **explore inline** to see roles, publications, and people. The cat is here if you want to talk something through.

## Discord conversation channel

`#lobby-cat` is now wired both directions:
- The cat posts heartbeat updates and questions
- Fatima replies in-channel; the cat treats those replies as conversation turns

## Tracking conventions

- Every step ends with: commit + push + journal entry + one-line Discord status.
- If a step has an open question for Fatima, ask in `#lobby-cat` with a clear `QUESTION:` prefix and end the turn.
- Steps 1–6 ship before step 7 because they fix broken-but-shipped state (tags, map data, missing publications, empty compare). Step 7 is the first new-feature step.
