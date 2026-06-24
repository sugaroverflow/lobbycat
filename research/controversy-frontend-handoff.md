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

## Architecture — decided: map to the existing evidence model (Fatima, 2026-06-24)

Controversies become a **peer evidence kind** — a `controversies` table alongside `publications` / `consultation_submissions` / `safety_frameworks`, read on the company page like the rest of the evidence. Not a flat-file side-channel.

I've shaped my JSON to mirror your evidence-table convention (`companyId` + type discriminator + `title`/`url`/timestamp + `summary` + `topics` jsonb + `rawExcerpt` + `source` + `unique(companyId,url)`), so the ingestion should be a near-copy of your existing pipelines. Full proposed table DDL + matching JSON is in `research/controversy-scope.md` ("JSON schema — maps to the existing evidence model").

Key fields that differ from your other evidence kinds (controversy-specific):
- `status` — alleged | ongoing | settled | decided | dismissed | withdrawn (so *alleged* never renders as *decided*)
- `severity` — high | medium | low (magnitude, distinct from status/stage)
- `companyRole` — defendant | respondent | investigated | plaintiff | subject_of_reporting
- `corroboration` — jsonb `[{outlet,url,paywalled}]`

It slots in as another `evidence_kind` the scoring engine already understands (cf. `safety_framework`), so you *can* later let controversy weigh on a company's read — but nothing forces it to.

## Display notes (suggestions, not requirements)

- **Surface location:** the company dive-deep page / `company-drawer.tsx` feels right — a "Contested / Scrutiny" section under the fit-note, near publications.
- **Tone discipline carries to the UI:** `status` must be visible (an `alleged`/`ongoing` item should never *look* like a `decided` one). Severity could be a quiet dot, not a scarlet letter.
- **Every entry links out.** Fatima's explicit ask: the audience (Aadi) verifies via links, so `primary_source.url` should always be a click away. That also covers the reputational-sensitivity — we're surfacing *what's documented and where*, not passing judgement.
- **Light disclaimer, not heavy.** Per Fatima: no big legal banner needed for an audience of one who verifies; maybe a small "linked, verify before relying" affordance.
- **Empty state matters.** "No controversies on record" should read as neutral fact, not absence-of-data — and shouldn't imply we exhaustively checked everything.

## What I need back from you

1. **Field/naming sign-off** on the proposed `controversies` table in `controversy-scope.md` — tweak names/types to your conventions before I emit 70 files. (Easier to adjust the shape now than after.)
2. **Whether you want the table + ingestion built before or after my backfill.** I can backfill the JSON in the agreed shape now (it's evidence-model-ready); your migration + ingestion step can land whenever — the JSON is the contract either way.
3. **Where on the page it lives** — suggest a "Contested / Scrutiny" section in `company-drawer.tsx`, near publications.

I can start the backfill on the agreed evidence-model shape without blocking on the migration — flag me if you want a field change first. Flagged to you via #lobby-cat (PR #17).
