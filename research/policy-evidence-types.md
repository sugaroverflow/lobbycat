# Policy Evidence Types for lobbycat v0.6 Scoring Engine

**Author:** Lotus 🪷 (research agent)
**Date:** 2026-06-23
**Status:** Scoping memo — input for the v0.6 cited-evidence scoring engine
**Audience:** lobbycat product / Aadi

---

## Headline: what evidence actually matters when judging policy roles

If you're an AI policy person evaluating where to work, the single most predictive corpus is **the team's own published reasoning** — policy submissions, position papers, structured frameworks (RSPs, frontier safety policies), and named-author blog posts. These are the only evidence types where the team has had to defend a concrete view in front of a hostile-or-skeptical audience, which is exactly the working experience you're buying. Everything else — press releases, conference talks, LinkedIn — is downstream of either marketing or whatever the team published last quarter. **Optimise for documents that someone had to attach their name to and that an opponent could embarrass them with.** Ingest those well, and most of the other signal types become low-marginal-value.

---

## Evidence-type signal table

| Evidence type | Signal for which frame(s) | Accessibility | Refresh cadence | Worth ingesting? |
|---|---|---|---|---|
| **Regulatory consultation submissions** (UK gov, EU Commission, NIST, OSTP, AISI calls for evidence) | Geographic remit, Policy area scope, Policy posture, Team style | Public, free, attributed | Per consultation — track last 18 months | ✅ **High priority** |
| **Responsible Scaling Policies / Frontier Safety Frameworks / model cards** | Policy posture (frontier-defining), Stage, Working style | Public, free | Versioned, ~6 months/major | ✅ **High priority** — for frontier labs only |
| **Named-author blog posts on company site** (policy team byline) | Working style (writing-led), Team style, Policy area scope | Public, free | Per post — last 12 months | ✅ **High priority** |
| **Long-form essays / Substacks / personal blogs by team members** | Working style, Team style, Policy posture | Public, free, easily scraped | Per post | ✅ **High** — best signal for individual team members |
| **White papers / position papers (with authors)** | Policy area scope, Policy posture, Team style | Public, free PDFs | Quarterly–annual | ✅ **High** |
| **Lobbying register filings** (US: LDA quarterly LD-2; EU: Transparency Register; UK: ORCL register for consultant lobbyists) | Geographic remit, Policy area scope, Working style (gov-affairs-led) | Public, free, structured | Quarterly (US/EU); sparse (UK) | ✅ **High** for working-style frame; ⚠️ UK register is famously thin |
| **Parliamentary / select-committee written evidence** (UK), **Congressional testimony** (US), **EU Parliament hearings** | Geographic remit, Policy area scope, Policy posture | Public, free, attributed transcripts | Per inquiry | ✅ **High** — strongly attributed, defended-under-questioning |
| **GitHub repos from policy-adjacent staff** (evals, transparency tooling, benchmark code) | Working style (writing-led vs technical), Team style | Public, free | Per commit | ✅ **Medium** — only for technical-policy roles |
| **Letters / open letters / coalition signatures** (e.g. AI safety letters, joint civil-society statements) | Policy posture, Policy area scope | Public, free | Episodic | ✅ **Medium** — useful but noisy; many are PR signals |
| **Podcast interviews with team members** (80,000 Hours, Dwarkesh, Hard Fork, Politico AI Decoded) | Policy posture, Working style, Team style | Public, free transcripts (varies) | Per appearance | ✅ **Medium** — high content density when transcribed, but cherry-picking risk |
| **Conference talks** (NeurIPS policy track, FAccT, RightsCon, GovAI, IASEAI) | Policy area scope, Team style | Mixed — slides/recordings often public | Annual | ✅ **Medium** when recorded, else low |
| **Op-eds / bylined press pieces** (FT, Politico, Lawfare, Tech Policy Press) | Policy posture, Geographic remit, Working style | Some gated (FT, Politico Pro) | Per piece | ✅ **Medium** — Lawfare & Tech Policy Press = gold; FT/Politico paywalled |
| **LinkedIn posts by team members** | Working style, weak Team style | Public-ish but ToS-hostile to scrape | Daily noise | ⚠️ **Low-medium** — high noise, performative, hard to verify ToS-clean ingestion |
| **Twitter/X posts by team members** | Policy posture, sometimes Geographic remit | Public, API-gated | Daily | ⚠️ **Low-medium** — same problem, plus API cost |
| **Press releases on company site** | Almost none — marketing artefact | Public, free | Per release | ❌ **Low** — restate decisions, never explain them |
| **Funding / mission statements / "About" pages** | Stage, weak Policy area scope | Public | Rarely changes | ❌ **Low** as standalone — only as backstop when nothing else exists |
| **News articles about the company** (not by company) | Stage, sometimes Policy posture | Mixed paywall | Constant | ⚠️ **Low-medium** — useful for stage/events; never use journalist framing as evidence of company posture |
| **Glassdoor / Blind / Levels.fyi** | Stage, weak Working style | Mixed | N/A | ❌ **Low** — sentiment noise, no policy signal |
| **Newsletter sponsorships, event sponsorships** | Geographic remit (weak) | Public | Per event | ❌ **Low** |
| **Job postings the company publishes** | Stage, Team style, Geographic remit (location), Policy area scope (JD content) | Public | Continuous | ✅ **Medium** — surprisingly high signal for *what the team is becoming*, low for *what it has done* |
| **Academic publications co-authored with company affiliation** | Policy area scope, Team style (writing-led) | Mostly open (arXiv) | Per paper | ✅ **Medium-high** for technical-policy teams |
| **Court filings, amicus briefs** (esp. US AI copyright cases, EU AI Act litigation) | Policy posture, Policy area scope | Public via PACER / CURIA | Per case | ✅ **Medium** — rare but extremely high signal when present |

---

## Recommendation: what v0.6 should ingest

**Ingest (5 types):**
1. **Regulatory consultation submissions** — the single highest signal type. UK gov consultations + EU Commission feedback portal + NIST RFIs. Look back 18 months.
2. **Named-author blog posts from the company's policy/safety section** — most companies have a `/policy/`, `/news/`, or dedicated team blog. Filter to posts with at least one team-author byline.
3. **Responsible-scaling / frontier-safety policies + model cards** — only relevant for frontier labs (Anthropic, OpenAI, GDM, Meta, xAI), but where present they are by far the most structured posture signal.
4. **Parliamentary / congressional written evidence + hearing transcripts** — slow to refresh but very high-signal-per-document; UK Hansard and committee inquiry pages are well-structured.
5. **Lobbying register filings (US LDA + EU TR)** — cheap to ingest (CSV/JSON), great for separating "writes about policy" from "actually lobbies on policy." UK register is thin enough that I'd treat it as nice-to-have.

**Defer (4 types):** podcast transcripts (need a transcription pipeline), academic publications (need disambiguation of company affiliation), op-eds (mixed paywalls, need source-by-source rules), job postings (signal exists but noisy and biased toward future-state).

**Never (4 types):** press releases, LinkedIn posts, Glassdoor/Blind, news articles as primary evidence of *company posture* (only as event/stage signal).

### Recency policy
- **Consultation submissions, hearings, policies:** 18 months. Older is fine if it's the most recent of its kind from that team — i.e. *staleness is a signal*, not a disqualifier.
- **Blog posts / essays:** 12 months for "what they think now"; older for "track record."
- **Lobbying filings:** last 4 quarters (US LDA) / current TR snapshot (EU).
- **Frontier safety policies:** always use latest version; ingest version history if available (deltas are themselves a signal).
- **General rule:** "last public output regardless of date" is the right fallback. A team that hasn't published in 24 months **is itself the answer** to "what's their working style."

---

## Practitioner mental model (how AI policy people actually evaluate companies)

**First pass — "is this a real policy team, or a comms function with a fancy title?"** Practitioners open the company's policy/safety page, scan for *bylined* posts that contain *defended claims* rather than announcements, and check whether anyone there has filed a consultation submission, given written evidence to a committee, or published a position paper they had to argue with regulators about. A team whose entire public footprint is press releases and event panels is a comms team. A team whose footprint is consultation responses, RSP versioning, and named long-form posts is a policy team. This sort gets you 60% of the answer in 15 minutes.

**Second pass — "what's the actual remit and posture?"** Practitioners then read 2-3 of the most recent substantive outputs end-to-end. The remit question (UK-only vs multi-jurisdiction, frontier vs sectoral, safety vs governance vs ethics) becomes obvious from *which consultations the team chooses to respond to* and *which committees they appear before*. The posture question (frontier-defining vs compliance-maintaining) becomes obvious from *whether their outputs propose new frameworks or describe how they meet existing ones*. Lobbying filings cross-check this: a team that writes elegant safety essays but whose LDA filings show purely defensive issue codes is performing one job in public and another in DC.

**Third pass — "would I enjoy working with these specific humans?"** Practitioners look up the named authors on Google Scholar, personal blogs, podcast appearances, and Twitter. This is where podcasts and op-eds earn their keep — not for company-level signal but for *individual* style. Are they curious or defensive? Do they engage with critics? Do they write things their CEO might find uncomfortable, or only things that polish the brand? This pass is necessarily slower and more subjective; the v0.6 engine should *surface evidence for it*, not try to score it.

**The meta-frame:** practitioners trust evidence in proportion to **how costly it was for the team to produce**. A consultation submission costs legal-review hours and creates a paper trail regulators will hold against you. A blog post costs author hours and editorial review. A press release costs a comms manager an afternoon. A LinkedIn post costs five minutes. Signal scales with cost. lobbycat's v0.6 should weight evidence the same way.

---

## Honest limits

- **Web search noise is severe.** Generic queries about "AI policy team outputs" return SEO-driven law-firm explainers far more than primary sources. The scoring engine should fetch from a curated source list (gov.uk consultation pages, EC have-your-say portal, NIST.gov, company /policy/ paths, Hansard, ORCL, LDA database, EU Transparency Register) rather than open web search.
- **The hardest frame to source publicly is *team style* (set-the-frontier vs execute-playbook).** Best proxies are RSP/frontier-policy presence, frequency of *new* framework proposals vs *response-to-others'-frameworks*, and whether team members publish under their own names or only behind the company brand. None of these are clean.
- **Stage of company is the easiest frame to source** (Crunchbase, headcount on LinkedIn, news of fundraising) but also the lowest-signal for whether the job is good — a 30-person Series A and a 3000-person lab can both be excellent or terrible places to do policy work.
- **Geographic remit can be misleading.** Many UK-headquartered teams do mostly EU work; many "global" teams are 80% US-focused. The honest measure is *which jurisdictions' consultation responses they file* and *which committees they appear before*, not where the office is.
- **Frontier vs compliance posture is a spectrum, not a binary.** The scoring engine should cite evidence for both ends rather than label a company.

---

## Suggested v0.6 ingestion plumbing (sketch)

1. **Per-company seed list:** policy page URL, lobbying register IDs (LDA ID, EU TR ID), team-author names.
2. **Pull jobs (weekly):** company `/policy/` & `/news/` RSS; UK consultation portal by company name; EU have-your-say feedback by org; LDA quarterly filings for that registrant; NIST RFI responses.
3. **Pull jobs (monthly):** parliamentary committee written-evidence pages for that company name; arXiv affiliations.
4. **Pull jobs (per release):** model cards and frontier-safety policy version diffs for frontier labs.
5. **Per evidence item, store:** url, fetched_at, published_at, authors[], document_type, jurisdiction, frames_relevant[], cost_tier (consultation/policy > bylined-essay > blog > release > social), free-text snippet for LLM citation.
6. **Scoring prompt:** force the LLM to cite at least one `cost_tier ≥ bylined-essay` item per frame score, or explicitly say "no high-cost evidence found, falling back to lower-tier signal."

That last constraint is the one that turns v0.6 from "vibes scoring" into "cited scoring." Worth gating the release on it.

---

*Memo by Lotus 🪷 for Fatima / lobbycat. Honest about its limits; cite back if disputed.*
