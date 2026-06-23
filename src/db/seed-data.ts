/**
 * Seed data — v0.5 London curation.
 *
 * Editorial set of London-based AI-policy organisations: frontier labs with
 * London offices, UK-native AI companies with real policy functions, AI
 * think tanks and research institutes, industry consultancies, and the
 * government-adjacent regulators that actually make UK AI policy.
 *
 * Source memo: /research/london-companies.md (first-pass curation).
 *
 * Tiers (editorial, not metric):
 *   1 = S-tier — obvious + load-bearing, ~10 entries
 *   2 = A-tier — strong, real footprint, ~14 entries
 *   3 = B-tier — present-but-secondary, smaller surface, ~16 entries
 */

export type SeedCompany = {
  slug: string;
  name: string;
  tier: 1 | 2 | 3;
  hq: string;
  websiteUrl: string;
  careersUrl?: string;
  policyPageUrl?: string;
  rolesSource?: "greenhouse" | "lever" | "ashby" | "custom";
  rolesSourceId?: string;
  blogRssUrl?: string;
  pressRssUrl?: string;
  focusAreas: string[];
  description: string;
  tags: string[];
  roles?: Array<{
    title: string;
    location: string;
    url: string;
    source?: string;
  }>;
  people?: Array<{
    name: string;
    role: string;
    seniority?: "lead" | "senior" | "mid" | "junior" | "unknown";
    bioUrl?: string;
    linkedinUrl?: string;
  }>;
};

/* ------------------------------------------------------------------ */
/* Tags (v0.5 — simplified)                                           */
/* ------------------------------------------------------------------ */

export const seedTags = [
  { label: "Frontier lab", color: "#4D8DFF" },
  { label: "UK-native", color: "#6FE0E8" },
  { label: "Think tank", color: "#F2EAD8" },
  { label: "Government", color: "#FF8C73" },
  { label: "Consultancy", color: "#F2EAD8" },
  { label: "Law firm", color: "#F2EAD8" },
  { label: "Advocacy", color: "#FF8C73" },
  { label: "Defence/security", color: "#FF8C73" },
  { label: "Hiring policy lead", color: "#4D8DFF" },
  { label: "First policy hire", color: "#6FE0E8" },
  { label: "Established team", color: "#F2EAD8" },
];

/* ------------------------------------------------------------------ */
/* Frames (v0.5 — the six)                                            */
/* ------------------------------------------------------------------ */

export const seedFrames = [
  {
    name: "Geographic remit",
    description:
      "What the company's policy work covers, not where it sits. Does the London team only engage UK regulators, or does the same desk work across EU, US, and international forums?",
    scale: 5,
    lowLabel: "UK-only policy remit",
    highLabel: "Multi-jurisdiction policy remit",
    lowDescription:
      "London-based team whose policy surface stops at the UK border — CMA, AISI, OFCOM, gov.uk consultations.",
    highDescription:
      "London office that's one node in a multi-jurisdiction policy operation — EU AI Office, NIST, international forums all on the same calendar.",
    sortIndex: 0,
  },
  {
    name: "Policy area scope",
    description:
      "How wide the company's policy surface is. Single-issue specialists go deep on one fight; broad shops touch everything from compute export controls to age-appropriate design.",
    scale: 5,
    lowLabel: "Single-issue specialist",
    highLabel: "Broad multi-domain",
    lowDescription:
      "Picked one fight (model evaluations, copyright, open weights) and gone deep.",
    highDescription:
      "Touches compute export controls, public-sector procurement, age-appropriate design, content provenance, more — accepts being shallower in any one area.",
    sortIndex: 1,
  },
  {
    name: "Stage of company",
    description:
      "Where the company sits on the maturity curve — funding, headcount, product-in-market, regulatory footprint. Not a quality signal; an axis of the kind of work.",
    scale: 5,
    lowLabel: "Pre-product",
    highLabel: "Established",
    lowDescription:
      "Six people in a WeWork with a Stripe account and a strong opinion.",
    highDescription:
      "Global comms team, regulatory affairs function, a seat at the table when AISI calls a meeting.",
    sortIndex: 2,
  },
  {
    name: "Policy posture",
    description:
      "Whether the company is writing the rules of the game or playing the existing ones well. The two ends look similar from outside; the day-to-day work could not differ more.",
    scale: 5,
    lowLabel: "Frontier-defining",
    highLabel: "Compliance-maintaining",
    lowDescription:
      "Publishes Responsible Scaling Policies, drafts model cards before anyone asks, shows up to consultations with new frameworks.",
    highDescription:
      "Mature compliance function, reads every new statutory instrument carefully, competes on doing the known thing reliably.",
    sortIndex: 3,
  },
  {
    name: "Working style",
    description:
      "How the policy team spends its hours. Writing-led shops produce long-form posts and position papers; government affairs shops do Westminster meetings and coalition work.",
    scale: 5,
    lowLabel: "Writing-led",
    highLabel: "Government affairs-led",
    lowDescription:
      "Long-form public posts, position papers, technical reports, blog essays other people quote.",
    highDescription:
      "Westminster meetings, briefings to officials, coalition work, off-the-record conversations that show up in regulation months later.",
    sortIndex: 4,
  },
  {
    name: "Team style",
    description:
      "Whether the team is figuring out what good looks like as they go, or executing a known playbook well. Related to Policy posture but distinct — about what a Monday morning feels like.",
    scale: 5,
    lowLabel: "Set the frontier",
    highLabel: "Execute the playbook",
    lowDescription:
      "Small team building the practice from scratch — no template, lots of judgement calls, two-year feedback loops.",
    highDescription:
      "Clear set of plays, run them tightly, measured on consistency rather than novelty.",
    sortIndex: 5,
  },
];

/* ------------------------------------------------------------------ */
/* Companies — London AI-policy curation                              */
/* ------------------------------------------------------------------ */

export const seedCompanies: SeedCompany[] = [
  /* ----------------- S-TIER (1) — ~10 ------------------------------ */
  {
    slug: "google-deepmind",
    name: "Google DeepMind",
    tier: 1,
    hq: "London (King's Cross)",
    websiteUrl: "https://deepmind.google",
    careersUrl: "https://deepmind.google/careers/",
    policyPageUrl: "https://deepmind.google/about/",
    blogRssUrl: "https://deepmind.google/blog/rss.xml",
    focusAreas: [
      "frontier safety",
      "AI governance",
      "international AI cooperation",
      "responsible AI",
    ],
    description:
      "London's biggest AI-policy operation by headcount. Inside a Big Tech parent (Google), which shapes the work — the policy function is established, specialist, and reaches across DSIT, AISI, EU AI Office, NIST in parallel. If you want a deep org with multiple career tracks inside the policy function, this is the floor.",
    tags: ["Frontier lab", "Established team", "Hiring policy lead"],
  },
  {
    slug: "anthropic-london",
    name: "Anthropic (London)",
    tier: 1,
    hq: "London",
    websiteUrl: "https://www.anthropic.com",
    careersUrl: "https://www.anthropic.com/careers",
    policyPageUrl: "https://www.anthropic.com/policy",
    rolesSource: "greenhouse",
    rolesSourceId: "anthropic",
    blogRssUrl: "https://www.anthropic.com/news/rss.xml",
    focusAreas: [
      "frontier safety policy",
      "Responsible Scaling Policy",
      "UK AISI partnership",
      "EU AI Act",
    ],
    description:
      "The London office that partners directly with AISI on frontier-model evaluations. Smaller policy desk than DeepMind, sharper editorial register — Responsible Scaling Policies, public reasoning about frontier risk, model cards before anyone asks. Frontier-defining; writing-led with growing government affairs.",
    tags: ["Frontier lab", "Hiring policy lead", "Established team"],
  },
  {
    slug: "openai-london",
    name: "OpenAI (London)",
    tier: 1,
    hq: "London",
    websiteUrl: "https://openai.com",
    careersUrl: "https://openai.com/careers/",
    policyPageUrl: "https://openai.com/news/global-affairs/",
    blogRssUrl: "https://openai.com/blog/rss.xml",
    focusAreas: [
      "global affairs",
      "UK AI policy",
      "EU AI Act",
      "national security",
    ],
    description:
      "Global Affairs UK lead based in London. Smaller than DeepMind or Anthropic on the policy side but heavily Westminster-shaped — government affairs and partnerships, less long-form public writing. The shop to learn government-affairs craft at frontier-lab scale.",
    tags: ["Frontier lab", "Established team"],
  },
  {
    slug: "wayve",
    name: "Wayve",
    tier: 1,
    hq: "London (King's Cross)",
    websiteUrl: "https://wayve.ai",
    careersUrl: "https://wayve.ai/careers/",
    focusAreas: [
      "autonomous vehicle regulation",
      "embodied AI policy",
      "transport safety",
    ],
    description:
      "King's Cross-based autonomous-driving foundation-model company. Policy team is small but the work is genuinely first-of-its-kind — AV regulation is being written as Wayve operates, with DfT and the Automated Vehicles Act as the live policy surface. Frontier-defining; cross-cutting transport + AI safety.",
    tags: ["UK-native", "Hiring policy lead", "First policy hire"],
  },
  {
    slug: "alan-turing-institute",
    name: "Alan Turing Institute",
    tier: 1,
    hq: "London (British Library)",
    websiteUrl: "https://www.turing.ac.uk",
    careersUrl: "https://www.turing.ac.uk/work-turing",
    focusAreas: [
      "AI public policy",
      "data ethics",
      "public-sector AI",
      "AI standards",
    ],
    description:
      "The UK's national AI institute. Public policy programme writes the briefs ministers actually read. Established, multi-domain, mostly writing-led with serious convening power. Mature playbook on consultation responses; less about defining brand-new positions than carrying them through to policy.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "ada-lovelace-institute",
    name: "Ada Lovelace Institute",
    tier: 1,
    hq: "London (Soho)",
    websiteUrl: "https://www.adalovelaceinstitute.org",
    careersUrl: "https://www.adalovelaceinstitute.org/about/working-at-ada/",
    focusAreas: [
      "algorithmic accountability",
      "data rights",
      "public-sector AI",
      "AI assurance",
    ],
    description:
      "Most quoted UK AI think tank in the press over the last two years. Compact team, deep ground game. Strong on data rights, algorithmic accountability, and AI in the public sector. Writing-led with serious government-affairs reach — Ada interrogates where TBI proposes.",
    tags: ["Think tank", "Hiring policy lead", "Established team"],
  },
  {
    slug: "cltr",
    name: "Centre for Long-Term Resilience (CLTR)",
    tier: 1,
    hq: "London (Westminster)",
    websiteUrl: "https://www.longtermresilience.org",
    careersUrl: "https://www.longtermresilience.org/jobs",
    focusAreas: [
      "AI safety policy",
      "catastrophic risk",
      "frontier governance",
      "Bletchley Declaration follow-on",
    ],
    description:
      "~15-person Westminster shop punching far above its weight on AI safety and catastrophic-risk policy. Co-authored the Bletchley Declaration framing. Frontier-defining; small team setting the frontier, very much not executing a known playbook.",
    tags: ["Think tank", "First policy hire", "Hiring policy lead"],
  },
  {
    slug: "aisi",
    name: "AI Safety Institute (AISI)",
    tier: 1,
    hq: "London (Whitehall)",
    websiteUrl: "https://www.aisi.gov.uk",
    careersUrl: "https://www.aisi.gov.uk/careers",
    focusAreas: [
      "frontier model evaluations",
      "AI safety standards",
      "national security",
      "international AI coordination",
    ],
    description:
      "The UK's national AI safety body, inside DSIT. Most influential policy buyer in the UK landscape — what AISI says sets the direction the market moves in. Frontier-defining at gov scale; growing fast, with technical and policy tracks side by side. The single highest-leverage AI policy desk in the country.",
    tags: ["Government", "Hiring policy lead", "Established team"],
  },
  {
    slug: "dsit-ai-policy",
    name: "DSIT — AI Policy Directorate",
    tier: 1,
    hq: "London (Whitehall)",
    websiteUrl: "https://www.gov.uk/government/organisations/department-for-science-innovation-and-technology",
    focusAreas: [
      "UK AI strategy",
      "AI regulation framework",
      "AI Opportunity Plan",
      "international AI",
    ],
    description:
      "Whitehall home of UK AI policy. Smaller core team than AISI but the regulatory levers live here. Mature government-affairs shop by design — policy is *made* here in the formal sense. The Westminster job, with the calendar that comes with it.",
    tags: ["Government", "Established team"],
  },
  {
    slug: "tbi",
    name: "Tony Blair Institute",
    tier: 1,
    hq: "London (Mayfair)",
    websiteUrl: "https://www.institute.global",
    careersUrl: "https://www.institute.global/careers",
    focusAreas: [
      "AI for state capacity",
      "AI Opportunity Plan",
      "public services AI",
      "international AI",
    ],
    description:
      "AI-as-state-capacity work; closely involved with the AI Opportunity Plan. Government-affairs heavy, mature shop, broad policy scope. Different register from Ada — TBI proposes the next state move; Ada audits the current one.",
    tags: ["Think tank", "Established team"],
  },

  /* ----------------- A-TIER (2) — ~14 ------------------------------ */
  {
    slug: "mistral-london",
    name: "Mistral AI (London office)",
    tier: 2,
    hq: "Paris HQ · London office",
    websiteUrl: "https://mistral.ai",
    careersUrl: "https://jobs.lever.co/mistral",
    rolesSource: "lever",
    rolesSourceId: "mistral",
    focusAreas: ["open weights policy", "EU AI Act", "UK-EU bridge"],
    description:
      "French frontier lab; London is a beachhead, not the policy HQ (Paris). Real policy work happens here on EU-UK-US bridge questions, but the team is smaller. Open-weights advocacy is the editorial signature.",
    tags: ["Frontier lab"],
  },
  {
    slug: "stability-ai",
    name: "Stability AI",
    tier: 2,
    hq: "London",
    websiteUrl: "https://stability.ai",
    careersUrl: "https://stability.ai/careers",
    focusAreas: [
      "generative-image regulation",
      "copyright",
      "model weights policy",
    ],
    description:
      "London-HQ generative-image foundation-model company. Policy posture shifted toward compliance over the last 18 months as legal pressure landed (Getty case, copyright suits). Smaller policy desk; mature playbook on dealing with formal complaints.",
    tags: ["UK-native"],
  },
  {
    slug: "synthesia",
    name: "Synthesia",
    tier: 2,
    hq: "London",
    websiteUrl: "https://www.synthesia.io",
    careersUrl: "https://www.synthesia.io/careers",
    focusAreas: [
      "synthetic media policy",
      "deepfake consent",
      "content provenance",
      "trust & safety",
    ],
    description:
      "London-HQ video synthesis. Growing policy function; one of the best London shops where trust-and-safety policy actually meets product. Consent frameworks, content provenance, deepfake mitigations — frontier-shaped work with a real shipping cadence.",
    tags: ["UK-native", "Hiring policy lead"],
  },
  {
    slug: "helsing",
    name: "Helsing",
    tier: 2,
    hq: "Munich · London",
    websiteUrl: "https://helsing.ai",
    careersUrl: "https://helsing.ai/jobs",
    focusAreas: [
      "defence AI policy",
      "export controls",
      "dual-use frameworks",
      "AUKUS",
    ],
    description:
      "Defence AI; London office grew through 2025. Policy work touches the most regulated end of the field — export controls, AUKUS, AI in weapons-system governance. High civic-overlap if you read defence as civic infrastructure. Not for everyone; a real career destination for the people it is for.",
    tags: ["Defence/security", "Established team"],
  },
  {
    slug: "demos",
    name: "Demos",
    tier: 2,
    hq: "London",
    websiteUrl: "https://demos.co.uk",
    careersUrl: "https://demos.co.uk/jobs/",
    focusAreas: ["AI in public services", "data rights", "digital democracy"],
    description:
      "Long-running progressive think tank with a growing AI strand. Policy-area broad rather than AI-specialist; AI work sits inside wider conversations about public services and democratic infrastructure. Solid mid-sized shop, established playbook.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "nesta",
    name: "Nesta",
    tier: 2,
    hq: "London",
    websiteUrl: "https://www.nesta.org.uk",
    careersUrl: "https://www.nesta.org.uk/about-us/work-with-us/",
    focusAreas: [
      "public innovation",
      "AI in early years / childcare",
      "AI in public services",
    ],
    description:
      "Public-innovation focus; AI work is one strand among many but has a real surface (childcare AI, public services, early-years tech). Mature shop, mostly writing-led with a policy-influencing tail.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "royal-society-policy",
    name: "Royal Society — Policy",
    tier: 2,
    hq: "London (Carlton House Terrace)",
    websiteUrl: "https://royalsociety.org/topics-policy/",
    focusAreas: [
      "AI in science",
      "data and AI policy",
      "research-systems policy",
    ],
    description:
      "Working group on AI in science. Convenes rather than drafts; specialist + prestige but smaller surface. The kind of policy work that ends up cited rather than the kind that ends up implemented.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "cetas",
    name: "CETaS (RUSI)",
    tier: 2,
    hq: "London (Whitehall)",
    websiteUrl: "https://cetas.turing.ac.uk",
    focusAreas: [
      "security AI policy",
      "AI in national security",
      "AI assurance for defence",
    ],
    description:
      "Centre for Emerging Technology and Security at RUSI (with Turing). Defence/security AI policy. One of the few shops with clearance-shaped work — research surface that lands inside MoD/UK Intelligence Community channels.",
    tags: ["Defence/security", "Think tank"],
  },
  {
    slug: "odi",
    name: "Open Data Institute",
    tier: 2,
    hq: "London (Shoreditch)",
    websiteUrl: "https://theodi.org",
    careersUrl: "https://theodi.org/about-the-odi/jobs/",
    focusAreas: ["data rights", "data trusts", "data and AI policy"],
    description:
      "Data-rights and data-trust work; AI policy as a function of data policy. Compact but well-respected; an older shop than most of the AI-specific ones, with infrastructure-shaped editorial taste.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "frontier-economics",
    name: "Frontier Economics",
    tier: 2,
    hq: "London (Westminster)",
    websiteUrl: "https://www.frontier-economics.com",
    careersUrl: "https://www.frontier-economics.com/uk/en/careers/",
    focusAreas: ["AI competition policy", "digital regulation economics"],
    description:
      "Economic-policy consultancy with a serious AI/digital practice. Quantitative register; advises government and regulators. The shop where you learn to write the kind of memo a CMA economist takes seriously.",
    tags: ["Consultancy", "Established team"],
  },
  {
    slug: "cma-dmu",
    name: "CMA — Digital Markets Unit",
    tier: 2,
    hq: "London (Whitehall)",
    websiteUrl: "https://www.gov.uk/government/organisations/competition-and-markets-authority",
    focusAreas: [
      "AI competition",
      "foundation-model market study",
      "digital markets regulation",
    ],
    description:
      "AI competition work; foundation-model market study (the one that established the live regulatory frame). Highly technical, regulatory-shaped, established team — career civil-service register.",
    tags: ["Government", "Established team"],
  },
  {
    slug: "elevenlabs-london",
    name: "ElevenLabs (London)",
    tier: 2,
    hq: "New York · London office",
    websiteUrl: "https://elevenlabs.io",
    careersUrl: "https://elevenlabs.io/careers",
    focusAreas: ["voice cloning consent", "deepfake policy", "content provenance"],
    description:
      "Voice-AI scale-up; London is a smaller desk than New York. Genuinely novel policy challenges (consent, voice cloning, licensing), most work done from US. Worth tracking because the issues sit at the front of trust-and-safety policy.",
    tags: ["Hiring policy lead", "First policy hire"],
  },
  {
    slug: "ico-ai",
    name: "ICO — AI strand",
    tier: 2,
    hq: "London + Wilmslow",
    websiteUrl: "https://ico.org.uk",
    focusAreas: ["data protection AI", "AI auditing", "ADM regulation"],
    description:
      "Information Commissioner's Office. Data-protection-shaped AI policy; the regulator companies meet first on AI questions. Mature shop, compliance-shaped, established playbook. Interesting if you want a regulator's-eye view of AI before going to a frontier shop.",
    tags: ["Government", "Established team"],
  },
  {
    slug: "ofcom-ai",
    name: "Ofcom — Online Safety / AI",
    tier: 2,
    hq: "London (Southwark)",
    websiteUrl: "https://www.ofcom.org.uk",
    focusAreas: [
      "online safety",
      "synthetic media policy",
      "content moderation",
    ],
    description:
      "Online-safety regime; AI policy intersects through synthetic-media and content-moderation work. Larger Ofcom umbrella means the AI work sits alongside broadcasting and telecoms regulation; established machinery, specialist roles within it.",
    tags: ["Government", "Established team"],
  },

  /* ----------------- B-TIER (3) — ~16 ------------------------------ */
  {
    slug: "xai-london",
    name: "xAI (London)",
    tier: 3,
    hq: "San Francisco · London (small)",
    websiteUrl: "https://x.ai",
    careersUrl: "https://x.ai/careers",
    focusAreas: ["frontier AI"],
    description:
      "Small London footprint; most policy work comes from US. Included for completeness so the map doesn't surprise Aadi with an absence. Treat as a pin, not a destination.",
    tags: ["Frontier lab"],
  },
  {
    slug: "polyai",
    name: "PolyAI",
    tier: 3,
    hq: "London",
    websiteUrl: "https://poly.ai",
    careersUrl: "https://poly.ai/careers/",
    focusAreas: ["voice AI", "customer-service AI compliance"],
    description:
      "London voice AI for customer service. Smaller policy function — mostly compliance and customer-facing data-protection rather than frontier work. The kind of shop where 'policy' means 'GDPR review on a tight deadline'.",
    tags: ["UK-native"],
  },
  {
    slug: "benevolentai",
    name: "BenevolentAI",
    tier: 3,
    hq: "London",
    websiteUrl: "https://www.benevolent.com",
    careersUrl: "https://www.benevolent.com/careers/",
    focusAreas: ["healthcare AI regulation", "MHRA engagement"],
    description:
      "London drug-discovery AI. Healthcare-AI regulatory work; intersects with MHRA more than AISI. Niche but real — a place to do specialist work that doesn't read as 'AI policy' in the frontier-lab sense.",
    tags: ["UK-native"],
  },
  {
    slug: "improbable",
    name: "Improbable",
    tier: 3,
    hq: "London",
    websiteUrl: "https://www.improbable.io",
    careersUrl: "https://www.improbable.io/careers",
    focusAreas: ["simulation policy", "dual-use frameworks", "defence policy"],
    description:
      "Simulation and synthetic environments. Defence and dual-use policy questions; small but consequential desk on export controls and dual-use frameworks. London-native with an older policy-ecosystem footprint than most AI startups.",
    tags: ["UK-native", "Defence/security"],
  },
  {
    slug: "big-brother-watch",
    name: "Big Brother Watch",
    tier: 3,
    hq: "London",
    websiteUrl: "https://bigbrotherwatch.org.uk",
    focusAreas: [
      "facial recognition",
      "predictive policing",
      "ADM in public sector",
    ],
    description:
      "Civil-liberties watchdog with growing AI work. Advocacy more than research; one-sided by design. The UK's closest thing to EFF on AI surveillance issues. Loud, useful, narrow.",
    tags: ["Advocacy"],
  },
  {
    slug: "connected-by-data",
    name: "Connected by Data",
    tier: 3,
    hq: "London",
    websiteUrl: "https://connectedbydata.org",
    focusAreas: ["data rights", "AI policy advocacy"],
    description:
      "Small (~2023) advocacy + research outfit on data and AI rights. Worth watching; not yet a destination but a clear voice in the conversation.",
    tags: ["Advocacy", "First policy hire"],
  },
  {
    slug: "public-law-project",
    name: "Public Law Project",
    tier: 3,
    hq: "London",
    websiteUrl: "https://publiclawproject.org.uk",
    focusAreas: ["ADM in public sector", "algorithmic decision-making law"],
    description:
      "Legal-aid organisation; the algorithmic-decision-making strand has produced some of the sharpest case-law-shaped AI policy work in the UK. Niche but with real bite — judicial reviews land.",
    tags: ["Advocacy"],
  },
  {
    slug: "oliver-wyman-london",
    name: "Oliver Wyman London",
    tier: 3,
    hq: "London (City)",
    websiteUrl: "https://www.oliverwyman.com",
    careersUrl: "https://www.oliverwyman.com/careers.html",
    focusAreas: ["AI in financial services regulation"],
    description:
      "AI policy as one strand within financial-services regulatory practice. Mature consultancy, specialist roles within a deep org. Best as a destination for someone wanting AI policy with a finance flavour.",
    tags: ["Consultancy", "Established team"],
  },
  {
    slug: "hogan-lovells-ai",
    name: "Hogan Lovells — AI practice",
    tier: 3,
    hq: "London (City)",
    websiteUrl: "https://www.hoganlovells.com",
    focusAreas: ["AI Act compliance", "regulatory advisory"],
    description:
      "City law firm; AI Act compliance and regulatory advisory. Mature compliance shop — the kind of work where the playbook is half the value.",
    tags: ["Law firm", "Established team"],
  },
  {
    slug: "linklaters-ai",
    name: "Linklaters — AI practice",
    tier: 3,
    hq: "London (City)",
    websiteUrl: "https://www.linklaters.com",
    focusAreas: ["AI regulation", "data and digital regulation"],
    description:
      "Magic-circle firm with growing AI regulatory work. Slower-moving but very well-resourced; specialist roles inside a long-tenured org.",
    tags: ["Law firm", "Established team"],
  },
  {
    slug: "bain-london-ai",
    name: "Bain & Co London — AI practice",
    tier: 3,
    hq: "London",
    websiteUrl: "https://www.bain.com",
    focusAreas: ["AI strategy advisory", "AI-readiness for gov clients"],
    description:
      "Strategy consulting; AI-readiness advisory for gov clients. Different verb from 'policy' (advise, not regulate), but for someone scouting the field it's a real adjacent destination.",
    tags: ["Consultancy", "Established team"],
  },
  {
    slug: "techuk",
    name: "techUK",
    tier: 3,
    hq: "London (Westminster)",
    websiteUrl: "https://www.techuk.org",
    careersUrl: "https://www.techuk.org/careers.html",
    focusAreas: ["AI industry advocacy", "tech sector policy"],
    description:
      "Industry body for UK tech. AI policy work is one strand among many; advocacy-shaped, government-affairs heavy. Useful inside-the-Westminster-village destination.",
    tags: ["Advocacy", "Established team"],
  },
  {
    slug: "cma-broader-ai",
    name: "CMA — broader AI work (non-DMU)",
    tier: 3,
    hq: "London (Whitehall)",
    websiteUrl: "https://www.gov.uk/government/organisations/competition-and-markets-authority",
    focusAreas: ["AI mergers", "AI in competition cases"],
    description:
      "Outside the Digital Markets Unit, the broader CMA still encounters AI as it comes up in mergers and competition cases. Smaller surface than DMU; specialist roles inside a regulator.",
    tags: ["Government", "Established team"],
  },
  {
    slug: "dsit-ai-opportunity",
    name: "DSIT — AI Opportunity Unit",
    tier: 3,
    hq: "London (Whitehall)",
    websiteUrl: "https://www.gov.uk/government/organisations/department-for-science-innovation-and-technology",
    focusAreas: ["AI growth policy", "AI adoption in public sector"],
    description:
      "Smaller sibling team to DSIT's main AI Policy Directorate; focused on the AI Opportunity Plan and adoption-side work. Newer team, less established playbook, more growth-shaped.",
    tags: ["Government", "First policy hire"],
  },
  {
    slug: "rusi-ai",
    name: "RUSI (AI work, non-CETaS)",
    tier: 3,
    hq: "London (Whitehall)",
    websiteUrl: "https://rusi.org",
    focusAreas: ["national security AI", "geopolitics of AI"],
    description:
      "Royal United Services Institute outside of CETaS. AI policy work as it intersects with broader defence and security analysis. Established think tank; AI work is recent and growing.",
    tags: ["Defence/security", "Think tank"],
  },
  {
    slug: "lse-ai-policy",
    name: "LSE — AI policy research strand",
    tier: 3,
    hq: "London (Holborn)",
    websiteUrl: "https://www.lse.ac.uk",
    focusAreas: ["AI in regulation research", "tech policy academia"],
    description:
      "Academic surface that produces policy-adjacent work. Not a destination for an industry policy job, but a place to read from. Included as a marker on the map; the engagement test is weak.",
    tags: ["Think tank"],
  },

  /* ----------------- v0.6 EXPANSION — additional A/B tier --------- */
  {
    slug: "cohere-london",
    name: "Cohere (London)",
    tier: 2,
    hq: "Toronto HQ \u00b7 London office",
    websiteUrl: "https://cohere.com",
    careersUrl: "https://cohere.com/careers",
    focusAreas: [
      "enterprise AI policy",
      "data sovereignty",
      "UK-EU regulatory alignment",
    ],
    description:
      "Canadian frontier lab with a real London office that handles UK/EU regulatory engagement. Enterprise-shaped policy work \u2014 data residency, RAG/grounding compliance, public-sector procurement \u2014 quieter than the OpenAI/Anthropic register but with a clearer customer side.",
    tags: ["Frontier lab"],
  },
  {
    slug: "apollo-research",
    name: "Apollo Research",
    tier: 2,
    hq: "London",
    websiteUrl: "https://www.apolloresearch.ai",
    careersUrl: "https://www.apolloresearch.ai/careers",
    focusAreas: [
      "frontier model evaluations",
      "deceptive AI",
      "AISI partnerships",
      "pre-deployment audits",
    ],
    description:
      "London-based AI safety org running pre-deployment evals on frontier models for scheming and deception. Small, frontier-defining, technical-policy hybrid \u2014 the kind of team where 'policy' work means writing the methodology that AISI then picks up.",
    tags: ["Think tank", "First policy hire", "Hiring policy lead"],
  },
  {
    slug: "faculty-ai",
    name: "Faculty AI",
    tier: 2,
    hq: "London (Old Street)",
    websiteUrl: "https://faculty.ai",
    careersUrl: "https://faculty.ai/careers/",
    focusAreas: [
      "AI for government",
      "AI assurance",
      "defence AI",
      "public-sector AI deployment",
    ],
    description:
      "The UK gov\u2019s long-standing AI delivery partner \u2014 NHS, Home Office, MoD, AISI early infra. Policy adjacency is real (assurance work, gov procurement, defence AI ethics) and contested (military drones reporting in 2025). For someone wanting AI policy with delivery teeth, this is the closest thing.",
    tags: ["Consultancy", "UK-native", "Established team"],
  },
  {
    slug: "govai",
    name: "Centre for the Governance of AI (GovAI)",
    tier: 2,
    hq: "Oxford",
    websiteUrl: "https://www.governance.ai",
    careersUrl: "https://www.governance.ai/opportunities",
    focusAreas: [
      "international AI governance",
      "compute governance",
      "frontier AI policy research",
      "AI in geopolitics",
    ],
    description:
      "Oxford-based independent non-profit; the single most cited academic-ish source on long-horizon AI governance. Not London, but staff routinely move between GovAI and AISI/CLTR/DeepMind policy. Writing-led, frontier-defining, small \u2014 the place where the conceptual frame gets set.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "aria-safeguarded-ai",
    name: "ARIA \u2014 Safeguarded AI programme",
    tier: 2,
    hq: "London \u00b7 distributed",
    websiteUrl: "https://www.aria.org.uk",
    careersUrl: "https://www.aria.org.uk/opportunities/",
    focusAreas: [
      "technical AI safety R&D",
      "AI assurance methods",
      "high-assurance systems",
    ],
    description:
      "UK\u2019s ARPA-style research agency; the Safeguarded AI programme is the biggest UK public investment in technical AI safety methods. Programme-director model means the policy surface is real but indirect \u2014 you shape what gets funded, not what gets regulated.",
    tags: ["Government", "First policy hire"],
  },
  {
    slug: "microsoft-ai-london",
    name: "Microsoft AI (London)",
    tier: 2,
    hq: "Redmond HQ \u00b7 London (Mustafa Suleyman team)",
    websiteUrl: "https://www.microsoft.com/en-gb/ai",
    careersUrl: "https://careers.microsoft.com/v2/global/en/search?lc=London%2C%20England%2C%20United%20Kingdom",
    focusAreas: [
      "responsible AI",
      "Copilot policy",
      "UK gov AI partnerships",
      "EU AI Act",
    ],
    description:
      "London is now a real Microsoft AI centre under Mustafa Suleyman, with a growing public-affairs and responsible-AI surface tied to it. Big Tech register \u2014 compliance-shaped, broad multi-jurisdiction, the kind of team where one consultation response goes through six legal reviews.",
    tags: ["Frontier lab", "Established team"],
  },
  {
    slug: "meta-london-policy",
    name: "Meta (London) \u2014 AI & content policy",
    tier: 2,
    hq: "Menlo Park HQ \u00b7 London (Brock House)",
    websiteUrl: "https://about.meta.com",
    careersUrl: "https://www.metacareers.com/jobs?offices[0]=London%2C%20UK",
    focusAreas: [
      "open-weights policy",
      "content moderation",
      "Online Safety Act",
      "EU AI Act",
    ],
    description:
      "Meta\u2019s London policy footprint covers AI (Llama, open weights advocacy) and content (Ofcom, Online Safety Act). Mature team, government-affairs heavy, the lobbying shop in the strict sense \u2014 not where you go to set the frontier, but where you learn the Westminster muscle.",
    tags: ["Frontier lab", "Established team"],
  },
  {
    slug: "bird-and-bird-ai",
    name: "Bird & Bird \u2014 AI / tech regulation",
    tier: 2,
    hq: "London (Fetter Lane)",
    websiteUrl: "https://www.twobirds.com",
    careersUrl: "https://www.twobirds.com/en/careers",
    focusAreas: [
      "AI Act compliance",
      "data protection",
      "online safety law",
      "AI litigation",
    ],
    description:
      "The tech-native law firm. Bird & Bird\u2019s AI and data practice has been on the regulatory file longer than most City competitors \u2014 deeper bench on the operational side of AI Act + ICO + Ofcom. The best place in the law-firm slice if you want AI policy as a craft, not just a panel topic.",
    tags: ["Law firm", "Established team"],
  },
  {
    slug: "fca-ai",
    name: "FCA \u2014 AI in financial services",
    tier: 2,
    hq: "London (Stratford)",
    websiteUrl: "https://www.fca.org.uk",
    careersUrl: "https://www.fca.org.uk/careers",
    focusAreas: [
      "AI in finance regulation",
      "model risk management",
      "SM&CR and AI accountability",
    ],
    description:
      "Financial Conduct Authority\u2019s AI strand sits inside the Innovation and Digital teams. Regulator register, compliance-shaped \u2014 the AI questions come second to the financial-services frame they\u2019re asked through. Real lever if you care about how banks deploy ML.",
    tags: ["Government", "Established team"],
  },
  {
    slug: "quantumblack-london",
    name: "McKinsey QuantumBlack (London)",
    tier: 2,
    hq: "London (Westminster)",
    websiteUrl: "https://www.mckinsey.com/capabilities/quantumblack",
    careersUrl: "https://www.mckinsey.com/careers/search-jobs?locations=London",
    focusAreas: [
      "AI strategy advisory",
      "public-sector AI advisory",
      "AI risk frameworks",
    ],
    description:
      "McKinsey\u2019s AI arm; London is one of the two biggest QuantumBlack hubs. Advisory not policy in the strict sense, but writes the AI risk frameworks gov clients then adopt. Mature, compliance-shaped, well-paid \u2014 different verb from policy, real adjacency.",
    tags: ["Consultancy", "Established team"],
  },
  {
    slug: "bank-of-england-ai",
    name: "Bank of England \u2014 AI / ML strand",
    tier: 3,
    hq: "London (Threadneedle Street)",
    websiteUrl: "https://www.bankofengland.co.uk",
    careersUrl: "https://www.bankofengland.co.uk/careers",
    focusAreas: [
      "financial stability and AI",
      "model risk",
      "systemic AI risk",
    ],
    description:
      "PRA + Financial Policy Committee work on AI/ML in systemically important firms. Smaller AI-specific surface than the FCA but the systemic-risk angle is unique. Career central-bank register \u2014 slow, deep, consequential.",
    tags: ["Government", "Established team"],
  },
  {
    slug: "nhs-ai-transformation",
    name: "NHS England \u2014 AI & Transformation Directorate",
    tier: 3,
    hq: "London (Wellington House)",
    websiteUrl: "https://www.england.nhs.uk",
    careersUrl: "https://www.jobs.nhs.uk",
    focusAreas: [
      "AI in healthcare deployment",
      "NHS AI Lab legacy",
      "medical-device AI procurement",
    ],
    description:
      "Where AI policy meets NHS operations. Procurement, deployment, clinical-safety questions live here rather than at MHRA. Sprawling, slow, real impact surface \u2014 a different policy job from the AISI/Whitehall register.",
    tags: ["Government", "Established team"],
  },
  {
    slug: "bbc-responsible-ai",
    name: "BBC \u2014 Responsible AI / R&D",
    tier: 3,
    hq: "London (Broadcasting House) + Salford",
    websiteUrl: "https://www.bbc.co.uk/rd",
    careersUrl: "https://careers.bbc.co.uk",
    focusAreas: [
      "responsible AI in media",
      "content provenance",
      "AI in journalism",
    ],
    description:
      "BBC R&D + the Responsible AI/ML governance function. Editorial-shaped AI policy \u2014 provenance, journalism use cases, ML engine principles. A real career destination if you want media-policy adjacency rather than frontier-lab work.",
    tags: ["Established team", "Hiring policy lead"],
  },
  {
    slug: "bennett-cambridge",
    name: "Bennett School of Public Policy (Cambridge)",
    tier: 3,
    hq: "Cambridge",
    websiteUrl: "https://www.bennettinstitute.cam.ac.uk",
    focusAreas: [
      "AI public policy research",
      "AI in government productivity",
      "digital state capacity",
    ],
    description:
      "New Cambridge policy school (opened 2025) with a serious AI-implementation strand \u2014 working with the Civil Service on AI workflows. Academic register; an early-stage destination rather than a load-bearing one, included because hiring is ramping.",
    tags: ["Think tank", "First policy hire"],
  },
  {
    slug: "oxford-internet-institute",
    name: "Oxford Internet Institute",
    tier: 3,
    hq: "Oxford",
    websiteUrl: "https://www.oii.ox.ac.uk",
    focusAreas: [
      "AI ethics research",
      "platform governance",
      "AI labour markets",
    ],
    description:
      "Long-running academic shop on internet/AI governance. Generates the citations consultation responses then quote. Not an industry policy destination, but a real ecosystem node \u2014 included so the map isn\u2019t London-myopic.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "i-dot-ai",
    name: "i.AI \u2014 Incubator for Artificial Intelligence (Cabinet Office)",
    tier: 3,
    hq: "London (Whitehall)",
    websiteUrl: "https://ai.gov.uk",
    careersUrl: "https://ai.gov.uk/about",
    focusAreas: [
      "AI in government delivery",
      "civil-service AI tools",
      "Humphrey, Redbox",
    ],
    description:
      "Cabinet Office unit shipping AI tools inside government (Humphrey, Redbox, Consult). Engineering-heavy, policy-adjacent \u2014 you build the thing ministers then announce. Growing fast; an unusual policy-meets-delivery seat.",
    tags: ["Government", "First policy hire", "Hiring policy lead"],
  },
  {
    slug: "mhra-ai",
    name: "MHRA \u2014 AI as a Medical Device",
    tier: 3,
    hq: "London (Canary Wharf)",
    websiteUrl: "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency",
    focusAreas: [
      "AI medical device regulation",
      "software-as-medical-device",
      "clinical AI assurance",
    ],
    description:
      "The regulator any healthcare AI must clear. Niche but deep \u2014 SaMD frameworks, the AI Airlock sandbox. Career civil-service register; specialist roles where biomedical knowledge buys you a seat the AI generalists can\u2019t fill.",
    tags: ["Government", "Established team"],
  },
  {
    slug: "chatham-house-ai",
    name: "Chatham House \u2014 Digital Society Initiative",
    tier: 3,
    hq: "London (St James\u2019s Square)",
    websiteUrl: "https://www.chathamhouse.org",
    careersUrl: "https://www.chathamhouse.org/about-us/careers",
    focusAreas: [
      "international AI governance",
      "AI in geopolitics",
      "export controls",
    ],
    description:
      "Royal Institute of International Affairs. AI work sits inside the broader international-affairs frame \u2014 US-China-EU compute policy, AI in security. Prestige convening surface, slower drafting cadence than the AI-specialist shops.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "ippr",
    name: "IPPR \u2014 AI & economic policy",
    tier: 3,
    hq: "London",
    websiteUrl: "https://www.ippr.org",
    careersUrl: "https://www.ippr.org/jobs",
    focusAreas: [
      "AI and labour markets",
      "AI and inequality",
      "public-services AI",
    ],
    description:
      "Progressive think tank; AI work is one strand of a wider economic-policy frame. Strong on the labour-market and inequality angles other AI shops underweight. Writing-led, established, broad.",
    tags: ["Think tank", "Established team"],
  },
  {
    slug: "onward",
    name: "Onward",
    tier: 3,
    hq: "London (Westminster)",
    websiteUrl: "https://www.ukonward.com",
    careersUrl: "https://www.ukonward.com/jobs",
    focusAreas: [
      "AI growth policy",
      "compute & infrastructure",
      "science and tech policy",
    ],
    description:
      "Centre-right think tank with a growing tech/AI strand. Compute, sovereign AI, growth-shaped framings \u2014 the kind of work that lands inside the current government\u2019s AI Opportunity register. Useful counterweight to the Ada/IPPR axis on the map.",
    tags: ["Think tank"],
  },
  {
    slug: "public-io",
    name: "PUBLIC",
    tier: 3,
    hq: "London",
    websiteUrl: "https://www.public.io",
    careersUrl: "https://www.public.io/careers",
    focusAreas: [
      "govtech",
      "AI procurement",
      "defence accelerators",
    ],
    description:
      "GovTech venture studio + consultancy; runs accelerators with MoD and works on local-gov digital evaluation. Smaller than Faculty, more startup-shaped \u2014 policy adjacency through procurement and gov-buyer routes.",
    tags: ["Consultancy", "UK-native"],
  },
  {
    slug: "conjecture",
    name: "Conjecture",
    tier: 3,
    hq: "London",
    websiteUrl: "https://www.conjecture.dev",
    careersUrl: "https://www.conjecture.dev/career",
    focusAreas: [
      "AI alignment research",
      "controllable AI",
      "open advocacy on safety",
    ],
    description:
      "London AI safety lab with a strong public posture on controllability/limits. Research-heavy, opinionated, small \u2014 'policy' here means writing the position papers, not running gov-affairs. Niche destination for the alignment-curious.",
    tags: ["UK-native", "First policy hire"],
  },
  {
    slug: "open-rights-group",
    name: "Open Rights Group",
    tier: 3,
    hq: "London",
    websiteUrl: "https://www.openrightsgroup.org",
    careersUrl: "https://www.openrightsgroup.org/about/work-for-us/",
    focusAreas: [
      "digital rights",
      "surveillance",
      "AI in policing & ADM",
    ],
    description:
      "UK\u2019s longest-running digital-rights org. Advocacy register; AI work where it touches surveillance, ADM, Online Safety. Smaller and more campaign-shaped than Ada, more institutional than Big Brother Watch.",
    tags: ["Advocacy", "Established team"],
  },
  {
    slug: "foxglove",
    name: "Foxglove",
    tier: 3,
    hq: "London",
    websiteUrl: "https://www.foxglove.org.uk",
    careersUrl: "https://www.foxglove.org.uk/jobs/",
    focusAreas: [
      "algorithmic accountability litigation",
      "ADM in immigration / welfare",
      "content moderator rights",
    ],
    description:
      "Litigation-led tech-justice org. Picks fights and wins them \u2014 Home Office visa algorithm, Ofqual A-levels, Meta content moderator cases. Tiny team, outsized record. Closest the UK has to an algorithmic-justice law shop.",
    tags: ["Advocacy", "First policy hire"],
  },
  {
    slug: "slaughter-and-may-ai",
    name: "Slaughter and May \u2014 AI practice",
    tier: 3,
    hq: "London (City)",
    websiteUrl: "https://www.slaughterandmay.com",
    focusAreas: ["AI regulation advisory", "corporate AI risk"],
    description:
      "Magic-circle firm; AI advisory is bundled inside the broader tech/regulatory practice. Conservative pace, top-end clients \u2014 specialist roles within a slow-moving deep org.",
    tags: ["Law firm", "Established team"],
  },
  {
    slug: "ao-shearman-ai",
    name: "A&O Shearman \u2014 AI / digital regulation",
    tier: 3,
    hq: "London (Bishops Square)",
    websiteUrl: "https://www.aoshearman.com",
    focusAreas: ["AI Act compliance", "global AI regulation", "digital regulation"],
    description:
      "Post-merger A&O Shearman; AI/digital practice is one of the larger cross-border legal benches on the Act and on UK-EU-US alignment. Established machinery, billable register.",
    tags: ["Law firm", "Established team"],
  },
  {
    slug: "pinsent-masons-ai",
    name: "Pinsent Masons \u2014 AI / data practice",
    tier: 3,
    hq: "London + multi-site UK",
    websiteUrl: "https://www.pinsentmasons.com",
    focusAreas: ["AI regulation", "data protection", "public-sector AI procurement"],
    description:
      "Strong public-sector and energy-infra client base; the AI practice often sees questions before they hit Big Law. More approachable register than the magic circle for someone trying to get hands on real AI procurement files.",
    tags: ["Law firm", "Established team"],
  },
  {
    slug: "deloitte-uk-ai",
    name: "Deloitte UK \u2014 AI Institute",
    tier: 3,
    hq: "London (Old Bailey)",
    websiteUrl: "https://www2.deloitte.com/uk/en.html",
    careersUrl: "https://www2.deloitte.com/uk/en/careers/careers.html",
    focusAreas: ["AI assurance", "AI risk frameworks", "public-sector AI advisory"],
    description:
      "Big-Four AI practice with a UK-public-sector throughline. Compliance-shaped, slower than QuantumBlack but with a bigger gov-buyer roster. The AI Institute output is more brand than research, but the underlying client work is real.",
    tags: ["Consultancy", "Established team"],
  },
  {
    slug: "pa-consulting-ai",
    name: "PA Consulting \u2014 AI / public services",
    tier: 3,
    hq: "London (Victoria)",
    websiteUrl: "https://www.paconsulting.com",
    careersUrl: "https://www.paconsulting.com/careers",
    focusAreas: ["AI in public services", "defence AI advisory", "AI assurance"],
    description:
      "UK-native consultancy with deep Whitehall and defence client base. AI work threads through public-services and defence engagements rather than sitting in a dedicated policy shop \u2014 a real entry point if you want UK gov work without going to Faculty.",
    tags: ["Consultancy", "UK-native", "Established team"],
  },
  {
    slug: "centre-for-future-generations",
    name: "Centre for Future Generations",
    tier: 3,
    hq: "London / Brussels",
    websiteUrl: "https://cfg.eu",
    careersUrl: "https://cfg.eu/jobs/",
    focusAreas: [
      "frontier AI policy",
      "long-term governance",
      "EU-UK AI bridge",
    ],
    description:
      "Small EU-UK think tank on long-horizon tech governance. Frontier-shaped, writing-led, EU AI Office facing as much as Westminster. A real lever if your interest is UK-as-node-in-a-wider-system rather than UK-only policy.",
    tags: ["Think tank", "First policy hire"],
  },
];

/* ------------------------------------------------------------------ */
/* User profile                                                       */
/* ------------------------------------------------------------------ */

export const seedUserProfile = {
  displayName: "Aadi Kulkarni",
  headline:
    "International policy officer at Coinbase, exploring AI policy roles. Government digitisation, regulatory infrastructure, public-service accessibility.",
  bio: "Works on cross-border crypto policy from London. Built career at the intersection of government digitisation, data ethics, and regulatory infrastructure for emerging technology. Co-founded Polici.org. Harvard LIL. NSF data-ethics research at Cornell with Solon Barocas and Karen Levy. Mitchell Scholar (UCD).",
  weights: {
    accessibility: "high",
    govDigitalInfrastructure: "high",
    regulatoryClarity: "high",
    dataEthics: "medium",
    implementationMaturity: "medium",
    openStandards: "medium",
    crossJurisdictional: "low",
  },
  concerns: [
    "Geographic remit: I want London but I don't want UK-only — does this team actually work across EU/US/international as well?",
    "Policy posture: am I more interested in shops defining the rules, or shops executing a known playbook well?",
    "Stage of company: how early am I willing to go — is the policy function being built or is it already running?",
    "Working style: writing-led vs government-affairs-led — both real, but I have a preference.",
    "Team style: do I want to set the frontier (small, judgement-heavy team) or execute a playbook well (consistency, scale)?",
  ],
  sources: [
    "https://github.com/nwspk/politech-awards-2026 (PR #73, branch project-mirror-v2/aadi-kulkarni)",
    "research/profile-user.md",
  ],
};

/* ------------------------------------------------------------------ */
/* Frame scores — first pass, v0.5                                     */
/* ------------------------------------------------------------------ */

/**
 * First-pass scores for the London set on the six v0.5 frames.
 * Keyed by company slug → frame name → 1..5.
 *
 * Scale anchors:
 *   Geographic remit:    1 UK-only       → 5 Multi-jurisdiction
 *   Policy area scope:   1 Single-issue  → 5 Broad multi-domain
 *   Stage of company:    1 Pre-product   → 5 Established
 *   Policy posture:      1 Frontier-def. → 5 Compliance-maint.
 *   Working style:       1 Writing-led   → 5 Government-affairs-led
 *   Team style:          1 Set frontier  → 5 Execute playbook
 *
 * These are first-pass editorial reads against the v0.4 codebase, not the
 * v0.5 surface (see CONCEPT-v0.5 §9 Step 5 — the re-curation pass closes
 * the gap between first read and considered read against the live chrome).
 */
export const seedFrameScores: Record<string, Record<string, number>> = {
  // S-tier
  "google-deepmind":       { "Geographic remit": 5, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 2, "Working style": 3, "Team style": 4 },
  "anthropic-london":      { "Geographic remit": 5, "Policy area scope": 4, "Stage of company": 4, "Policy posture": 1, "Working style": 2, "Team style": 2 },
  "openai-london":         { "Geographic remit": 5, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 2, "Working style": 4, "Team style": 3 },
  "wayve":                 { "Geographic remit": 3, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 1, "Working style": 3, "Team style": 1 },
  "alan-turing-institute": { "Geographic remit": 3, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 3, "Working style": 2, "Team style": 4 },
  "ada-lovelace-institute":{ "Geographic remit": 3, "Policy area scope": 4, "Stage of company": 4, "Policy posture": 2, "Working style": 2, "Team style": 2 },
  "cltr":                  { "Geographic remit": 4, "Policy area scope": 3, "Stage of company": 2, "Policy posture": 1, "Working style": 2, "Team style": 1 },
  "aisi":                  { "Geographic remit": 4, "Policy area scope": 4, "Stage of company": 3, "Policy posture": 1, "Working style": 3, "Team style": 1 },
  "dsit-ai-policy":        { "Geographic remit": 3, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 3, "Working style": 5, "Team style": 4 },
  "tbi":                   { "Geographic remit": 5, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 2, "Working style": 4, "Team style": 4 },
  // A-tier
  "mistral-london":        { "Geographic remit": 5, "Policy area scope": 3, "Stage of company": 4, "Policy posture": 1, "Working style": 2, "Team style": 2 },
  "stability-ai":          { "Geographic remit": 4, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 4, "Working style": 4, "Team style": 4 },
  "synthesia":             { "Geographic remit": 3, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 2, "Working style": 3, "Team style": 2 },
  "helsing":               { "Geographic remit": 4, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 3, "Working style": 4, "Team style": 3 },
  "demos":                 { "Geographic remit": 2, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 3, "Working style": 2, "Team style": 4 },
  "nesta":                 { "Geographic remit": 2, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 3, "Working style": 2, "Team style": 4 },
  "royal-society-policy":  { "Geographic remit": 3, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 3, "Working style": 2, "Team style": 5 },
  "cetas":                 { "Geographic remit": 4, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 2, "Working style": 3, "Team style": 2 },
  "odi":                   { "Geographic remit": 3, "Policy area scope": 3, "Stage of company": 4, "Policy posture": 2, "Working style": 2, "Team style": 3 },
  "frontier-economics":    { "Geographic remit": 4, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 4, "Working style": 3, "Team style": 5 },
  "cma-dmu":               { "Geographic remit": 2, "Policy area scope": 3, "Stage of company": 4, "Policy posture": 3, "Working style": 5, "Team style": 3 },
  "elevenlabs-london":     { "Geographic remit": 5, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 2, "Working style": 3, "Team style": 2 },
  "ico-ai":                { "Geographic remit": 2, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 5, "Working style": 4, "Team style": 5 },
  "ofcom-ai":              { "Geographic remit": 2, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 5, "Working style": 4, "Team style": 5 },
  // B-tier
  "xai-london":            { "Geographic remit": 5, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 2, "Working style": 3, "Team style": 3 },
  "polyai":                { "Geographic remit": 3, "Policy area scope": 1, "Stage of company": 3, "Policy posture": 5, "Working style": 4, "Team style": 5 },
  "benevolentai":          { "Geographic remit": 2, "Policy area scope": 1, "Stage of company": 4, "Policy posture": 4, "Working style": 3, "Team style": 4 },
  "improbable":            { "Geographic remit": 4, "Policy area scope": 2, "Stage of company": 4, "Policy posture": 3, "Working style": 4, "Team style": 4 },
  "big-brother-watch":     { "Geographic remit": 2, "Policy area scope": 1, "Stage of company": 4, "Policy posture": 1, "Working style": 4, "Team style": 5 },
  "connected-by-data":     { "Geographic remit": 2, "Policy area scope": 2, "Stage of company": 2, "Policy posture": 1, "Working style": 2, "Team style": 1 },
  "public-law-project":    { "Geographic remit": 1, "Policy area scope": 1, "Stage of company": 4, "Policy posture": 1, "Working style": 3, "Team style": 4 },
  "oliver-wyman-london":   { "Geographic remit": 4, "Policy area scope": 2, "Stage of company": 5, "Policy posture": 5, "Working style": 3, "Team style": 5 },
  "hogan-lovells-ai":      { "Geographic remit": 4, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 5, "Working style": 3, "Team style": 5 },
  "linklaters-ai":         { "Geographic remit": 4, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 5, "Working style": 3, "Team style": 5 },
  "bain-london-ai":        { "Geographic remit": 4, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 4, "Working style": 4, "Team style": 5 },
  "techuk":                { "Geographic remit": 2, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 4, "Working style": 5, "Team style": 5 },
  "cma-broader-ai":        { "Geographic remit": 2, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 4, "Working style": 5, "Team style": 5 },
  "dsit-ai-opportunity":   { "Geographic remit": 2, "Policy area scope": 4, "Stage of company": 3, "Policy posture": 3, "Working style": 4, "Team style": 2 },
  "rusi-ai":               { "Geographic remit": 4, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 3, "Working style": 3, "Team style": 4 },
  "lse-ai-policy":         { "Geographic remit": 3, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 2, "Working style": 1, "Team style": 4 },
  // v0.6 expansion
  "cohere-london":              { "Geographic remit": 5, "Policy area scope": 3, "Stage of company": 4, "Policy posture": 3, "Working style": 4, "Team style": 3 },
  "apollo-research":            { "Geographic remit": 4, "Policy area scope": 2, "Stage of company": 2, "Policy posture": 1, "Working style": 2, "Team style": 1 },
  "faculty-ai":                 { "Geographic remit": 2, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 3, "Working style": 4, "Team style": 4 },
  "govai":                      { "Geographic remit": 5, "Policy area scope": 3, "Stage of company": 4, "Policy posture": 1, "Working style": 1, "Team style": 1 },
  "aria-safeguarded-ai":        { "Geographic remit": 3, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 1, "Working style": 3, "Team style": 2 },
  "microsoft-ai-london":        { "Geographic remit": 5, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 4, "Working style": 4, "Team style": 5 },
  "meta-london-policy":         { "Geographic remit": 5, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 4, "Working style": 5, "Team style": 5 },
  "bird-and-bird-ai":           { "Geographic remit": 4, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 5, "Working style": 3, "Team style": 4 },
  "fca-ai":                     { "Geographic remit": 2, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 5, "Working style": 4, "Team style": 5 },
  "quantumblack-london":        { "Geographic remit": 4, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 4, "Working style": 4, "Team style": 5 },
  "bank-of-england-ai":         { "Geographic remit": 2, "Policy area scope": 2, "Stage of company": 5, "Policy posture": 5, "Working style": 4, "Team style": 5 },
  "nhs-ai-transformation":      { "Geographic remit": 1, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 4, "Working style": 4, "Team style": 5 },
  "bbc-responsible-ai":         { "Geographic remit": 2, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 3, "Working style": 3, "Team style": 4 },
  "bennett-cambridge":          { "Geographic remit": 3, "Policy area scope": 4, "Stage of company": 2, "Policy posture": 2, "Working style": 1, "Team style": 2 },
  "oxford-internet-institute":  { "Geographic remit": 4, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 2, "Working style": 1, "Team style": 4 },
  "i-dot-ai":                   { "Geographic remit": 1, "Policy area scope": 3, "Stage of company": 2, "Policy posture": 2, "Working style": 5, "Team style": 2 },
  "mhra-ai":                    { "Geographic remit": 2, "Policy area scope": 1, "Stage of company": 5, "Policy posture": 5, "Working style": 4, "Team style": 5 },
  "chatham-house-ai":           { "Geographic remit": 5, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 3, "Working style": 2, "Team style": 4 },
  "ippr":                       { "Geographic remit": 2, "Policy area scope": 5, "Stage of company": 5, "Policy posture": 3, "Working style": 2, "Team style": 4 },
  "onward":                     { "Geographic remit": 2, "Policy area scope": 4, "Stage of company": 4, "Policy posture": 3, "Working style": 3, "Team style": 3 },
  "public-io":                  { "Geographic remit": 2, "Policy area scope": 3, "Stage of company": 3, "Policy posture": 3, "Working style": 4, "Team style": 3 },
  "conjecture":                 { "Geographic remit": 4, "Policy area scope": 1, "Stage of company": 2, "Policy posture": 1, "Working style": 1, "Team style": 1 },
  "open-rights-group":          { "Geographic remit": 2, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 1, "Working style": 3, "Team style": 4 },
  "foxglove":                   { "Geographic remit": 2, "Policy area scope": 2, "Stage of company": 3, "Policy posture": 1, "Working style": 3, "Team style": 1 },
  "slaughter-and-may-ai":       { "Geographic remit": 4, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 5, "Working style": 3, "Team style": 5 },
  "ao-shearman-ai":             { "Geographic remit": 5, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 5, "Working style": 3, "Team style": 5 },
  "pinsent-masons-ai":          { "Geographic remit": 2, "Policy area scope": 3, "Stage of company": 5, "Policy posture": 5, "Working style": 3, "Team style": 5 },
  "deloitte-uk-ai":             { "Geographic remit": 4, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 4, "Working style": 4, "Team style": 5 },
  "pa-consulting-ai":           { "Geographic remit": 2, "Policy area scope": 4, "Stage of company": 5, "Policy posture": 4, "Working style": 4, "Team style": 5 },
  "centre-for-future-generations": { "Geographic remit": 5, "Policy area scope": 3, "Stage of company": 2, "Policy posture": 1, "Working style": 1, "Team style": 2 },
};

/* ------------------------------------------------------------------ */
/* Seed publications — minimal v0.5 starter set                        */
/* ------------------------------------------------------------------ */

export type SeedPublication = {
  type: "blog" | "press" | "filing" | "paper" | "other";
  title: string;
  url: string;
  publishedAt: string;
  summary?: string;
  topics?: string[];
};

export const seedPublications: Record<string, SeedPublication[]> = {
  "anthropic-london": [
    {
      type: "filing",
      title: "Anthropic's Responsible Scaling Policy",
      url: "https://www.anthropic.com/news/anthropics-responsible-scaling-policy",
      publishedAt: "2023-09-19",
      summary:
        "Frontier-lab safety commitments tied to capability thresholds (ASL levels); shaped voluntary policy frameworks since.",
      topics: ["frontier safety", "voluntary commitments", "RSP"],
    },
  ],
  "google-deepmind": [
    {
      type: "filing",
      title: "Introducing the Frontier Safety Framework",
      url: "https://deepmind.google/discover/blog/introducing-the-frontier-safety-framework/",
      publishedAt: "2024-05-17",
      summary:
        "DeepMind's first-pass framework for identifying and mitigating frontier model risk.",
      topics: ["frontier safety", "framework"],
    },
  ],
  "ada-lovelace-institute": [
    {
      type: "paper",
      title: "Regulating AI in the UK",
      url: "https://www.adalovelaceinstitute.org/report/regulating-ai-in-the-uk/",
      publishedAt: "2023-07-18",
      summary:
        "Ada's signature report on the UK's AI regulation approach, widely cited in subsequent policy debate.",
      topics: ["UK AI regulation", "white paper response"],
    },
  ],
  "cltr": [
    {
      type: "paper",
      title: "Future Proof — extreme AI risks and what to do about them",
      url: "https://www.longtermresilience.org/post/future-proof",
      publishedAt: "2023-10-30",
      summary:
        "Pre-Bletchley framing of frontier AI risk; co-authored work that fed into the Bletchley Declaration.",
      topics: ["frontier safety", "catastrophic risk", "Bletchley"],
    },
  ],
  "tbi": [
    {
      type: "paper",
      title: "Governing in the Age of AI: A New Model for State Capacity",
      url: "https://www.institute.global/insights/politics-and-governance/governing-in-the-age-of-ai",
      publishedAt: "2024-07-09",
      summary:
        "TBI's signature paper on AI in state capacity; shaped early DSIT thinking on AI in public services.",
      topics: ["state capacity", "public services AI", "AI Opportunity"],
    },
  ],
  "aisi": [
    {
      type: "filing",
      title: "AISI advanced AI evaluations — May 2024 update",
      url: "https://www.aisi.gov.uk/work/advanced-ai-evaluations-may-update",
      publishedAt: "2024-05-20",
      summary:
        "AISI's published update on frontier model evaluation methodology; sets a public bar for safety evaluations.",
      topics: ["model evaluations", "frontier safety", "AISI"],
    },
  ],
};
