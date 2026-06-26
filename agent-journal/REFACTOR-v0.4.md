# Refactor plan — v0.3.1 + v0.4 + v0.5

Three releases, scoped separately. Update as work lands.

---

## v0.3.1 — Fixes (ships first, ~2 hrs)

Restore confidence in the v0.3 surface. No new features.

| # | Fix | Notes |
|---|---|---|
| F1 | Tag taxonomy de-dupe | Audit overlap, collapse synonyms, single source of truth in seed-data, reseed. New product-shape pills derived (or stored) per the v0.3 spec but de-duped against existing ones |
| F2 | Map: replot on frame + filter changes | Likely a server/client boundary issue — selections aren't reaching the query that fetches map data. Trace, fix, regression test |
| F3 | Map axis labels: full descriptive phrases | Add `axisLowDescription` / `axisHighDescription` to frames; render as full sentences below the axes. Examples: "UK policy only ↔ international remit" / "Established team / specialist role ↔ first policy hire / build the function" |
| F4 | Seed publications (10–20 hand-picked) | Populate `publications` for each company so the tracker has rows. Real URLs, real publication dates |
| F5 | Frame scores seed pass | Hand-score the seeded companies on the seed frames so `/compare` and the Map have data |
| F6 | Move companies list out of global nav | Nav: Map, Compare, Frames, About. `/companies` lives as a link from a small "browse all" affordance on the Map |

Definition of done: open https://lobbycat.vercel.app, complete onboarding, see real dots replot when you change axes or filters, see real publication rows in the tracker, see real scores in `/compare`.

---

## v0.4 — Curated features (ships second, ~5–6 hrs of agent time)

Coherent UX upgrade. Each feature has its own DoD; ship together.

### N1: Inline-expandable company row

**What:** Clicking a row on the Map or in `/companies` expands inline into a drawer/disclosure with summary, open roles, latest publications, tags, frame scores. Replaces the always-page-nav pattern for browsing.

**Out of scope:** Full `/companies/[slug]` deep-dive page stays for fit-note chat, notes editor, frame scoring. Drawer is for *fast browsing*; page is for *deep work*.

**Done when:** Clicking a row anywhere in the dashboard expands it inline without navigating; clicking again collapses; one row open at a time; expanded row shows roles + publications + tags + scores; "open full view" link in the drawer goes to `/companies/[slug]`.

**Update 2026-06-19 from Fatima:** Same disclosure style EVERYWHERE. The map currently uses a pinned `HoverCard` (panel-card next to the dot) and `/companies` uses a row-drawer expanding inline. Per Fatima: pick one pattern and use it on both surfaces.

**Recommendation:** Use the `/companies` row-drawer style as the canonical pattern (it's the wider/more-readable one, and the explicit accept/reject buttons in fit-notes already live in a wide horizontal layout). Retrofit the Map: clicking a dot opens a row-drawer-style panel *below* the map plot, anchored to the map section (not floating next to the dot). Keep the dot's hover-preview tiny (just name + 1-line description) so the spatial scan still works.

**Task:** N1 part 3 — unify the map drawer pattern with the `/companies` row drawer. ~30m: extract `<CompanyDrawer>` from `expandable-company-row.tsx`, render it below the map plot when a dot is clicked, keep the small HoverCard for pure-hover preview.

### N2: Free-text "next role" → LLM inference

**What:** Textarea on `/about` titled "What I'm looking for in my next role." When Aadi submits, the cat reads it, then proposes updates to his concerns / weights / frame scores. He reviews each proposed change in a side-panel (accept / reject) and applies them with one click. The cat shows a "what changed and why" summary after.

**Out of scope:** Auto-apply without review. Inferring *new* frames (that's v0.5 cat-suggests-frames territory).

**Done when:** Aadi types one paragraph; sees a "lobbycat suggests" panel with itemised changes (e.g. "raise *charting the unknown* weight from medium → high because you said 'I want to define things rather than maintain them'"); accepts/rejects each; sees the diff applied to his profile + a 2-sentence summary signed by the cat.

### N3: In-page coachmark onboarding

**What:** Replace the current modal onboarding with progressive coachmarks using `driver.js` (MIT-licensed, no React dep, tiny). Three steps:

1. Hero greeting: "Hi Aadi! Fatima's fleet of agents built this dashboard for you to explore different opportunities and lenses as you're looking into your next adventure!"
2. "First, edit your frames." Coachmark on the frames editor with a 1-sentence prompt to add or tweak one. He has to actually do something to advance.
3. "Now, map the companies." Coachmark on the axis pickers. Switching axes advances. End on a small "the cat is here if you want to talk something through" closer.

**Out of scope:** Walkthrough of the tracker, `/compare`, `/about`. Those get discovered organically.

**Trigger:** First login (no `onboardedAt` on `user_profile`). Plus a small "show me around again" button in the user menu / about page.

**Done when:** Fresh login triggers the in-page walkthrough; he can't dismiss the modal without progressing through the steps (but can `skip for now`); subsequent logins don't trigger it; can re-trigger from About.

### N4 — DEFERRED to v0.5

LinkedIn / warm intros lives in v0.5.

---

## v0.5 — The experimental release

Scoped after v0.4 lands. Likely contents:

- **Warm intros** (LinkedIn or alternative). Spike research happening in parallel; see `docs/research/warm-intros-spike.md` for findings.
- Live ATS job feeds (Greenhouse/Lever/Ashby).
- RSS / sitemap publication ingestion.
- EU Transparency Register + US LDA lobbying data.
- Magic-link auth via Resend.
- In-app agent chat with DB tool-calling.

Not scoped further until v0.4 ships.

---

## Build conventions

- Every step ends with: commit + push + journal entry + one Discord status line.
- Open questions for Fatima → `QUESTION:` in `#lobby-cat`; end the turn.
- Heartbeat cadence: 10 min.
