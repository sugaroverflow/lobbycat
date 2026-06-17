# v0.3 — Brief

Feedback (2026-06-17, ~19:10 UTC) from product owner:

1. **Homepage is underwhelming.** Editorial restraint went too far — needs life, visualisation, a real dashboard.
2. **Compare page failed to render** — needs investigation + fix.
3. **The user (Aadi) should be able to edit:** the profile (bio, concerns), the weights, and the frames/criteria themselves.
4. **Lobbycat onboarding** — a first-run walkthrough where the cat introduces the dashboard.
5. **Real dashboard.** Most-recent activity, plotted on something that makes sense. Tracker for press releases / roles. Filters.
6. **Custom cat illustration** — looks like a Candy Kittens "smitten kittens" character (the brand mascots: round, pastel, big-eyed, soft).
7. **Tag taxonomy is too dev-coded.** Should read like "international policy" / "product/GTM" / "first hire". Coloured pills. More colour throughout the app.
8. **Frames as questions.** Aadi can pose a question (the frame) and the dashboard rearranges/sorts companies by his answer.
9. **All data lives somewhere shareable** — so we can share it with him dynamically. (Postgres + the existing DB is the spine; surface = the deployed dashboard.)
10. **Fit-note style**: shorter, concise, bulleted. Currently the cat writes a paragraph; she should write 3–5 sharp bullets.
11. **Conversational fit-notes**: Aadi can ask follow-up questions inside the lobbycat-says panel. "Why's this a stretch on UK-pigeonhole?" "What about the licensing angle?" Each company has its own little chat thread, persisted.

## Working principles for v0.3

- **Colour comes back.** Keep the warm off-white surface, but tags, charts, and call-outs use the full palette: muted blue, warm clay-red, positive green, plus pastel surfaces for chart slices.
- **One cat, recurring.** Custom SVG mascot, soft pastel, used in the wordmark, the empty states, the onboarding overlay, and the "lobbycat says" panel. Not on every component — but recognisably the same cat.
- **Frames are first-class.** Add frames CRUD. Sort/rank by any frame from the homepage.
- **Onboarding is friendly, optional, skippable.** First load gets a four-step lobbycat overlay. Cookie remembers it's been seen.
- **Dashboard is graphic.** Quadrant plot mapping companies on any two frames the user picks. Activity feed of latest roles/publications. Tag-filter chips.

## What stays the same

- The stack (Next.js 16, Postgres on Neon, Drizzle, Vercel).
- The font system (Fraunces + Inter + Geist Mono).
- Surprise discipline — repo description, README, commits all neutral.
- All data in Postgres; nothing in memory-only state.
