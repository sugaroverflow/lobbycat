# Controversy scope — Glyphie research layer

**Author:** Glyphie 🌀
**Date:** 2026-06-24
**Status:** Proposed (awaiting Fatima sign-off)
**Sibling docs:** `v0.7/glyphie-sources.md` (daily source list), HANDOFF.md (output schema)

---

## What this is

A **controversy / reputational-signal layer**, one per company, folded into the existing per-company feed JSON as a new `controversies` array. Where the daily feed answers *"what is this company publishing?"*, this layer answers *"where has this company been contested?"* — the signal someone like Aadi needs before joining, but which no press release will ever volunteer.

Tone: **investigative-report**. Factual, sourced, every claim one click from a real article or primary record. The reader is told plainly when something is alleged vs. decided, and is expected to verify. We never assert guilt; we report what a court, regulator, or credible outlet has documented.

---

## The cardinal rule: attribution discipline

**A controversy counts for a company only if the company is genuinely a *party to it* or a *named subject of it* — never merely co-located on a page, mentioned in passing, or topically adjacent.**

This rule exists because of a real trap caught on 2026-06-24. While looking at the Tony Blair Institute, a case surfaced — *"examination scripts as personal data… Peter Nowak… European Court of Justice"*. That is **Nowak v Data Protection Commissioner** (CJEU C-434/16, ruled 2017), a landmark Irish data-protection case. **It has nothing to do with the Tony Blair Institute.** It merely appeared near TBI in a feed. Attaching it to TBI would have been a fabricated association — exactly the invention SOUL.md forbids.

Loose scraping produces this failure constantly. So every candidate controversy must pass an **attribution check** before it is logged:

1. **Named-party test** — Is the company (or a clearly identifiable arm/named employee acting for it) a *party*, *subject*, *defendant*, *respondent*, or *investigated entity*? Passing-mention or quoted-commentary does **not** qualify.
2. **Primary-or-named-source test** — Can the claim be traced to a court record, a regulator's published decision, or a named-byline article in a reputable outlet that itself names the company as the subject? If the only evidence is an aggregator snippet or an adjacent headline, **do not log it** — at most, note it in the daily note as "unverified, needs a primary source."
3. **Same-entity test** — Beware name collisions (e.g. "Faculty" the AI firm vs. other "Faculty" orgs; "Apollo Research" vs. unrelated "Apollo" entities). Confirm it's *our* company, matched by the seed `websiteUrl`/legal name, not a homonym.

If any test is uncertain, the entry does not go in the JSON. It goes in the daily note as a flagged lead. **"Nothing verified today" beats one wrong attribution** — a false reputational claim is worse than a missed one, both ethically and legally.

---

## What counts as a controversy (priority order)

In descending priority — when run time/budget is limited, work the list top-down:

1. **Legal cases the company is a party to.** Litigation, lawsuits, judgments, appeals, regulatory tribunal proceedings where the company is plaintiff/defendant/respondent. Highest signal: a court is involved and the record is public.
2. **Regulatory actions / investigations against the company.** ICO enforcement, CMA investigations/decisions, FCA actions, Ofcom proceedings, EU Commission probes, data-protection-authority decisions, competition rulings. Includes *opened* investigations (clearly labelled "ongoing / no finding yet").
3. **Substantive public criticism from credible sources.** Named investigative journalism (AP, Reuters, FT, Guardian, Bloomberg, specialist outlets), credible NGO/watchdog reports (e.g. AlgorithmWatch, Big Brother Watch, Foxglove), academic critiques. **Not** Twitter/X pile-ons, anonymous blog posts, or single-source rumour.
4. **Broken-promise / reversal stories.** Documented cases where a company publicly reversed a stated position, broke a commitment, or where a press release contradicts later conduct — the "they used 'evolving' four times" tell, but evidenced.

### Severity tagging
Each entry carries a `severity`: `high` (judgment/fine/enforcement landed), `medium` (active investigation/litigation, no finding yet), `low` (criticism/reporting, no formal proceeding).

### Status tagging
Each entry carries a `status`: `alleged` | `ongoing` | `settled` | `decided` | `dismissed` | `withdrawn`. This is what keeps the tone honest — an *alleged* claim is never rendered as a *decided* one.

---

## Source list (the spine)

### Tier 1 — Primary / authoritative (free, citable, the backbone)
| Source | Covers | Access |
|---|---|---|
| **gov.uk** (decisions, enforcement notices) | UK regulatory actions across departments | Free web/Atom |
| **ICO enforcement** (ico.org.uk/action-weve-taken/enforcement) | UK data-protection enforcement, fines, notices | Free web |
| **CMA case pages** (gov.uk/cma-cases) | UK competition/markets investigations & decisions | Free web |
| **FCA** (fca.org.uk — news/enforcement) | Financial-services AI/conduct actions | Free web |
| **Ofcom** (ofcom.org.uk — bulletins/decisions) | Online safety / AI proceedings | Free web |
| **CJEU / curia.europa.eu** | EU court judgments (e.g. Nowak C-434/16) | Free web |
| **EU Commission press / competition** (ec.europa.eu) | EU probes, AI Act enforcement | Free web |
| **BAILII** (bailii.org) | UK & Ireland case law full text | Free web |
| **UK court listings** (judiciary.uk, find-case-law.service.gov.uk) | UK judgments | Free web |
| **EDPB / national DPAs** (CNIL, etc.) | EU data-protection decisions | Free web |

### Tier 2 — Reputable reporting (corroboration; headline + link, never paywalled body)
- **AP** (apnews.com), **Reuters** (reuters.com) — wire services, free, neutral, ideal primary-press citations.
- **The Guardian** (theguardian.com) — free, strong UK tech/AI investigative desk.
- **BBC News** (bbc.co.uk/news) — free, UK-anchored.
- **Tech Policy Press**, **Lawfare** — already in the daily list; carry legal-grade analysis of cases.
- **FT, Bloomberg, The Times** — paywalled: log *title + URL + outlet* only, never reproduce the body (ToS rule holds).

### Tier 3 — Watchdog / NGO (for criticism-tier signals, named-source only)
- **Big Brother Watch**, **Foxglove**, **Open Rights Group**, **Connected by Data**, **AlgorithmWatch**, **EDRi** — several are themselves seed companies; their *reports about other companies* are valid Tier-3 sources when they name a subject.

### Explicitly excluded
- **LinkedIn** (ToS — no scraping).
- **X/Twitter pile-ons, Reddit, anonymous blogs** — not credible single sources; may be a *lead* in the daily note, never a logged controversy.
- **Paywalled article bodies** — title + URL + outlet only.

---

## JSON schema — new `controversies` field in `research/feeds/<slug>.json`

Added alongside existing `publications` / `roles` / `filings` / `leadership`:

```json
"controversies": [
  {
    "date": "2025-11-14",
    "title": "Short factual headline of the matter.",
    "category": "legal_case | regulatory_action | public_criticism | broken_promise",
    "severity": "high | medium | low",
    "status": "alleged | ongoing | settled | decided | dismissed | withdrawn",
    "summary": "2-4 sentences, investigative-report tone. What is documented, by whom, at what stage. State plainly if alleged vs decided. No assertion of guilt beyond what the source establishes.",
    "primary_source": { "label": "ICO enforcement notice", "url": "https://..." },
    "corroboration": [
      { "outlet": "Reuters", "url": "https://...", "paywalled": false }
    ],
    "company_role": "defendant | respondent | investigated | plaintiff | subject_of_reporting",
    "attribution_checked": true
  }
]
```

- `attribution_checked: true` is mandatory — it's the audit flag that the three-test check above was run. No entry ships without it.
- `primary_source` is **required**. If there is no primary or named-byline source, the item does not belong in the JSON.
- `corroboration` is optional but encouraged; paywalled items allowed here as `{outlet, url, paywalled:true}` with no body.

---

## Cadence & workflow

- **Runs daily**, inside the existing daily research pass (not a separate job). Most companies will have *zero new controversies* on most days — that's expected and correct; an empty `controversies: []` is the norm, not a failure.
- **Backfill vs. daily:** the first pass per company is a one-time *backfill* of known historical controversies (top priority-1/2 items); thereafter it's incremental — only *new* developments get appended.
- **Tone enforcement:** every `summary` written investigative-report style — sourced, staged, verifiable, never guilt-asserting. The reader is trusted to click through.
- **Daily note:** unverified leads, name-collision near-misses, and "smells like a story but no primary source yet" items live in `glyphie-notes/<date>.md`, never in the committed JSON.

## Worked example (to be built next, for sign-off)
One company with a *real, correctly-attributed* controversy, verified against a Tier-1 primary record, to demonstrate the shape and the discipline before rolling to all 70.

---

## Open questions for Fatima
1. **Backfill depth** — how far back should the first historical pass go? (Suggest: last ~3 years for priority 1-2, anything older only if landmark.)
2. **Dashboard surfacing** — that's Lotus's call, but worth a heads-up that this field is reputational/legal-sensitive; she may want a "verify before relying" disclaimer on the surface.
3. **Severity threshold for criticism (priority 3)** — how high a bar? (Suggest: named-byline investigative piece OR named watchdog report; nothing thinner.)
