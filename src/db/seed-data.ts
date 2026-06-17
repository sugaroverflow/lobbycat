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
  { label: "frontier-lab", color: "#406896" },
  { label: "UK-HQ", color: "#1C6C34" },
  { label: "EU-HQ", color: "#406896" },
  { label: "US-HQ", color: "#B85048" },
  { label: "hiring-policy", color: "#B85048" },
  { label: "first-policy-hire", color: "#1C6C34" },
  { label: "established-policy-team", color: "#4A5260" },
  { label: "voice-AI", color: "#406896" },
  { label: "self-driving", color: "#406896" },
  { label: "open-weights", color: "#1C6C34" },
  { label: "agentic", color: "#406896" },
];

export const seedFrames = [
  {
    name: "UK-pigeonhole risk",
    description:
      "How much would taking this role tie you to UK-only policy work? Higher = more UK-bound; lower = clearly international remit.",
    scale: 5,
    lowLabel: "clearly international",
    highLabel: "very UK-bound",
    sortIndex: 0,
  },
  {
    name: "Charting the unknown",
    description:
      "Is the work treading well-mapped ground, or is the company facing first-of-its-kind regulatory questions you'd help define?",
    scale: 5,
    lowLabel: "well-mapped territory",
    highLabel: "frontier / first-of-its-kind",
    sortIndex: 1,
  },
  {
    name: "Cog vs. build-the-team",
    description:
      "Are you joining a large established policy operation (cog in a system) or building the policy function from early days?",
    scale: 5,
    lowLabel: "established team, specialist role",
    highLabel: "first/early policy hire, build the team",
    sortIndex: 2,
  },
  {
    name: "Policy vs. product/GTM",
    description:
      "Is this role primarily about policy writing/engagement, or is it more product-shaped (commercial, licensing, GTM-flavoured)?",
    scale: 5,
    lowLabel: "pure policy/regulatory",
    highLabel: "product / GTM / licensing",
    sortIndex: 3,
  },
  {
    name: "Civic-infrastructure overlap",
    description:
      "How much does the role intersect with public service delivery, government digital infrastructure, or excluded-population access?",
    scale: 5,
    lowLabel: "purely commercial AI",
    highLabel: "high civic-infrastructure overlap",
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
    focusAreas: ["frontier-AI regulation", "safety policy", "EU AI Act"],
    description:
      "Frontier AI lab with a dedicated policy team across SF and London. Large established policy function — specialist roles, deep ties to AISI / NIST / EU AI Office. Live openings include 'Regulatory Counsel, Content & Frontier AI Regulation' partnering directly on EU AI Act engagement.",
    tags: [
      "frontier-lab",
      "US-HQ",
      "hiring-policy",
      "established-policy-team",
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
    focusAreas: ["global affairs", "EU AI Act", "UK AI Bill", "national security"],
    description:
      "Global Affairs is OpenAI's policy umbrella, structured around regional leads (EMEA, UK, US). Many open roles in 2026 including Head of EMEA Global Affairs (London) and UK Policy and Partnerships Lead.",
    tags: ["frontier-lab", "US-HQ", "hiring-policy", "established-policy-team"],
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
      "voice-AI",
      "US-HQ",
      "hiring-policy",
      "first-policy-hire",
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
    tags: ["agentic", "US-HQ", "first-policy-hire"],
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
    tags: ["agentic", "US-HQ", "first-policy-hire"],
  },

  /* ----------------- TIER 2 (discovered) --------------------------- */
  {
    slug: "google-deepmind",
    name: "Google DeepMind",
    tier: 1,
    hq: "London · Mountain View",
    websiteUrl: "https://deepmind.google",
    careersUrl: "https://deepmind.google/careers/",
    focusAreas: [
      "AI governance",
      "frontier safety",
      "international AI cooperation",
    ],
    description:
      "Frontier AI research lab inside Google. London HQ. Large established policy + governance function — high prestige, specialist roles within a deep org. Strategic Planning roles in GenAI policy/governance routinely open.",
    tags: [
      "frontier-lab",
      "UK-HQ",
      "established-policy-team",
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
    tags: ["frontier-lab", "EU-HQ", "open-weights", "established-policy-team"],
  },
  {
    slug: "huggingface",
    name: "Hugging Face",
    tier: 2,
    hq: "New York · Paris",
    websiteUrl: "https://huggingface.co",
    careersUrl: "https://apply.workable.com/huggingface/",
    focusAreas: [
      "open-source AI policy",
      "GPAI obligations",
      "model transparency",
    ],
    description:
      "Open-source AI hub, very active in EU AI Act / GPAI Code discussions on behalf of the open-source community. Public Policy Director Bruna de Castro e Silva and team are visible in EU and US forums. Mission-aligned for someone with open-standards orientation.",
    tags: ["open-weights", "US-HQ", "EU-HQ", "established-policy-team"],
  },
  {
    slug: "cohere",
    name: "Cohere",
    tier: 3,
    hq: "Toronto · London",
    websiteUrl: "https://cohere.com",
    careersUrl: "https://cohere.com/careers",
    focusAreas: ["enterprise AI policy", "data residency", "Canada AI"],
    description:
      "Enterprise-focused frontier lab. Smaller policy footprint than US labs; significant Canadian and UK presence. Less attention internationally, but could offer broader-scope roles.",
    tags: ["frontier-lab"],
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
    tags: ["self-driving", "UK-HQ", "hiring-policy", "first-policy-hire"],
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
    focusAreas: ["generative-media policy", "open-weights", "copyright"],
    description:
      "Generative-media company. Has been in the centre of copyright/AI litigation. Policy function smaller post-restructure; if hiring, would be a high-pressure role on copyright and content provenance.",
    tags: ["open-weights", "UK-HQ"],
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
    tags: ["voice-AI", "UK-HQ"],
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
    tags: ["UK-HQ"],
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
    tags: ["frontier-lab", "US-HQ"],
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
    tags: ["frontier-lab", "US-HQ", "first-policy-hire"],
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
    tags: ["agentic", "US-HQ", "first-policy-hire"],
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
    tags: ["US-HQ", "first-policy-hire"],
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
