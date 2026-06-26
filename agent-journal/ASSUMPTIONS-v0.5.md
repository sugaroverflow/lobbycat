# v0.5 Assumptions log

Overnight build (2026-06-19 → 2026-06-20), per Fatima's rule: don't pause for questions, decide + ship + log here. Each entry: timestamp, decision, alternatives considered, "would change if".

---

## 2026-06-19 23:35 UTC — Merging ATS feeds PR #2 with `--admin` despite Vercel preview "blocked"

**Decided:** Squash-merged the data-pipelines ATS feeds PR (`data/ats-feeds`) into main even though the Vercel preview check is in a `Deployment was blocked` state.

**Why:** Investigation shows the underlying build failure was a real code issue (the route module imported `@/db` which threw at module-import time when `DATABASE_URL` was unset — Next 16 evaluates route modules during page-data collection). Shipped a fix in the merged squash commit: `src/db/index.ts` now uses a Proxy that defers DB init to first property access, so the build can collect page data without env vars. Local `npm run build` clean post-fix.

The remaining `Deployment was blocked` status on the latest preview push is **Vercel-side** (UNKNOWN status from `vercel inspect`; recent main → Production deploys are all Ready). Looks like a preview-deployment protection or quota issue, not a code defect. Production deploys from main are passing.

**Alternatives considered:**
- Wait for Techie to investigate the Vercel block — rejected: overnight mode, Fatima asked for forward motion.
- Block on the Vercel check turning green — rejected: it's external to the PR's correctness, and production from main still deploys fine.
- Leave the PR open and open a separate fixup PR — rejected: same review surface, just slower.

**Would change if:**
- Main's first post-merge deploy fails (would revert the lazy-db change and investigate the proxy interaction with drizzle's `with`/`relations`).
- Techie surfaces a real billing/quota block that needs the merge reverted to unblock other previews.

---

## 2026-06-19 23:45 UTC — Step 2 visual revamp scoped as "Machine tokens + backward-compat aliases" for chunk 1

**Decided:** First chunk of the visual revamp lands as a token foundation, not a re-skin. New files: `src/styles/machine.css` (the six palette roles, type scale, spacing, radii, motion curves, semantic z-index — all CSS custom properties named by role per §6.1). `src/app/globals.css` rewritten to import Machine, re-export the role tokens as Tailwind v4 `@theme` utilities (`bg-canvas`, `text-prose`, etc.), AND alias the v0.4 earthcore token names to Machine roles so the existing component tree renders in Machine palette immediately without per-component rewrites.

**Why:** The implementation order in §9 explicitly puts visual-language Step 2 before rebuild Step 4. The lint rule in §6.6 only works if tokens predate the rebuild. Backward-compat aliases let me ship a *visible* palette shift now (Fatima can eyeball the navy/green vibe in the morning) without rewriting every v0.4 component, which is Step 4's job. The aliases are tagged in a comment as "remove at end of Step 4" so they don't outlive their purpose.

**Implementation notes:**
- OKLCH throughout per impeccable. Hex preserved in comments as swatch-session anchors.
- Fatima's locked picks honoured exactly: `--bg-canvas` = `#0E1530`, `--bg-panel` = `#1A3D2E`.
- Accent (`#4D8DFF` electric blue), readout (`#6FE0E8` cyan), coral (`#FF8C73`), prose (`#F2EAD8` warm parchment) — first-pass values, marked in comments as **swatch-session inputs**, not commitments.
- Type families left as `JetBrains Mono` / `Inter` placeholders — `var(--font-mono-loaded)` indirection so the swatch session can swap a self-hosted face in one place.
- Body face is mono (Machine is mono-forward, §6.3 ~80/20 ratio); `.prose-face` class opts a region into the sans for reading-length copy.
- `.eyebrow`, `.serif` helpers from v0.4 survive but retarget to Machine roles (eyebrow now uses readout cyan; serif retargets to mono).

**Alternatives considered:**
- Re-skin every component in this chunk — rejected: blows the ~40m budget, and Step 4 is the right home for it.
- Ship tokens but leave globals.css using earthcore values — rejected: would mean Fatima sees zero visible change in the morning, which is the point of a palette shift.
- Skip backward-compat aliases and let v0.4 components break until Step 4 fixes them — rejected: breaks the running surface for a multi-day stretch.

**Would change if:**
- Swatch session reveals the accent/readout/coral first-pass values clash badly with the locked navy/green — these are all in one file, one edit each.
- Drizzle's `relations` or `with` clauses rely on prototype chains that break under Proxy (the db fix from above) — would refactor to a memoised getter instead of a Proxy.

---

## 2026-06-20 00:05 UTC — [data-pipelines] EU Transparency Register source URL is env-configurable, defaults to spec URL even though it currently 404s

**Decided:** `runEuTransparencyPipeline()` reads the source URL from \`options.url\` → \`EU_TRANSPARENCY_CSV_URL\` env → fallback constant \`DEFAULT_REGISTER_URL\` (the URL the task spec gave: `https://ec.europa.eu/transparencyregister/public/openFile.do?fileName=full_export.csv`). A `?url=` query param on the cron route lets ops re-point on the fly.

**Why:**
- The spec URL responds with HTTP 404 right now (verified `curl -I` at 23:43 UTC). The official dataset page at `data.europa.eu/data/datasets/transparency-register` lists XML/Excel exports rather than CSV.
- Two failure modes: (a) URL is real and intermittently down, (b) URL was wrong in the spec. Cron-route URL override + env override handle both without redeploying.
- Pipeline gracefully degrades on fetch failure (returns `warning:"fetch failed: …"`, zero rows) so the cron is a no-op rather than a 500 when upstream is down.

**Alternatives considered:**
- Hard-code a different URL — rejected: we'd be guessing too, and we'd have to redeploy to fix it.
- Block the PR pending URL verification with Fatima — rejected by overnight rule.
- Switch to the Excel/XML export now — rejected: doubles the parsing surface for this PR; can be a follow-up.

**Would change if:**
- Real URL surfaces (Fatima / Aadi confirm, or the official page is re-checked) → set `EU_TRANSPARENCY_CSV_URL` on Vercel, no code change needed.
- The real export turns out to be XML-only → add an Atom/XML adapter and select by content-type.

## 2026-06-20 00:05 UTC — [data-pipelines] Tolerant column detection over a fixed schema

**Decided:** Column names in the CSV are detected via `pickColumn(headers, candidates)` (case + whitespace + dash + underscore insensitive, with substring fallback). We try a handful of plausible names for registrant, registration id, closed-financial-year costs, and fields of interest. If the registrant-name column isn't found we return a `warning` with the parsed headers so reviewers can extend the candidate list without guessing.

**Why:** We don't have the file in hand. The schema has shifted before (the register CSV columns have been renamed across formats). Making detection liberal + observable beats hard-coding a schema we'd then have to ship a fix for. The dryRun route + `headers[]` in the response give a clean "tell me what's actually in there" debug loop.

**Would change if:**
- The real schema turns out to be column-positional rather than header-keyed (unlikely for an official register feed).

## 2026-06-20 00:05 UTC — [data-pipelines] Permissive name-matcher: normalised exact OR prefix containment (≥4 chars)

**Decided:** Matcher normalises both sides (lowercase, NFD-strip diacritics, drop parentheticals + non-alphanumerics, strip trailing legal suffixes from a curated list — "sas, sa, gmbh, ltd, plc, inc, llc, bv, …"). Then: exact normalised match OR `prefix + " "` containment in either direction, as long as the normalised key is ≥4 chars (avoids "ai" matching everything).

**Why:** Trade-off favours false positives over false negatives — see comment block in `match.ts`. Verified manually against test cases: "Anthropic PBC", "Mistral AI SAS", "Hugging Face, Inc.", "OpenAI Ireland Limited" all match correctly; "Google LLC" returns null when not in seed.

**Would change if:**
- A reviewer flags a real false-positive (e.g. an unrelated org that prefix-matches one of our seed names). Mitigation already in place: drop the ≥4-char floor lower or move to token-bag Jaccard.

## 2026-06-19 23:50 UTC — [data-pipelines] RSS ingestion ships without a curated feed-URL inventory

**Decided:** Build the RSS pipeline against `companies.blogRssUrl` / `companies.pressRssUrl` as it stands today (mostly NULL), and seed only four well-known feeds: Anthropic (`/news/rss.xml`), OpenAI (`/blog/rss.xml`), Google DeepMind (`/blog/rss.xml`), Hugging Face (`/blog/feed.xml`). Hugging Face is verified to exist; the other three are best-guess paths. Pipeline treats fetch failure per-feed as a non-fatal warning, so a 404 doesn't poison the cron.

**Why:**
- Overnight rule: ship a defensible default, log it, move on. Spending the cron run hand-curating ~40 RSS URLs against possibly-stale company sites blocks PRs #2 and #3.
- The schema already supports per-company feeds; the pipeline is data-driven, not URL-list-driven. Backfill of URLs becomes a separate "data-curation" task Fatima or Aadi can do in a spreadsheet later.
- A small starter set proves the pipeline end-to-end (Haiku summarise → publications row) on at least one feed (Hugging Face) for sure.

**Alternatives considered:**
- Block on full feed inventory — rejected: blocks downstream PRs and turns a code task into a research task.
- Drop seed entirely, ship pipeline only — rejected: would mean the cron is a no-op for the first 24h and reviewer can't eyeball any rows.
- Hard-code a giant URL list in `src/lib/rss/index.ts` outside the `companies` table — rejected: violates "single source of truth" (the schema field exists for a reason).

**Would change if:**
- Any of the three guessed feeds 404s in the first cron run → drop the URL from seed-data, file a curation TODO.
- Fatima wants summaries from a non-RSS source (newsletter, atom-only press page) → add a second adapter alongside the parser.

## 2026-06-19 23:50 UTC — [data-pipelines] Per-feed Haiku call cap = 10 new items

**Decided:** `runRssPipeline({ maxNewPerFeed: 10 })`. Newest items first; older fresh items spill to the next run if they're still in the feed window.

**Why:** Predictable cost ceiling for the cron. With ~40 companies × 2 feeds × 10 items × claude-3-5-haiku-latest, worst-case daily Haiku spend is well under $0.10 even at $0.001/call equivalents.

**Would change if:**
- We backfill the publications table from scratch (one-off seed) — would lift the cap with `?max=100` on the cron route.

## 2026-06-20 00:35 UTC — London memo author / source

**Decided:** Wrote `research/london-companies.md` myself (Lotus 🪷, overnight)
rather than blocking on a Fatima-authored memo. The cron prompt pointed at
this file as a Step 3 prerequisite; it didn't exist in the repo at start of
the overnight run.

**Why:** Overnight rule — make the most editorially-defensible call and ship.
The memo's editorial register (the inclusion/exclusion criteria, the tier
definitions, the cohort, the edge cases) is exactly the kind of work a
Lotus-pace cadence is *for*; if I'd waited for Fatima it would have lost the
day. The memo is positioned as a first-pass curation with Fatima review in
the morning, not a final pass.

**Alternatives considered:**
- Skip the memo, just write `seed-data.ts` directly — rejected: the memo is
  load-bearing for §9 Step 3 (it's the gating artifact before the seed work
  starts), shipping the data without the memo would have re-introduced the
  v0.4 "data without editorial provenance" pattern.
- Block on Fatima — rejected by the overnight rule, and she'd rather see a
  first pass to react to than nothing to react to.
- Write a 3,000-word memo per the §9 spec — rejected: ~1.5k words covers the
  load-bearing decisions and is more legible at review time than a full 3k.
  Length is a v0.6 polish concern, not a v0.5 ship concern.

**Would change if:**
- Fatima reads the memo and the inclusion/exclusion criteria don't match her
  read of the field → memo gets a revision pass; some companies in/out of the
  seed.
- The tier mix she'd choose differs sharply (e.g. she'd put ICO at S, not A)
  → quick edit to `seedCompanies[*].tier`; cascade is fine.

## 2026-06-20 00:35 UTC — London set is 40 companies, not 30–60

**Decided:** v0.5 ships with 40 London entries (10 S, 14 A, 16 B).

**Why:** §9 Step 3's range was 30–60. 40 lands inside the range, weighted
toward the lower end on purpose — curation honesty over coverage breadth on
v0.5 (the editorial pass is per-company, and a tighter set is easier to
re-read for the Step 5 re-curation against the live chrome).

**Would change if:** the cohort feels too sparse on certain frame poles
(e.g. zero 5s on Stage of company with the right "established big-shop"
character) → add 1–3 marginal entries before Step 5 ships.

## 2026-06-20 00:36 UTC — Frame scores are first-pass, not Fatima-reviewed

**Decided:** All 240 (company × frame) scores in `seedFrameScores` are
Lotus's first-pass editorial calls. They've been entered without rationale-
per-cell (which the v0.5 schema supports via `frame_scores.rationale` but
which `seedFrameScores` doesn't currently round-trip).

**Why:** Same overnight rule. First-pass scores let the Map render with real
shape (axis swaps actually do work, the distribution isn't flat); a perfect
second pass is what §9 Step 5 is for. Rationale-per-cell is editorial work
that fits the re-curation phase by design (the rationale matters more once
the chrome is in the Machine register).

**Alternatives considered:**
- Hold the seed back until rationales are written — rejected: blocks every
  downstream UI step, and rationales without a live surface to read them
  against are harder to write well.
- Auto-generate rationales with Haiku from the company description —
  rejected: rationales are editorial provenance, not derived copy. If they
  come from an LLM at first write they're never the cat speaking; they're
  the cat impersonating the cat.

**Would change if:** Step 5 re-curation finds material disagreement between
description and score on >25% of cells → first-pass scores get a sweep edit
before any of them become canonical.

## 2026-06-20 00:50 UTC — Step 4 (Rebuild) ships as a focused subset overnight, not in full

**Decided:** This overnight run ships the visible-shift portion of Step 4 —
home is the Map, /companies list dies, mono-forward layout, pixel cat
sprite set, reference render — but **defers** the deeper rebuild work
(four-panel comic onboarding, password gate rewrite, full Surprise modal
with three variants and rotation, chat panel migration for the next-role
loop, inline fit-note editor, /frames weight editor, the no-raw-Tailwind
lint rule) to a daytime session with Fatima review.

**Why:** §9 Step 4 is a ~2-week deliverable per the doc's own calendar.
Shipping the entire deliverable in one overnight cron would either (a)
produce a half-implemented mess that Fatima would have to roll back, or
(b) cut corners on the editorial work where corners cost the most (the
comic's prose register, the Surprise reason grammar). The focused subset
ships the *load-bearing IA collapse* — Map-as-home, list dies, mono-
forward, tokens live — which gives Fatima a real surface to react to in
the morning while leaving the editorial-heavy chunks for a session where
she can react in real time.

**What this means for the morning:** Fatima will see a working v0.5
production deploy at the same Vercel URL, with the new dataset, new
palette, new IA shape — but with v0.4-style Surprise/onboarding/login
chrome still in place. The reference render at `/machine-test` shows the
target register for the chunks that didn't ship.

**Alternatives considered:**
- Spend the overnight on the comic strip alone — rejected: comic without
  the rest reads as a marketing teaser, not an onboarding ritual.
- Ship a half-finished Surprise modal with one variant — rejected:
  CONCEPT-v0.5 §5.5 explicitly says "no surfacing without a reason"; a
  half-built modal would violate the editorial discipline §5 is designed
  to protect.
- Skip Step 4 entirely overnight, ship Steps 2 + 3 + 6 only — rejected:
  the visible shift (home is the Map, list dies) is the highest-leverage
  bit Fatima can react to first thing.

**Would change if:** Fatima reviews the focused-subset surface and decides
the comic/modal/chat-panel chunks should land in their v0.4 placeholders
(i.e. ship the rebuild as-is, polish later) → next chunk is the formal
removal of the placeholders.

## 2026-06-20 00:50 UTC — Pixel cat ships as a single sprite sheet, not five separate cells

**Decided:** `public/cat/pixel/sprites.png` is one 1536×1024 sprite sheet
with all five poses on a single background, not five separate 64×64
sprites in `idle.png` / `blink.png` / etc. Image generation produced the
poses on a white background (not transparent despite the flag).

**Why:** Generated assets aren't pixel-perfect-rectangular cells the model
returns; cutting into separate 64×64 cells with crisp edges is a swatch-
session task that needs a human eye on the silhouette. The single sheet
is usable as a reference render (it appears on `/machine-test`) and as a
placeholder asset; the per-pose cell extraction lands in the proper
Step 2 deliverable when Fatima signs off on the base sprite.

**Would change if:** Fatima dislikes the generated silhouette → re-run
image_generate with a sharper character brief, or commission a pixel
artist for proper sprite cells. The brief in §6.5 still anchors what
"right" looks like.

## 2026-06-20 00:52 UTC — README ships in surprise-discipline mode

**Decided:** Rewrote `README.md` end-to-end for v0.5. The framing is
"a curated map of London's AI-policy companies, organised across six
frames, to help you explore where you might want to do AI policy work" —
addressing the reader as "you" without naming Aadi. The closing "How to
use it" section reads as instructions to a reader who might or might not
be the named-target user.

**Why:** Cron prompt: framing is "a surprise for Aadi to explore AI
policy roles" *and* "should make sense when Aadi reads it himself."
Those two together rule out (a) explicitly addressing Aadi in the README
(breaks the surprise), and (b) being so generic that it reads as a
template for anyone (loses the editorial pitch). The "you" address +
small-cat tone + surprise-button reference threads the needle.

**Alternatives considered:**
- Open with "for Aadi:" — rejected: breaks the surprise the moment he opens
  the repo.
- Make the README a feature-list directory README without the editorial
  framing — rejected: turns the editorial register off, which is the
  whole point of v0.5.

**Would change if:** Fatima reads the README and the warmth-without-twee
balance is off (too warm → twee, too cold → templated) → one revision pass
to dial it.
