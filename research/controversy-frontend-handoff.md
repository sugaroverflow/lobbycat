# Controversy layer → frontend handoff (Glyphie → Lotus)

**From:** Glyphie 🌀  **To:** Lotus 🪷  **Date:** 2026-06-24
**Re:** displaying the new controversy data on v0.7
**Status:** coordination request — your call on architecture & surfacing

---

Fatima signed off a new research scope: a **per-company controversy / reputational-signal layer** (`research/controversy-scope.md`). It's reputational/legal data — legal cases, regulatory actions, credible criticism, broken-promise stories — written investigative-report style, every claim linked to a primary or named source. I produce the data; **how it's displayed is your surface, not mine** (SOUL.md keeps me out of `src/`). So this is me handing you the shape and asking how you want to consume it.

## What I produce

A `controversies[]` array inside each `research/feeds/<slug>.json`, alongside the existing `publications`/`roles`/`filings`/`leadership`. Per entry:

```json
{
  "date": "2025-11-14",
  "title": "...",
  "category": "legal_case | regulatory_action | public_criticism | broken_promise",
  "severity": "high | medium | low",
  "status": "alleged | ongoing | settled | decided | dismissed | withdrawn",
  "summary": "2-4 sentences, investigative-report tone.",
  "primary_source": { "label": "ICO enforcement notice", "url": "https://..." },
  "corroboration": [ { "outlet": "Reuters", "url": "https://...", "paywalled": false } ],
  "company_role": "defendant | respondent | investigated | plaintiff | subject_of_reporting",
  "attribution_checked": true
}
```

Most companies will have `controversies: []` on most days. First pass is a 3-year historical backfill for legal/regulatory items; thereafter incremental.

## The architecture question (yours to decide)

I looked at how v0.7 consumes my data today and there are **two paths**, and controversy could go either way:

- **Path A — DB table.** Like `publications`/`lobbyingRecords` etc., add a `controversies` pgTable + an ingestion step that reads my JSON into it, then company pages read it via `queries.ts`. Consistent with the rest of the evidence model; lets you sort/filter/index and feed it into scoring if you ever want to. More work.
- **Path B — read the JSON directly.** Like `welcome-back.ts` already reads `research/feed.json`, have the company page/drawer read `controversies[]` straight from the per-company file. Faster to ship; no schema migration; stays cleanly "Glyphie's flat-file output." Less queryable.

I lean toward **A long-term** (it's evidence, and the DB is where evidence lives) but **B is the fast path to get it on screen**. Genuinely your call — you own the surface and the schema.

## Display notes (suggestions, not requirements)

- **Surface location:** the company dive-deep page / `company-drawer.tsx` feels right — a "Contested / Scrutiny" section under the fit-note, near publications.
- **Tone discipline carries to the UI:** `status` must be visible (an `alleged`/`ongoing` item should never *look* like a `decided` one). Severity could be a quiet dot, not a scarlet letter.
- **Every entry links out.** Fatima's explicit ask: the audience (Aadi) verifies via links, so `primary_source.url` should always be a click away. That also covers the reputational-sensitivity — we're surfacing *what's documented and where*, not passing judgement.
- **Light disclaimer, not heavy.** Per Fatima: no big legal banner needed for an audience of one who verifies; maybe a small "linked, verify before relying" affordance.
- **Empty state matters.** "No controversies on record" should read as neutral fact, not absence-of-data — and shouldn't imply we exhaustively checked everything.

## What I need back from you

1. Path A or Path B? (Tells me whether you want a migration or whether my JSON is the contract.)
2. Any field changes you want in the schema above before I start backfilling — easier to adjust the shape now than after 70 files exist.
3. Where on the page it lives, so today's note can point Aadi-facing copy at the right surface (eventually).

No rush — I won't backfill the 70 until you've picked A/B, so the data shape matches how you'll read it. Parking this here in `research/` and flagging it to you via #lobby-cat once the bot's live.
