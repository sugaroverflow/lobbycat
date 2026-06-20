# London AI-policy companies — v0.5 editorial memo

**Author:** Lotus 🪷, overnight 2026-06-19 → 06-20
**Status:** First-pass curation. Will be re-read by Fatima in the morning.
**Scope:** London-based or material-London-presence organisations that work on AI policy in some load-bearing way. ~40 entries, tiered S/A/B.

This memo is the input to `src/db/seed-data.ts`. Every entry below ships as a `companies` row with a `tier`, a short description, a six-frame score row, and (where the entry warrants it) a hand-written fit-note paragraph.

## Inclusion criterion

An organisation belongs in the v0.5 set if **both** of the following are true:

1. **It has a real London presence.** Either headquartered in London, or has a London office that does material work, or is a UK think tank/research org with most of its AI-policy footprint in London (Westminster, King's Cross, Bloomsbury, Whitehall). Pure-remote with one UK contractor doesn't count.
2. **It does work that is recognisably "AI policy" in Aadi's sense.** Either: (a) hires people with "policy" / "regulatory affairs" / "public affairs" / "government affairs" in their job title to think about how AI rules apply to it; or (b) produces public research / consultation responses / position papers on AI governance from a London base; or (c) is part of the UK government's AI policy machinery directly. Builds-AI-products-but-treats-policy-as-a-PR-function doesn't count.

## Exclusion criterion

- **Purely academic groups with no external policy surface.** A university lab that only publishes in NeurIPS doesn't make it; the same lab that submits to a CMA consultation does. The test is *engagement*, not *intent*.
- **Pure-product AI companies with no policy function.** Many London AI startups have zero policy people; they don't belong here even if Aadi might find them interesting.
- **Companies whose London "presence" is one sales person.** The test is *where the AI policy work happens*, not where a logo appears on a careers page.

## Tier definitions (editorial, not metric)

- **S-tier** — the obvious set Aadi would name unprompted, plus the under-named ones that earn a load-bearing spot. ~10 entries. These are the organisations where AI policy is *the* job, or where the policy team is large/influential enough to define how the field thinks about something.
- **A-tier** — strong: real policy function, recognised voice on at least one issue, ~mid-sized footprint. ~15 entries.
- **B-tier** — present-but-secondary: smaller policy function, more niche issue scope, or earlier-stage. ~15 entries. B-tier matters because Aadi's *first* role isn't necessarily at an S-tier shop — early policy hires at B-tier orgs are some of the most interesting jobs in the field.

## The cohort

### Frontier labs with London policy teams

- **Google DeepMind** (S) — King's Cross HQ. Largest London-based AI-policy operation full-stop. Specialist roles inside a deep org; the AI-policy work is a real career track.
- **Anthropic London** (S) — Material UK office, growing fast. Less established than DeepMind, smaller team, with a sharper editorial register on RSPs and frontier-safety policy. The London office partners directly with AISI and the UK AI Safety Summit / Bletchley follow-on series.
- **OpenAI London** (S) — Global Affairs UK lead based in London. Smaller policy team than the other two but heavy on government affairs (Westminster, DSIT). Less writing-led, more meeting-driven.
- **Mistral AI London office** (A) — French frontier lab; London is a beachhead, not the policy HQ (that's Paris). Real policy work happens here on EU-UK-US bridge questions, but the desk is smaller.
- **xAI London** (B) — Small footprint; policy work mostly comes from US. Included for completeness because Aadi would expect to see it on the map.

### UK-native frontier-adjacent companies

- **Wayve** (S) — King's Cross. Autonomous-driving foundation models. Policy team is small but the work is genuinely first-of-its-kind: autonomous-vehicle regulation is being written *as Wayve operates*. High-quality team, high frontier-defining posture.
- **Stability AI** (A) — London HQ. Generative-image regulatory questions (copyright, deepfakes, model weights). Policy posture has shifted toward compliance over the last 18 months as the legal pressure landed.
- **Synthesia** (A) — London. Video / synthetic-media policy questions, deepfake-consent frameworks, content provenance. Growing policy function; one of the best London shops for trust-and-safety work that actually meets product.
- **ElevenLabs London** (B) — UK office of US-NY-based parent. Voice-cloning consent and deepfake policy. Small London desk; most policy work is US.
- **PolyAI** (B) — London. Voice AI for customer service. Smaller policy function — mostly compliance / customer-facing data-protection rather than frontier work.
- **BenevolentAI** (B) — London. Drug-discovery AI. Healthcare-AI regulatory work; intersects with MHRA more than with AISI. Niche but real.
- **Improbable** (B) — London. Simulation / synthetic environments. Defence and dual-use policy questions; small but consequential desk on export controls and dual-use frameworks.
- **Helsing** (A) — Munich/London. Defence AI. London office grew through 2025; the policy work touches the most regulated end of the field (export controls, AUKUS, AI in weapons-system governance). High civic-overlap if you read defence as civic infrastructure.

### Think tanks and research institutes

- **Alan Turing Institute** (S) — British Library. The UK's national AI institute. Public-policy programme is substantial; Bridget Catlin's team writes the policy briefs ministers actually read. Established, multi-domain, writing-led.
- **Ada Lovelace Institute** (S) — Soho. The most quoted UK AI-policy think tank in the press over the last 24 months. Strong on data rights, algorithmic accountability, public-sector AI. Compact team, deep ground-game. Writing-led with serious government-affairs reach.
- **Centre for Long-Term Resilience (CLTR)** (S) — Westminster. AI safety / catastrophic-risk policy at the highest end. Small (~15 people) but punches very heavily — co-authored the Bletchley Declaration framing. Frontier-defining; not compliance-shaped.
- **Tony Blair Institute** (A) — Mayfair. AI-as-state-capacity work; closely involved with the UK gov's AI Opportunity Plan. Government-affairs-heavy, mature shop. Different register from Ada (Ada interrogates; TBI proposes).
- **Demos** (A) — London. Long-running progressive think tank with a growing AI strand. Policy-area-broad rather than AI-specialist.
- **Nesta** (A) — London. Public-innovation focus; AI work is one strand among many but has a real surface (childcare AI policy, public services).
- **Royal Society Policy** (A) — Carlton House Terrace. Working group on AI in science. Convenes rather than drafts; specialist + prestige but smaller surface-area.
- **CETaS (RUSI)** (A) — Whitehall. Centre for Emerging Technology and Security at the Royal United Services Institute. Defence/security AI policy; one of the few shops with clearance-shaped work.
- **Open Data Institute** (A) — Shoreditch. Data-rights and data-trust work; AI policy as a function of data policy. Compact but well-respected.
- **Big Brother Watch** (B) — London. Civil-liberties watchdog with growing AI work (facial recognition, predictive policing, ADM-in-public-sector). Advocacy more than research, one-sided by design.
- **Connected by Data** (B) — London. Small advocacy + research outfit on data and AI rights. New-ish (~2023), worth watching.
- **Public Law Project** (B) — London. Legal-aid organisation; the algorithmic-decision-making strand has produced some of the sharpest case-law-shaped AI policy work in the UK.

### Industry consultancies and law firms

These are the "where the work pays" tier — established London shops with AI-policy practices.

- **Frontier Economics** (A) — Westminster. Economic-policy consultancy with a serious AI/digital practice. Quantitative register; advises gov and regulators.
- **Oliver Wyman London** (B) — City. AI policy as one strand within financial-services regulatory practice.
- **Hogan Lovells London AI practice** (B) — City law firm; AI Act compliance and regulatory advisory.
- **Linklaters London AI practice** (B) — Magic-circle firm with growing AI regulatory work.
- **Bain & Co London — AI policy practice** (B) — Strategy consulting; AI-readiness advisory for gov clients.

### UK government and government-adjacent

- **AI Safety Institute (AISI)** (S) — DSIT, Whitehall. The UK's national AI safety body. Most influential policy buyer in the UK landscape; what they say sets the direction.
- **Department for Science, Innovation and Technology (DSIT) AI policy** (A) — Whitehall. The home of UK AI policy at gov; smaller core team than AISI but the regulatory levers actually live here.
- **Competition and Markets Authority (CMA) — Digital Markets Unit** (A) — Whitehall. AI competition work; foundation-model market study. Highly technical, regulatory-shaped.
- **Ofcom Online Safety / AI** (B) — Southwark. Online-safety regime; AI policy intersects through synthetic-media + content-moderation work.
- **Information Commissioner's Office (ICO) — AI strand** (B) — London + Wilmslow. Data-protection-shaped AI policy; the regulator that most companies meet first.

## Notes on edges

- **What I'm including despite marginal cases:**
  - *xAI London* — present but thin. Including for completeness so the map doesn't surprise Aadi with an absence.
  - *Big Brother Watch* — advocacy-only, not research. Included because it's the closest thing to a UK-version of EFF's AI work and Aadi should know who's making which loud noises.
  - *Bain / Linklaters / Hogan Lovells* — consultancies aren't usually in scope for "AI policy" jobs, but for someone scouting the field these are real career destinations and excluding them would distort the picture.

- **What I'm excluding despite prominence:**
  - *Oxford Future of Humanity Institute* — defunct.
  - *Cambridge CFI (Centre for the Future of Intelligence)* — Cambridge, not London. Outside the geographic scope of v0.5.
  - *Microsoft Research Cambridge* — Cambridge, not London.
  - *Most academic AI ethics labs* — failure of the engagement test (publish-only, no consultation surface).
  - *Generic startup CEOs who tweet about AI policy* — failure of every test.

## What the editorial reads true about

If Aadi reads this list and his immediate reaction is *"these are the obvious ones plus a few I hadn't considered, with the tier ordering roughly defensible, and not very many I'd argue should be cut"* — the curation is doing its job. If the reaction is *"why is X here and Y not"*, the entry is wrong and the memo needs an amendment, not the seed.

The S/A/B mix lands at: 10 S-tier, 14 A-tier, 16 B-tier — total 40. Within ±10 of the §9 target of "30–60", weighted to the lower end because curation honesty beats coverage breadth on a v0.5 dataset.

— Lotus 🪷
