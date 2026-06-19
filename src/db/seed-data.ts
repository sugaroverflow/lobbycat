/**
 * Seed data. Hand-curated from public sources (Jun 2026).
 * Every fact has a cite-able public URL. No private info.
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
  rolesSourceId?: string; // board token
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

export const seedTags = [
  { label: "Frontier lab", color: "#406896" },
  { label: "UK", color: "#1C6C34" },
  { label: "EU", color: "#406896" },
  { label: "US", color: "#B85048" },
  { label: "Hiring policy lead", color: "#B85048" },
  { label: "First policy hire", color: "#1C6C34" },
  { label: "Established team", color: "#4A5260" },
  { label: "Voice / media AI", color: "#406896" },
  { label: "Autonomous / mobility", color: "#406896" },
  { label: "Open weights", color: "#1C6C34" },
  { label: "Agentic / coding AI", color: "#406896" },
  // product-shape pills (v0.3.1 F1) — what kind of policy work this role would be
  { label: "International policy", color: "#3E5C3A" },
  { label: "Government affairs", color: "#3E5C3A" },
  { label: "Regulatory counsel", color: "#3E5C3A" },
  { label: "Trust & safety", color: "#3E5C3A" },
  { label: "Product / GTM", color: "#3E5C3A" },
];

export const seedFrames = [
  {
    name: "UK-pigeonhole risk",
    description:
      "How much would taking this role tie you to UK-only policy work? Higher = more UK-bound; lower = clearly international remit.",
    scale: 5,
    lowLabel: "clearly international",
    highLabel: "very UK-bound",
    lowDescription: "International remit — global affairs, multi-jurisdictional policy work.",
    highDescription: "UK policy only — narrow national focus, hard to port elsewhere.",
    sortIndex: 0,
  },
  {
    name: "Charting the unknown",
    description:
      "Is the work treading well-mapped ground, or is the company facing first-of-its-kind regulatory questions you'd help define?",
    scale: 5,
    lowLabel: "well-mapped territory",
    highLabel: "frontier / first-of-its-kind",
    lowDescription: "Established regulatory terrain — playing a known game well.",
    highDescription: "First-of-its-kind questions — defining the rules as you go.",
    sortIndex: 1,
  },
  {
    name: "Cog vs. build-the-team",
    description:
      "Are you joining a large established policy operation (cog in a system) or building the policy function from early days?",
    scale: 5,
    lowLabel: "established team, specialist role",
    highLabel: "first/early policy hire, build the team",
    lowDescription: "Established team / specialist role — slot into a working function.",
    highDescription: "First policy hire / build the function — set strategy from scratch.",
    sortIndex: 2,
  },
  {
    name: "Policy vs. product/GTM",
    description:
      "Is this role primarily about policy writing/engagement, or is it more product-shaped (commercial, licensing, GTM-flavoured)?",
    scale: 5,
    lowLabel: "pure policy/regulatory",
    highLabel: "product / GTM / licensing",
    lowDescription: "Pure policy & regulatory work — writing, engagement, advocacy.",
    highDescription: "Product-shaped — commercial, licensing, GTM-flavoured policy.",
    sortIndex: 3,
  },
  {
    name: "Civic-infrastructure overlap",
    description:
      "How much does the role intersect with public service delivery, government digital infrastructure, or excluded-population access?",
    scale: 5,
    lowLabel: "purely commercial AI",
    highLabel: "high civic-infrastructure overlap",
    lowDescription: "Purely commercial AI — no public-service overlap.",
    highDescription: "High civic-infrastructure overlap — public delivery, gov digital, excluded access.",
    sortIndex: 4,
  },
];

export const seedCompanies: SeedCompany[] = [
  /* ----------------- TIER 1 ---------------------------------------- */
  {
    slug: "anthropic",
    name: "Anthropic",
    tier: 1,
    hq: "San Francisco · London",
    websiteUrl: "https://www.anthropic.com",
    careersUrl: "https://www.anthropic.com/careers",
    policyPageUrl: "https://www.anthropic.com/policy",
    rolesSource: "greenhouse",
    rolesSourceId: "anthropic",
    blogRssUrl: "https://www.anthropic.com/news/rss.xml",
    focusAreas: ["frontier-AI regulation", "safety policy", "EU AI Act"],
    description:
      "Frontier AI lab with a dedicated policy team across SF and London. Large established policy function — specialist roles, deep ties to AISI / NIST / EU AI Office. Live openings include 'Regulatory Counsel, Content & Frontier AI Regulation' partnering directly on EU AI Act engagement.",
    tags: [
      "Frontier lab",
      "US",
      "Hiring policy lead",
      "Established team",
      "Regulatory counsel",
    ],
    roles: [
      {
        title: "Regulatory Counsel, Content & Frontier AI Regulation",
        location: "London, UK",
        url: "https://job-boards.greenhouse.io/anthropic/jobs/5201506008",
        source: "greenhouse",
      },
    ],
  },
  {
    slug: "openai",
    name: "OpenAI",
    tier: 1,
    hq: "San Francisco · London · Brussels · Dublin",
    websiteUrl: "https://openai.com",
    careersUrl: "https://openai.com/careers/",
    policyPageUrl: "https://openai.com/news/global-affairs/",
    blogRssUrl: "https://openai.com/blog/rss.xml",
    focusAreas: ["global affairs", "EU AI Act", "UK AI Bill", "national security"],
    description:
      "Global Affairs is OpenAI's policy umbrella, structured around regional leads (EMEA, UK, US). Many open roles in 2026 including Head of EMEA Global Affairs (London) and UK Policy and Partnerships Lead.",
    tags: ["Frontier lab", "US", "Hiring policy lead", "Established team", "Government affairs"],
    roles: [
      {
        title: "Head of EMEA, Global Affairs",
        location: "London, UK",
        url: "https://openai.com/careers/head-of-emea-global-affairs-london-uk/",
        source: "custom",
      },
      {
        title: "UK Policy and Partnerships Lead, Global Affairs",
        location: "London, UK",
        url: "https://uk.linkedin.com/jobs/view/uk-policy-and-partnerships-lead-global-affairs-at-openai-3646630159",
        source: "custom",
      },
      {
        title: "Europe National Security Lead, Global Affairs",
        location: "Brussels, BE",
        url: "https://be.linkedin.com/jobs/view/europe-national-security-lead-global-affairs-at-openai-4337481958",
        source: "custom",
      },
    ],
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    tier: 1,
    hq: "New York · London",
    websiteUrl: "https://elevenlabs.io",
    careersUrl: "https://elevenlabs.io/careers",
    focusAreas: [
      "voice cloning consent",
      "deepfake & content provenance",
      "licensing frameworks",
      "EU AI Act GPAI",
    ],
    description:
      "Voice-AI scale-up facing genuinely novel policy challenges: consent for voice cloning, content provenance, licensing infrastructure. Public Policy Lead role is a global remit, likely the first major senior policy hire — opportunity to build the team and define firsts.",
    tags: [
      "Voice / media AI",
      "US",
      "Hiring policy lead",
      "First policy hire",
      "Trust & safety",
    ],
    roles: [
      {
        title: "Public Policy Lead",
        location: "New York, US (global remit)",
        url: "https://www.builtinnyc.com/job/public-policy-lead/6945036",
        source: "custom",
      },
      {
        title: "Privacy Counsel",
        location: "Remote",
        url: "https://elevenlabs.io/careers/f591a101-0ffe-44ba-8ff3-a913c86442b6/privacy-counsel",
        source: "custom",
      },
    ],
  },
  {
    slug: "cognition",
    name: "Cognition",
    tier: 2,
    hq: "San Francisco · New York",
    websiteUrl: "https://cognition.ai",
    careersUrl: "https://cognition.ai/careers",
    focusAreas: ["agentic AI", "developer-tools policy"],
    description:
      "Makers of Devin (AI software engineer). Small policy function, if any — most public engagement is product-side. A policy hire here would shape the company's public-facing stance from near-zero, with agentic-AI questions (autonomy, liability, deployment guardrails) all up for grabs.",
    tags: ["Agentic / coding AI", "US", "First policy hire", "Product / GTM"],
  },
  {
    slug: "reflection-ai",
    name: "Reflection AI",
    tier: 2,
    hq: "New York",
    websiteUrl: "https://reflection.ai",
    careersUrl: "https://reflection.ai/careers",
    focusAreas: ["autonomous coding agents", "agentic safety"],
    description:
      "Reflection AI is building autonomous coding agents, founded by ex-DeepMind researchers. Early-stage; likely no senior policy function yet. Would be a true ground-floor role with a research-flavoured product.",
    tags: ["Agentic / coding AI", "US", "First policy hire", "Trust & safety"],
  },

  /* ----------------- TIER 2 (discovered) --------------------------- */
  {
    slug: "google-deepmind",
    name: "Google DeepMind",
    tier: 1,
    hq: "London · Mountain View",
    websiteUrl: "https://deepmind.google",
    careersUrl: "https://deepmind.google/careers/",
    blogRssUrl: "https://deepmind.google/blog/rss.xml",
    focusAreas: [
      "AI governance",
      "frontier safety",
      "international AI cooperation",
    ],
    description:
      "Frontier AI research lab inside Google. London HQ. Large established policy + governance function — high prestige, specialist roles within a deep org. Strategic Planning roles in GenAI policy/governance routinely open.",
    tags: [
      "Frontier lab",
      "UK",
      "Established team",
      "International policy",
    ],
  },
  {
    slug: "mistral",
    name: "Mistral AI",
    tier: 2,
    hq: "Paris",
    websiteUrl: "https://mistral.ai",
    careersUrl: "https://jobs.lever.co/mistral",
    rolesSource: "lever",
    rolesSourceId: "mistral",
    focusAreas: [
      "EU AI Act GPAI",
      "open-weights regulation",
      "European tech sovereignty",
    ],
    description:
      "Europe's flagship frontier-AI company, deeply involved in EU AI Act negotiation and the GPAI Code of Practice. Policy work here means being in the room as European AI governance is written. EU-HQ — natural counterweight to UK-pigeonhole concern.",
    tags: ["Frontier lab", "EU", "Open weights", "Established team", "Regulatory counsel"],
  },
  {
    slug: "huggingface",
    name: "Hugging Face",
    tier: 2,
    hq: "New York · Paris",
    websiteUrl: "https://huggingface.co",
    careersUrl: "https://apply.workable.com/huggingface/",
    blogRssUrl: "https://huggingface.co/blog/feed.xml",
    focusAreas: [
      "open-source AI policy",
      "GPAI obligations",
      "model transparency",
    ],
    description:
      "Open-source AI hub, very active in EU AI Act / GPAI Code discussions on behalf of the open-source community. Public Policy Director Bruna de Castro e Silva and team are visible in EU and US forums. Mission-aligned for someone with open-standards orientation.",
    tags: ["Open weights", "US", "EU", "Established team", "Regulatory counsel"],
  },
  {
    slug: "cohere-aleph-alpha",
    name: "Cohere × Aleph Alpha",
    tier: 2,
    hq: "Toronto · London · Heidelberg",
    websiteUrl: "https://cohere.com",
    careersUrl: "https://cohere.com/careers",
    focusAreas: [
      "enterprise AI policy",
      "sovereign AI",
      "EU AI Act compliance",
      "explainability",
      "data residency",
    ],
    description:
      "Cohere and Aleph Alpha merged April 2026 (~$20B) to build a transatlantic, sovereign-AI-focused enterprise lab. EU compliance + on-prem deployment are the explicit pitch. Policy work here straddles Canada, UK, Germany and EU institutions — unusually broad jurisdictional remit for a single role.",
    tags: ["Frontier lab", "EU", "Open weights", "Regulatory counsel"],
  },
  {
    slug: "wayve",
    name: "Wayve",
    tier: 1,
    hq: "London",
    websiteUrl: "https://wayve.ai",
    careersUrl: "https://wayve.ai/careers/",
    focusAreas: [
      "AV regulation",
      "embodied AI policy",
      "UK Sovereign AI",
      "EU mobility policy",
    ],
    description:
      "UK self-driving / embodied-AI scale-up; the poster child for the £500M UK Sovereign AI Unit and the Action Plan. 'Head of UK and EU Policy' role open — defines the company's external engagement across the UK and EU. Mobility/transport policy specifically.",
    tags: ["Autonomous / mobility", "UK", "Hiring policy lead", "First policy hire", "Regulatory counsel"],
    roles: [
      {
        title: "Head of UK and EU Policy",
        location: "London, UK",
        url: "https://bebee.com/gb/jobs/head-of-uk-and-eu-policy-wayve-london-england--theirstack-688123943",
        source: "custom",
      },
    ],
  },
  {
    slug: "stability-ai",
    name: "Stability AI",
    tier: 3,
    hq: "London",
    websiteUrl: "https://stability.ai",
    careersUrl: "https://stability.ai/careers",
    focusAreas: ["generative-media policy", "Open weights", "copyright"],
    description:
      "Generative-media company. Has been in the centre of copyright/AI litigation. Policy function smaller post-restructure; if hiring, would be a high-pressure role on copyright and content provenance.",
    tags: ["Open weights", "UK", "Regulatory counsel"],
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
      "consent + provenance",
      "enterprise AI ethics",
    ],
    description:
      "London-based synthetic media / AI video platform. Strong enterprise focus and a deliberately conservative content policy (no political/news, strict consent). A policy role would lean heavily into provenance, consent, and content moderation infrastructure.",
    tags: ["Voice / media AI", "UK", "Trust & safety"],
  },
  {
    slug: "faculty-ai",
    name: "Faculty AI",
    tier: 3,
    hq: "London",
    websiteUrl: "https://faculty.ai",
    careersUrl: "https://faculty.ai/careers",
    focusAreas: [
      "AI for government",
      "UK public sector",
      "AI Safety Institute partnerships",
    ],
    description:
      "Applied-AI consultancy with deep UK government contracts (incl. former AI Safety Institute work). Less a pure 'lab' more an AI-for-government delivery org. Heaviest UK-pigeonhole risk on this list — but maximal civic-infrastructure overlap.",
    tags: ["UK", "Government affairs"],
  },
  {
    slug: "xai",
    name: "xAI",
    tier: 3,
    hq: "San Francisco · Memphis",
    websiteUrl: "https://x.ai",
    careersUrl: "https://x.ai/careers",
    focusAreas: ["frontier AI", "free-speech framing", "compute infrastructure"],
    description:
      "Elon Musk's frontier-AI lab. Public stance leans anti-regulation and free-speech-framed. Policy function exists but heavily influenced by founder politics. Worth mapping for completeness; fit depends heavily on political comfort.",
    tags: ["Frontier lab", "US", "Government affairs"],
  },
  {
    slug: "thinking-machines",
    name: "Thinking Machines Lab",
    tier: 2,
    hq: "San Francisco",
    websiteUrl: "https://thinkingmachines.ai",
    careersUrl: "https://thinkingmachines.ai/careers",
    focusAreas: ["frontier AI research", "alignment"],
    description:
      "Mira Murati's new frontier-AI lab. Very early stage; likely no policy function yet. Pure greenfield for someone wanting to define the policy stance of a brand-new lab.",
    tags: ["Frontier lab", "US", "First policy hire", "Trust & safety"],
  },
  {
    slug: "anysphere",
    name: "Anysphere (Cursor)",
    tier: 3,
    hq: "San Francisco · New York",
    websiteUrl: "https://anysphere.inc",
    careersUrl: "https://anysphere.inc/careers",
    focusAreas: ["developer-tools policy", "AI-in-coding"],
    description:
      "Maker of Cursor. Massive growth but very engineering-focused; no visible senior policy hire yet. A policy role would help define enterprise procurement and IP positioning as Cursor scales into regulated industries.",
    tags: ["Agentic / coding AI", "US", "First policy hire", "Product / GTM"],
  },
  {
    slug: "physical-intelligence",
    name: "Physical Intelligence",
    tier: 3,
    hq: "San Francisco",
    websiteUrl: "https://physicalintelligence.company",
    careersUrl: "https://physicalintelligence.company/careers",
    focusAreas: ["embodied AI / robotics policy"],
    description:
      "Robotics + foundation models. Embodied-AI policy is a near-empty space; high regulatory novelty, deep technical demand. Almost certainly no policy function yet.",
    tags: ["US", "First policy hire", "Regulatory counsel"],
  },

  /* ----------------- EUROPE ---------------------------------------- */
  {
    slug: "black-forest-labs",
    name: "Black Forest Labs",
    tier: 2,
    hq: "Freiburg / Munich",
    websiteUrl: "https://blackforestlabs.ai",
    careersUrl: "https://blackforestlabs.ai/careers",
    focusAreas: [
      "generative image policy",
      "EU AI Act GPAI",
      "German tech sovereignty",
      "content provenance",
    ],
    description:
      "Stability-AI alumni building open generative image/video models from Germany. Heavy German government and EU policy attention given the sovereign-AI narrative. A policy hire would shape content provenance and GPAI obligations from inside the EU's flagship generative-media lab.",
    tags: ["Frontier lab", "EU", "Open weights", "First policy hire", "Trust & safety"],
  },
  {
    slug: "helsing",
    name: "Helsing",
    tier: 3,
    hq: "Munich · London · Paris",
    websiteUrl: "https://helsing.ai",
    careersUrl: "https://helsing.ai/careers",
    focusAreas: [
      "defence AI policy",
      "export controls",
      "European sovereignty",
      "dual-use regulation",
    ],
    description:
      "European defence-AI scale-up. Policy here means defence procurement, export controls, dual-use frameworks, NATO interoperability — a very different policy world than commercial AI. Worth flagging because it's a clear off-ramp from frontier-lab work; possibly mismatched with civic-infrastructure interests.",
    tags: ["EU", "Government affairs"],
  },
  {
    slug: "deepl",
    name: "DeepL",
    tier: 3,
    hq: "Cologne",
    websiteUrl: "https://www.deepl.com",
    careersUrl: "https://jobs.deepl.com/en",
    focusAreas: [
      "language AI policy",
      "EU data residency",
      "enterprise compliance",
    ],
    description:
      "German translation-AI scale-up serving large EU and global enterprise customers. Policy work would centre on data residency, EU enterprise AI compliance, and language-tech procurement standards. Smaller policy footprint than frontier labs but a stable established product.",
    tags: ["EU", "International policy"],
  },
  {
    slug: "silo-ai",
    name: "Silo AI / AMD",
    tier: 3,
    hq: "Helsinki",
    websiteUrl: "https://silo.ai",
    careersUrl: "https://silo.ai/careers",
    focusAreas: [
      "sovereign AI",
      "EU multilingual models",
      "public sector AI",
    ],
    description:
      "Nordic applied-AI shop acquired by AMD (2024). Builds the Poro / Viking multilingual open-source models with the EuroLLM consortium — explicit EU sovereignty play. Has hired Policy Analyst / EU Partnership Lead roles. Civic-infrastructure overlap is unusually high.",
    tags: ["EU", "Open weights", "International policy"],
  },
  {
    slug: "photoroom",
    name: "Photoroom",
    tier: 3,
    hq: "Paris",
    websiteUrl: "https://www.photoroom.com",
    careersUrl: "https://www.photoroom.com/careers",
    focusAreas: ["generative image policy", "creator IP", "SMB AI"],
    description:
      "Paris-based generative image scale-up serving creators and SMBs. Smaller and less policy-active than Black Forest, but interesting if you want a more product-shaped role inside a French AI champion.",
    tags: ["EU", "Regulatory counsel"],
  },
  {
    slug: "sakana-ai",
    name: "Sakana AI",
    tier: 3,
    hq: "Tokyo",
    websiteUrl: "https://sakana.ai",
    careersUrl: "https://sakana.ai/careers",
    focusAreas: [
      "Japanese AI policy",
      "public sector AI",
      "international AI cooperation",
    ],
    description:
      "Tokyo-based frontier lab founded by ex-Google researchers. Works closely with Japanese government and large enterprises. Policy here means being a bridge between Japanese public policy and the international frontier-AI conversation — unusual remit, narrow geography.",
    tags: ["Frontier lab", "International policy"],
  },

  /* ----------------- US (more) ------------------------------------- */
  {
    slug: "scale-ai",
    name: "Scale AI",
    tier: 2,
    hq: "San Francisco",
    websiteUrl: "https://scale.com",
    careersUrl: "https://scale.com/careers",
    rolesSource: "greenhouse",
    rolesSourceId: "scaleai",
    focusAreas: [
      "US national security AI",
      "data labelling labour policy",
      "AI evaluation",
      "Meta-Scale acquihire",
    ],
    description:
      "Data labelling + AI evaluation platform; subject of Meta's 2025 acqui-hire (Alex Wang and senior team moved). Active policy footprint around US national-security AI and labour practices. Genuine FTC scrutiny means policy work here is high-stakes.",
    tags: ["US", "Established team", "Government affairs"],
  },
  {
    slug: "perplexity",
    name: "Perplexity",
    tier: 3,
    hq: "San Francisco",
    websiteUrl: "https://www.perplexity.ai",
    careersUrl: "https://www.perplexity.ai/careers",
    focusAreas: [
      "AI search policy",
      "publisher relations",
      "content licensing",
      "news/media policy",
    ],
    description:
      "AI-native search. Hot policy zone: publisher disputes, content licensing, news/media relations. A policy hire here would deal with newsroom partnerships and IP frameworks more than frontier-AI questions.",
    tags: ["US", "Product / GTM"],
  },
  {
    slug: "runway",
    name: "Runway",
    tier: 3,
    hq: "New York",
    websiteUrl: "https://runwayml.com",
    careersUrl: "https://runwayml.com/careers",
    focusAreas: [
      "generative video policy",
      "Hollywood relations",
      "copyright",
      "creator IP",
    ],
    description:
      "Generative video, deep ties to Hollywood/Lionsgate. Policy lives at the intersection of entertainment industry, copyright, and synthetic media. Cultural fluency matters as much as regulatory fluency.",
    tags: ["Voice / media AI", "US", "Trust & safety"],
  },
  {
    slug: "suno",
    name: "Suno",
    tier: 3,
    hq: "Cambridge, MA",
    websiteUrl: "https://suno.com",
    careersUrl: "https://suno.com/careers",
    focusAreas: [
      "music AI policy",
      "copyright litigation",
      "label relations",
      "songwriter rights",
    ],
    description:
      "AI music generation, centre of the RIAA copyright lawsuits. Warner settled Nov 2025; Sony still litigating. Policy work here is litigation-shaped — settlements, licensing frameworks, songwriter/publisher relations. A hot, hostile, defining space.",
    tags: ["Voice / media AI", "US", "Hiring policy lead", "First policy hire", "Regulatory counsel"],
  },
  {
    slug: "character-ai",
    name: "Character.AI",
    tier: 3,
    hq: "Menlo Park",
    websiteUrl: "https://character.ai",
    careersUrl: "https://character.ai/careers",
    focusAreas: [
      "AI safety for consumers",
      "youth protection",
      "DOJ scrutiny",
      "product policy",
    ],
    description:
      "Consumer AI companion product. Heavy product-policy lift around youth safety, content moderation, and ongoing DOJ analysis of the Google deal. A policy role here is product-shaped, high-pressure, real-stakes safety work.",
    tags: ["US", "Trust & safety"],
  },
  {
    slug: "groq",
    name: "Groq",
    tier: 3,
    hq: "Mountain View",
    websiteUrl: "https://groq.com",
    careersUrl: "https://groq.com/careers",
    focusAreas: [
      "AI infrastructure policy",
      "compute / energy",
      "chip export controls",
    ],
    description:
      "Specialised AI inference chips. Policy work here is hardware-shaped: export controls, energy regulation, US-China compute competition. Adjacent to but distinct from frontier-model policy.",
    tags: ["US", "Government affairs"],
  },
  {
    slug: "cerebras",
    name: "Cerebras",
    tier: 3,
    hq: "Sunnyvale",
    websiteUrl: "https://www.cerebras.ai",
    careersUrl: "https://www.cerebras.ai/careers",
    focusAreas: [
      "AI chip policy",
      "export controls",
      "sovereign infrastructure",
    ],
    description:
      "Wafer-scale AI chip company with significant Gulf-state deployment partnerships. Policy work straddles US export controls and international sovereign-compute deals. Niche but structurally important.",
    tags: ["US", "Government affairs"],
  },
];

export const seedUserProfile = {
  displayName: "Aadi Kulkarni",
  headline:
    "International policy officer at Coinbase. Government digitisation, regulatory infrastructure, public-service accessibility.",
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
    "UK-pigeonhole risk: is this role too UK-focused for someone wanting an international career?",
    "Charting the unknown: would this role be more fun if it's defining first-of-its-kind policy, vs joining an established system?",
    "Policy vs GTM-flavoured policy: how product-shaped is the role?",
    "Cog vs build: large established team, or early enough to build the function?",
  ],
  sources: [
    "https://github.com/nwspk/politech-awards-2026 (PR #73, branch project-mirror-v2/aadi-kulkarni)",
    "research/profile-user.md",
  ],
};

/**
 * Hand-picked scores for the 30 seeded companies on the 5 scale-kind frames.
 * Keyed by company slug → frame name → 1..5 (matching `seedFrames[].scale`).
 *
 * Editorial scoring guide (each frame anchored by its low/high labels):
 *   UK-pigeonhole risk:           1 clearly international → 5 very UK-bound
 *   Charting the unknown:         1 well-mapped → 5 frontier / first-of-its-kind
 *   Cog vs. build-the-team:       1 established team → 5 first/early policy hire
 *   Policy vs. product/GTM:       1 pure policy → 5 product / GTM / licensing
 *   Civic-infrastructure overlap: 1 purely commercial → 5 high civic overlap
 *
 * Scores reflect the company `description` text + role context. Each is one
 * editor's read; the point is to have *something* on the map so axis swaps and
 * filters actually do work. Aadi can re-score from `/companies/[slug]`.
 */
export const seedFrameScores: Record<string, Record<string, number>> = {
  anthropic: { "UK-pigeonhole risk": 2, "Charting the unknown": 4, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 1, "Civic-infrastructure overlap": 2 },
  openai: { "UK-pigeonhole risk": 2, "Charting the unknown": 4, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 2 },
  elevenlabs: { "UK-pigeonhole risk": 2, "Charting the unknown": 5, "Cog vs. build-the-team": 4, "Policy vs. product/GTM": 3, "Civic-infrastructure overlap": 2 },
  cognition: { "UK-pigeonhole risk": 1, "Charting the unknown": 5, "Cog vs. build-the-team": 5, "Policy vs. product/GTM": 4, "Civic-infrastructure overlap": 1 },
  "reflection-ai": { "UK-pigeonhole risk": 1, "Charting the unknown": 5, "Cog vs. build-the-team": 5, "Policy vs. product/GTM": 4, "Civic-infrastructure overlap": 1 },
  "google-deepmind": { "UK-pigeonhole risk": 4, "Charting the unknown": 4, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 1, "Civic-infrastructure overlap": 2 },
  mistral: { "UK-pigeonhole risk": 1, "Charting the unknown": 4, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 2 },
  huggingface: { "UK-pigeonhole risk": 1, "Charting the unknown": 3, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 1, "Civic-infrastructure overlap": 3 },
  "cohere-aleph-alpha": { "UK-pigeonhole risk": 3, "Charting the unknown": 3, "Cog vs. build-the-team": 3, "Policy vs. product/GTM": 3, "Civic-infrastructure overlap": 2 },
  wayve: { "UK-pigeonhole risk": 4, "Charting the unknown": 5, "Cog vs. build-the-team": 4, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 3 },
  "stability-ai": { "UK-pigeonhole risk": 4, "Charting the unknown": 4, "Cog vs. build-the-team": 3, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 2 },
  synthesia: { "UK-pigeonhole risk": 4, "Charting the unknown": 4, "Cog vs. build-the-team": 3, "Policy vs. product/GTM": 3, "Civic-infrastructure overlap": 2 },
  "faculty-ai": { "UK-pigeonhole risk": 5, "Charting the unknown": 2, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 5 },
  xai: { "UK-pigeonhole risk": 1, "Charting the unknown": 3, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 1 },
  "thinking-machines": { "UK-pigeonhole risk": 1, "Charting the unknown": 5, "Cog vs. build-the-team": 5, "Policy vs. product/GTM": 1, "Civic-infrastructure overlap": 2 },
  anysphere: { "UK-pigeonhole risk": 1, "Charting the unknown": 4, "Cog vs. build-the-team": 5, "Policy vs. product/GTM": 5, "Civic-infrastructure overlap": 1 },
  "physical-intelligence": { "UK-pigeonhole risk": 1, "Charting the unknown": 5, "Cog vs. build-the-team": 5, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 2 },
  "black-forest-labs": { "UK-pigeonhole risk": 1, "Charting the unknown": 4, "Cog vs. build-the-team": 4, "Policy vs. product/GTM": 3, "Civic-infrastructure overlap": 2 },
  helsing: { "UK-pigeonhole risk": 2, "Charting the unknown": 4, "Cog vs. build-the-team": 3, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 4 },
  deepl: { "UK-pigeonhole risk": 1, "Charting the unknown": 2, "Cog vs. build-the-team": 3, "Policy vs. product/GTM": 3, "Civic-infrastructure overlap": 3 },
  "silo-ai": { "UK-pigeonhole risk": 1, "Charting the unknown": 3, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 5 },
  photoroom: { "UK-pigeonhole risk": 1, "Charting the unknown": 2, "Cog vs. build-the-team": 4, "Policy vs. product/GTM": 4, "Civic-infrastructure overlap": 1 },
  "sakana-ai": { "UK-pigeonhole risk": 1, "Charting the unknown": 4, "Cog vs. build-the-team": 4, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 3 },
  "scale-ai": { "UK-pigeonhole risk": 1, "Charting the unknown": 3, "Cog vs. build-the-team": 2, "Policy vs. product/GTM": 3, "Civic-infrastructure overlap": 3 },
  perplexity: { "UK-pigeonhole risk": 1, "Charting the unknown": 4, "Cog vs. build-the-team": 4, "Policy vs. product/GTM": 4, "Civic-infrastructure overlap": 2 },
  runway: { "UK-pigeonhole risk": 1, "Charting the unknown": 3, "Cog vs. build-the-team": 4, "Policy vs. product/GTM": 4, "Civic-infrastructure overlap": 1 },
  suno: { "UK-pigeonhole risk": 1, "Charting the unknown": 4, "Cog vs. build-the-team": 4, "Policy vs. product/GTM": 3, "Civic-infrastructure overlap": 1 },
  "character-ai": { "UK-pigeonhole risk": 1, "Charting the unknown": 3, "Cog vs. build-the-team": 3, "Policy vs. product/GTM": 5, "Civic-infrastructure overlap": 2 },
  groq: { "UK-pigeonhole risk": 1, "Charting the unknown": 3, "Cog vs. build-the-team": 3, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 3 },
  cerebras: { "UK-pigeonhole risk": 1, "Charting the unknown": 3, "Cog vs. build-the-team": 3, "Policy vs. product/GTM": 2, "Civic-infrastructure overlap": 3 },
};

/* ------------------------------------------------------------------ */
/* Seed publications                                                  */
/* ------------------------------------------------------------------ */

export type SeedPublication = {
  type: "blog" | "press" | "filing" | "paper" | "other";
  title: string;
  url: string;
  /** ISO-8601 date (UTC). */
  publishedAt: string;
  summary?: string;
  topics?: string[];
};

/**
 * Hand-picked publications to populate the tracker. Keyed by company slug.
 * Weighted toward higher-signal companies so the tracker *demonstrates* the
 * surface rather than evenly-sparse noise.
 *
 * Selection rule: canonical, well-cited posts with stable URLs. Real titles,
 * real dates, real URLs. Summaries are one editorial sentence each; topics
 * mirror the kind of free-text tagging the v0.4 ingestion pipeline will
 * eventually produce.
 */
export const seedPublications: Record<string, SeedPublication[]> = {
  anthropic: [
    {
      type: "filing",
      title: "Anthropic's Responsible Scaling Policy",
      url: "https://www.anthropic.com/news/anthropics-responsible-scaling-policy",
      publishedAt: "2023-09-19",
      summary:
        "Frontier-lab safety commitments tied to model capability thresholds (ASL levels); a template that shaped later voluntary policy frameworks.",
      topics: ["frontier safety", "voluntary commitments", "capability thresholds"],
    },
    {
      type: "blog",
      title: "Core Views on AI Safety: When, Why, What, and How",
      url: "https://www.anthropic.com/news/core-views-on-ai-safety",
      publishedAt: "2023-03-08",
      summary:
        "Anthropic's worldview statement on transformative AI risk and the policy posture that follows from it.",
      topics: ["AI safety", "worldview", "policy posture"],
    },
    {
      type: "blog",
      title: "Claude's Constitution",
      url: "https://www.anthropic.com/news/claudes-constitution",
      publishedAt: "2023-05-09",
      summary:
        "The principles guiding Constitutional AI training, including how Claude is steered around harmful content and political topics.",
      topics: ["constitutional AI", "alignment", "model behaviour"],
    },
  ],
  openai: [
    {
      type: "blog",
      title: "Planning for AGI and beyond",
      url: "https://openai.com/index/planning-for-agi-and-beyond/",
      publishedAt: "2023-02-24",
      summary:
        "OpenAI's long-horizon thinking on transitioning to AGI and the governance posture they hope partners and regulators will adopt.",
      topics: ["AGI", "governance", "long-term planning"],
    },
    {
      type: "blog",
      title: "Governance of superintelligence",
      url: "https://openai.com/index/governance-of-superintelligence/",
      publishedAt: "2023-05-22",
      summary:
        "A proposal for international coordination on frontier AI, including an IAEA-style oversight body.",
      topics: ["international governance", "superintelligence", "oversight"],
    },
    {
      type: "blog",
      title: "Our approach to AI safety",
      url: "https://openai.com/index/our-approach-to-ai-safety/",
      publishedAt: "2023-04-05",
      summary:
        "OpenAI's safety practices in deployment: red-teaming, child-safety, privacy, and accuracy commitments.",
      topics: ["deployment safety", "red-teaming", "child safety"],
    },
  ],
  "google-deepmind": [
    {
      type: "filing",
      title: "Introducing the Frontier Safety Framework",
      url: "https://deepmind.google/discover/blog/introducing-the-frontier-safety-framework/",
      publishedAt: "2024-05-17",
      summary:
        "DeepMind's first-pass framework for identifying and mitigating frontier model risk, paralleling Anthropic's RSP.",
      topics: ["frontier safety", "framework", "capability evaluations"],
    },
  ],
  huggingface: [
    {
      type: "blog",
      title:
        "AI Policy @\uD83E\uDD17: Open ML Considerations in the EU AI Act",
      url: "https://huggingface.co/blog/eu-ai-act-oss",
      publishedAt: "2023-07-25",
      summary:
        "Open-source-leaning analysis of how the EU AI Act's tiered obligations land on open ML projects.",
      topics: ["EU AI Act", "open source", "compliance"],
    },
    {
      type: "blog",
      title: "Ethics and Society Newsletter #1",
      url: "https://huggingface.co/blog/ethics-soc-1",
      publishedAt: "2022-09-22",
      summary:
        "First in HF's ongoing ethics-and-society series, framing how the company thinks about model harm at scale.",
      topics: ["ethics", "society", "newsletter"],
    },
  ],
  mistral: [
    {
      type: "press",
      title: "Cheaper, Better, Faster, Stronger \u2014 Continuing to push the frontier of AI and making it accessible to all",
      url: "https://mistral.ai/news/mixtral-8x22b/",
      publishedAt: "2024-04-17",
      summary:
        "Mixtral 8x22B launch \u2014 Mistral's most capable open-weights model at the time, framed around accessibility and openness.",
      topics: ["model release", "open weights", "frontier"],
    },
  ],
};

