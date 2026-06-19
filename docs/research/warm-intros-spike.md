# Warm-Intros Feasibility Memo (v0.5 spike)

_Author: Lotus 🪷 (research sub-agent)_
_Date: 2026-06-19_
_For: Aadi Kulkarni — AI-policy job search across the 30 seeded companies in `src/db/seed-data.ts`_

## TL;DR

A "find me a warm intro at every seeded company" feature is technically buildable but **the LinkedIn-shaped fantasy is dead** for indie projects: LinkedIn's free developer programme will get you sign-in + the logged-in user's own basic profile, and absolutely nothing about their connection graph. Real graph traversal requires either (a) paid third-party data (Proxycurl / PDL / Apollo — $0.01–$0.28 per profile, ToS-grey), (b) Sales Navigator–tier enterprise contracts, or (c) the user manually exporting their `Connections.csv` from LinkedIn's GDPR data export. **For an AI-*policy* job hunt, however, the LinkedIn graph is not actually the highest-signal data** — EU Transparency Register meeting logs, UK ORCL filings, US LDA disclosures, conference speaker pages, and OpenAlex coauthorship are all free, public, and tell you exactly who at Anthropic/OpenAI/Mistral/etc. has been in the room with which regulator. v0.5 should lean into that asymmetric advantage, not pretend to be a LinkedIn-graph product.

## A) What's actually possible — one paragraph

LinkedIn's official APIs in 2026 are tightly gated: the free "Sign In with LinkedIn using OpenID Connect" product gives you the authenticated user's `name`, `email`, `picture`, `sub` — full stop. There is **no public, official endpoint to read someone's connections, search profiles, or traverse a 2nd-degree graph** unless you are a Talent/Sales Navigator enterprise customer (mid-five-figures/yr minimum, application gated). Third-party LinkedIn-shaped APIs (Proxycurl, PeopleDataLabs, Apollo.io, RocketReach) sell scraped/aggregated profile data starting at ~$49/mo / $0.02–$0.28 per profile — usable for "given a name + company, return a likely LinkedIn URL and job history", but they explicitly do **not** give you Aadi's connection graph. The hiQ v. LinkedIn ruling means scraping public profiles is not a CFAA crime, but LinkedIn still actively sues scrapers under breach-of-contract and Computer Fraud, so building on scraped data is a long-term liability. **The pragmatic v0.5 path**: (1) "Sign in with LinkedIn" for identity + let Aadi paste his connections export; (2) pull policy-people-at-target-companies from free public sources (Transparency Register, ORCL, LDA, conference speakers, OpenAlex); (3) intersect (1) ∩ (2) to produce concrete warm-intro candidates and shared-context notes.

## B) Options table

| Option | One-line | Cost | Feasibility (1–5) | Data quality for *policy* warm intros | ToS risk |
|---|---|---:|---:|---|---|
| LinkedIn official API (free dev app) | OpenID Connect: own profile only | $0 | 5 | 0 (no graph at all) | None |
| LinkedIn Talent/Sales Nav API | Real CRM-grade access | $$$$ (~$10k+/yr, gated approval) | 1 | High but irrelevant scope | None |
| Proxycurl | "LinkedIn-as-API" via scraped index | $49/mo for 2,500 credits; ~$0.02/lookup | 4 | Medium — gives roles + tenure, no edges | Medium (LinkedIn hostile, but Proxycurl absorbs risk) |
| PeopleDataLabs | Person enrichment, big DB | $0.20–$0.28/credit, no free tier | 3 | Medium — same shape as Proxycurl | Medium |
| Apollo.io free tier | 60 credits/mo on free plan, GUI-first | Free → $59/user/mo | 3 | Medium — strongest at B2B emails | Medium |
| Clearbit/RocketReach | Email-finder centric | $$ ($99+/mo) | 3 | Low for policy | Medium |
| LinkedIn GDPR `Connections.csv` export | User downloads their own graph | $0 | 5 | High — Aadi's actual 1st-degree | None (it's his data) |
| **EU Transparency Register** | Public lobbying meetings w/ Commission, MEPs, cabinets | $0 | 5 | **Very high** for EU AI Act / GPAI work | None |
| **UK ORCL** | Quarterly consultant-lobbyist register | $0 (CSV/search) | 4 | Medium — narrow scope (consultants only) | None |
| US LDA / OpenSecrets | Federal lobbying disclosures | $0 | 4 | High for OpenAI/Anthropic/xAI/Scale DC work | None |
| Conference speaker pages | Eurofi, IAPP GPS, RightsCon, NIST AISI workshops, FAccT, AI Safety Summit reports | $0 | 4 (scrape + parse) | **Very high** — names the actual humans | None |
| OpenAlex coauthorship | Free academic graph API | $0 (polite pool) | 5 | Medium-high for DeepMind/Anthropic/PI/Sakana research-policy folks | None |
| GitHub follower graph | REST API, generous limits | $0 | 5 | Low for pure-policy, useful for technical-policy (HF, Mistral, BFL) | None |
| Crossref / ORCID | DOI + author IDs | $0 | 5 | Medium — same shape as OpenAlex | None |

## C) Recommendation for v0.5

Build the **"hybrid public-graph"** feature, not the LinkedIn-graph feature.

### What v0.5 ships

1. **"Connect your LinkedIn" = identity + manual graph upload.**
   - Add "Sign in with LinkedIn using OpenID Connect" (90 min — it's just NextAuth's `LinkedInProvider` with `profile email openid` scopes).
   - Add a `/about` upload widget: *"Drop your LinkedIn `Connections.csv` here (Settings → Data Privacy → Get a copy of your data → Connections only — usually 10-minute turnaround from LinkedIn)."* Parse → store names + companies + (optional) positions per user.
   - **No paid third-party API.** No scraping. ToS-clean.

2. **Policy-people index per seeded company.** A new `company_policy_contacts` table populated by a daily/weekly cron from free public sources:
   - **EU Transparency Register** — scrape/parse the public meeting feed for each registered seed company (Anthropic, OpenAI, Mistral, DeepMind, Hugging Face, ElevenLabs, Helsing, DeepL all listed). Capture: name of person met, EU side counterpart, date, topic.
   - **UK ORCL** — quarterly CSV; cross-ref against seeds.
   - **US LDA quarterly filings** via OpenSecrets / Senate LDA bulk download — pull "lobbyists" field for each seed company.
   - **Conference speakers** — curated list of high-signal events (Eurofi, IAPP GPS, NIST AISI workshops, RightsCon, AI Safety Summit / Bletchley follow-ups, FAccT, NeurIPS policy workshop). One-off scraper per event, run yearly. Map company affiliations.
   - **OpenAlex** — for each seed company with a ROR / institutional ID, fetch authors with policy-flavoured keywords ("governance", "policy", "regulation", "alignment policy") in recent works.

3. **The "warm intro" join.** On the company detail page, render three stacked panels:
   - **🤝 People you both know** — names where `aadis_connections.name` appears in `company_policy_contacts` *or* where a 2nd-degree path is inferable from coauthorship/speaker co-panel data (e.g. "you co-authored a 2024 paper with X, who co-authored with Y who is now at Anthropic Policy").
   - **🏛️ Who they send to Brussels/DC/London** — list of named humans from public lobby registers, with last-meeting date and topic. Even when there's no warm intro, this is gold: "Anthropic's GPAI lobbying lead in EU is Jane Doe (3 Commission meetings in 2025 on systemic-risk frameworks)" tells Aadi exactly who to email cold.
   - **🎤 Where they show up** — recent conference panels with named speakers from the company.

4. **Honest UX about limits.** No "we found 47 connections!" theater. Each row cites its source URL. If we have zero signal, we say so.

### What v0.5 explicitly does NOT do

- ❌ Pay for Proxycurl/PDL/Apollo. Revisit at v0.7 if Aadi finds the manual export friction kills the feature.
- ❌ Scrape LinkedIn directly. ToS + legal liability is not worth it for a personal job-search tool.
- ❌ Pretend to a connection graph we don't have.

### Realistic time estimate

| Sub-feature | Hours |
|---|---:|
| NextAuth LinkedIn OIDC sign-in | 1.5 |
| Connections.csv upload + parser + storage | 3 |
| EU Transparency Register scraper + parser (handles all 30 in one job) | 5 |
| UK ORCL CSV importer | 1.5 |
| US LDA quarterly importer (Senate bulk XML) | 4 |
| Conference-speaker curated importer (5 events, hand-written extractors) | 6 |
| OpenAlex coauthorship enrichment for ~12 seeds | 3 |
| `company_policy_contacts` schema + Drizzle migration | 1 |
| Company-page UI: three stacked panels + citation chips | 4 |
| Cron wiring + dedup + tests | 3 |
| **Total** | **~32 hrs** ≈ **4 focused days** |

This fits a single v0.5 release. Cost: **$0 in API spend** and **zero ToS exposure** — the only thing Aadi has to do is one ~10-minute GDPR export from LinkedIn.

### Why this is actually *better* than the LinkedIn-graph version

For a generic recruiter tool, LinkedIn's graph is unbeatable. For an **AI-policy job hunt at named frontier labs**, the LinkedIn graph would mostly surface "you both went to UCL" — true but useless. The Transparency Register tells you the lab's *actual* policy operator just sat across from DG CNECT on Article 51 GPAI rules last Tuesday — *that's* the warm-intro lead, even cold. Lobbycat already differentiates on a curated, opinionated take; this feature should too.

### Open risks / things I'm not sure about

- The EU Transparency Register's machine-readable feeds have been reshaped a couple of times; the scraper will need a unit test against fixtures and a "told-you-so" alert when the structure changes.
- US LDA bulk XML is large (~hundreds of MB/quarter); we only need the slice mentioning our 30 seeds, so a streaming filter is essential.
- "Sign in with LinkedIn" may require LinkedIn dev-app review if we go past localhost — usually 1–3 business days.
- Conference speaker scraping is per-event bespoke. Starting with 5 high-signal events is right; resist scope creep until Aadi tells us which are actually paying off.

---

_Sources consulted (high-signal subset)_: LinkedIn Developer Docs (OpenID Connect product), Microsoft Learn LinkedIn integration guide, Proxycurl pricing/docs (`nubela.co`), People Data Labs person pricing, Apollo.io API docs, Ninth Circuit hiQ v. LinkedIn (CalLawyers.org summary + IAPP analysis), EU Commission Transparency Register portal, Transparency International EU "Integrity Watch", UK Office of the Registrar of Consultant Lobbyists, OpenAlex developer docs.
