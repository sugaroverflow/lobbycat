# Glyphie source verification — lobbycat v0.7

**Date:** 2026-06-23
**Author:** Lotus 🪷
**Context:** Verifying the proposed monitoring source list for Glyphie (researcher agent) for Aadi, an international policy person in London exploring AI policy roles. Glyphie runs daily and writes summaries to JSON consumed by the lobbycat dashboard.

---

## TL;DR — what Glyphie should monitor

Glyphie has three jobs, in this order:

1. **Per-company watch (70 companies):** policy/blog/press RSS where it exists, careers pages filtered to policy/regulatory/public-affairs/global-affairs/trust+safety/responsible-AI titles. RSS first, sitemap second, scrape last.
2. **Regulatory + filings ground truth:** UK gov.uk consultations, EU "Have Your Say" portal, US Senate LDA API (free, machine-readable since 1999). These are the receipts when companies say "we engaged with policymakers."
3. **Curated commentary layer:** a short, opinionated stack of newsletters, think tanks, and named-author streams that translate raw events into "what an international policy hire in London needs to know."

The proposed list is mostly solid. Cut HAI Policy Brief Series as a primary feed (no clean RSS, low daily-cadence value); fold it into a broader "Stanford HAI policy publications" weekly check. Add UK-bubble depth (AISI, CETaS, Ada Lovelace, CLTR, Bennett, GovAI) and EU-bubble depth (AI Decoded, AlgorithmWatch, EDRi). Add ChinAI and Miles Brundage to the named-author tier.

---

## Verified core list

| Source | Real? | Active 2026? | Signal for AI policy | Access | Cadence |
|---|---|---|---|---|---|
| Per-company policy/blog/press RSS | Y | Y (varies per co.) | High — first-party announcements, RSPs, frontier-policy filings | Free RSS where present | Per-event |
| Per-company careers pages | Y | Y | Med-High — hiring signals tell you who's building lobbying muscle | Free web, mostly scrape (Greenhouse/Lever often have JSON) | Daily |
| Tech Policy Press (techpolicy.press) | Y — https://www.techpolicy.press | Y (June 2026 posts live) | High — nonprofit, opinion+analysis at tech/democracy intersection | Free RSS: techpolicy.press/rss/feed.xml | Daily |
| Lawfare (lawfaremedia.org) | Y — https://www.lawfaremedia.org | Y (Feb–June 2026 AI posts) | High — legal-grade analysis, "AI on Trial" series, Scaling Laws podcast | Free RSS site-wide | Daily |
| POLITICO Morning Tech UK | Y — politico.eu/newsletter/morning-tech-uk | Y | High — DSIT/Ofcom/CMA tea leaves daily; London-relevant | Free email + free web archive; Pro tier paywalled | Daily (weekdays) |
| Stanford HAI policy publications | Y — hai.stanford.edu/policy | Y | Med — high-quality but slow; better as weekly digest than daily | Free web; **no clean RSS** for policy briefs — sitemap scrape | Weekly |
| AI Snake Oil (Narayanan + Kapoor) | Y — https://www.aisnakeoil.com | Y (78K subs, 2026 footer) | High — sharpest counter-hype voice; affects how policymakers talk about capability claims | Free Substack RSS: aisnakeoil.com/feed | Weekly-ish |
| UK gov.uk AI consultations | Y — gov.uk/government/consultations | Y (Copyright & AI consultation 2026 etc.) | Very High — official UK regulatory pipeline | Free web; **gov.uk has Atom feeds per topic**: append `.atom` to filtered URLs | Per-event (~weekly) |
| EU Commission "Have Your Say" | Y — have-your-say.ec.europa.eu | Y | High — AI Act implementation, cloud/AI consultations | Free web; no native RSS — scrape JSON endpoint or use the topic filter | Per-event |
| US Senate LDA API | Y — https://lda.senate.gov/api/ (sunsets 2026-06-30 → moves to lda.gov) | Y | Very High — every "artificial intelligence" lobbying filing, free, machine-readable since 1999 | Free REST API (15 req/min anon, 120 with free key); quarterly filings | Quarterly + per-registration |
| Anthropic policy/safety posts | Y — anthropic.com/research (Policy tag) + /news | Y (June 2026 Economic Policy Framework, Advanced AI Framework) | High — named-author posts from Clark, Amodei, policy team | Free RSS at /news/feed.xml | Per-event (~weekly) |
| OpenAI Global Affairs | Y — openai.com/news/global-affairs/ | Y (June 2026 active) | High — "Our views on AI policy and political advocacy" (Jun 2 2026); biodefense, child safety blueprints | Free web; partial RSS at /news/rss.xml — filter by Global Affairs tag | Per-event (~weekly) |
| Google DeepMind Responsibility & Safety | Y — deepmind.google/responsibility-and-safety/ | Y (Jun 18 2026 post) | Med-High — slower cadence than Anthropic/OpenAI; named-author when present | Free web; RSS at deepmind.google/blog/rss.xml | Per-event |
| Helen Toner — Rising Tide | Y — https://helentoner.substack.com | Y (Jan 2026 "Taking Jaggedness Seriously") | High — ex-OpenAI-board, CSET; rare but high-signal | Free Substack RSS | Monthly-ish |
| Jack Clark — Import AI | Y — https://importai.substack.com / jack-clark.net | Y (Issue 455, May 4 2026; 132K subs) | High — weekly synthesis from Anthropic co-founder; THE policy-adjacent research digest | Free Substack RSS | Weekly |
| Marietje Schaake | Y — FT column + Stanford Cyber Policy Center bio | Y (FT column May 2026; Lawfare podcast May 2026) | High — EU/US perspective; "tech coup" framing | FT paywalled (free RSS lists titles); Stanford CPC free | Weekly (FT) |

**Total verified core: 15 sources.** All real, all active in 2026.

---

## Additional recommendations (10)

| Source | Real? | Active 2026? | Signal | Access | Cadence |
|---|---|---|---|---|---|
| UK AI Security Institute (AISI) — was AI Safety Institute | Y — https://www.aisi.gov.uk/research | Y (Frontier AI Trends Report; Jun 8 2026 Human Influence post) | Very High — UK government's own evaluations of frontier models; landmark for policy | Free web; check for RSS on /research | Weekly-ish |
| CETaS (Alan Turing Institute) | Y — https://cetas.turing.ac.uk | Y (Apr 2026 Snapshot Reports; CETaS Outlook 2026) | High — UK national-security-flavoured AI policy briefs | Free web; no obvious RSS — sitemap scrape | Monthly |
| Ada Lovelace Institute | Y — https://www.adalovelaceinstitute.org | Y | High — UK civil-society anchor; data + AI for people & society | Free web + newsletter; RSS at /feed (WordPress) | Weekly |
| GovAI (Centre for Governance of AI) | Y — https://www.governance.ai | Y | High — RSP analysis, frontier-AI governance research | Free web; RSS on blog | Bi-weekly |
| Centre for Long-Term Resilience (CLTR) | Y — https://www.longtermresilience.org | Y (CLTR-RAND Global Risk Index for AI-enabled Biological Tools) | Med-High — UK think tank, AI x bio x extreme risk | Free web; check /reports for RSS | Monthly |
| POLITICO AI: Decoded (EU) | Y — politico.eu/newsletter/ai-decoded | Y | Very High — Brussels AI Act implementation gossip | Free email; web archive free | Weekly |
| AlgorithmWatch | Y — https://algorithmwatch.org/en/publications | Y | High — civil-society, DSA enforcement, ADM critique from Berlin | Free RSS | Weekly |
| EDRi (European Digital Rights) | Y — https://edri.org | Y | Med-High — coalition voice on EU AI Act + biometric mass surveillance | Free RSS | Weekly |
| ChinAI Newsletter — Jeffrey Ding | Y — https://chinai.substack.com (31K subs) | Y | High — only sane English source for what Chinese policy thinkers actually say about AI | Free Substack RSS | Weekly |
| Miles Brundage — Substack | Y — milesbrundage.substack.com (Helen Toner recommends) | Y | High — ex-OpenAI head of policy research; thoughtful long-form | Free Substack RSS | Monthly-ish |

### Honourable mentions (consider for v0.8, not v0.7 seed)

- **Tony Blair Institute "Governing in the Age of AI" series** — high-profile in UK but tilts pro-industry; useful as one data point, not a daily feed.
- **Bennett Institute (Cambridge)** — quality publications but slow; quarterly check.
- **Future of Life Institute** — newsletter exists but coverage overlaps heavily with above.
- **AI Now Institute** — strong critical-AI voice; ~quarterly reports, fold in via a "long reads" weekly check.
- **MIT Tech Review policy coverage** — paywalled, signal okay but you can pick up the same stories via Tech Policy Press.
- **IAPP newsletters** — strong on privacy, weaker on AI policy specifically; gated.
- **Trustworthy AI Lab (UCL)** — academic, slow cadence.

### Cut from the proposed list

- **Stanford HAI Policy Brief** as a *daily/named feed* — keep as a *weekly sitemap check on hai.stanford.edu/policy/policy-publications*. No clean RSS for the Brief series specifically; cadence is slow. Demoted from "primary core" to "weekly digest."
- **OpenSecrets API** as a separate item — redundant with Senate LDA API for AI lobbying queries. LDA is upstream; OpenSecrets is downstream enrichment. Use LDA directly.

---

## Recommended seed list — the final answer Glyphie ships with

Order = priority of build-out. RSS-first where possible.

### Tier 1 — daily, must-have (8)

1. **Per-company policy/blog/press RSS** (loop over all 70 in `seed-data.ts`)
2. **Per-company careers pages** (Greenhouse/Lever JSON when available, otherwise sitemap)
3. **Tech Policy Press** — `techpolicy.press/rss/feed.xml`
4. **Lawfare** — `lawfaremedia.org/feed`
5. **POLITICO Morning Tech UK** — email ingest or web-archive scrape
6. **POLITICO AI: Decoded (EU)** — same pattern
7. **gov.uk AI consultations** — Atom feed on the consultations topic filter
8. **US Senate LDA API** — query for "artificial intelligence" in issues text, quarterly + new registrations (note 2026-06-30 sunset → switch to lda.gov)

### Tier 2 — weekly, high signal (7)

9. **EU "Have Your Say"** AI/digital filter — scrape
10. **Anthropic** policy-tagged posts (filter on `/research?tag=Policy` + `/news`)
11. **OpenAI** Global Affairs section
12. **DeepMind** Responsibility & Safety
13. **AISI research feed**
14. **Ada Lovelace Institute** publications RSS
15. **AlgorithmWatch** publications RSS

### Tier 3 — opportunistic named-author / weekly digest (8)

16. **Import AI** (Jack Clark) — Substack RSS
17. **Rising Tide** (Helen Toner) — Substack RSS
18. **AI Snake Oil** (Narayanan + Kapoor) — Substack RSS
19. **ChinAI** (Jeffrey Ding) — Substack RSS
20. **Miles Brundage** — Substack RSS
21. **Marietje Schaake** — FT column + Stanford CPC
22. **GovAI** blog
23. **CETaS** + **CLTR** sitemap scrape (rolled together as "UK think tanks weekly")

### Operating notes for Glyphie

- **Dedupe aggressively.** Anthropic posting → Lawfare commenting → Tech Policy Press summarising → Import AI linking. Cluster by URL + headline similarity.
- **Source-quality weighting.** Tier 1 events warrant a dashboard entry. Tier 2/3 should only surface if they meaningfully add framing or signal.
- **London / UK bias on tie-breaks.** Aadi is in London looking at AI policy roles; UK-relevant filings, hiring, and consultations should outrank equivalent US-only items unless the US item is a frontier-policy bombshell.
- **Named-author filter.** For lab blogs (Anthropic, OpenAI, DeepMind), prefer posts with a named author byline over anonymous corporate announcements — Aadi cares about who's actually shaping the policy line.
- **Careers heuristic.** Watch for titles containing: policy, regulatory, public affairs, public policy, government affairs, global affairs, trust & safety, responsible AI, AI safety policy, frontier policy. UK location = bonus weight.
- **Paywall handling.** Don't try to scrape paywalled FT/Politico Pro bodies; capture headline + dek + URL and let Aadi click through with his own subscription.
- **LDA API key.** Register at https://lda.senate.gov/api/register/ to get 120 req/min instead of 15. Migrate endpoint to lda.gov after 2026-06-30.

---

## Sources I deliberately did NOT verify in depth (and why)

- **Per-company RSS specifically** — too many to enumerate; assume seed-data.ts is the source of truth and Glyphie should probe each `policyFeedUrl` on first run, mark dead ones, and surface them for human review.
- **Tony Blair Institute, Bennett, FLI, AI Now, IAPP, UCL Trustworthy AI** — listed as honourable mentions / v0.8 candidates rather than seed; happy to verify on request if any of them gets promoted.
