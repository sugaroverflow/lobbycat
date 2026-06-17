# 🐱 lobbycat

An interactive map of where AI-policy companies sit on the scales that matter to you.

Sort it however you want. Re-define the scales whenever your thinking changes. The cat keeps up.

## What it does

For someone reviewing AI policy roles across companies, lobbycat surfaces:

- **Companies** across UK, EU, US, and beyond — with their HQs, focus areas, and tags.
- **Open policy roles** pulled from each company's ATS (Greenhouse / Lever / Ashby) or hand-curated where there's no public API.
- **Recent policy publications** — blog posts, press releases, filings, papers.
- **Lobbying footprint** — EU Transparency Register, US LDA filings (planned).
- **Your subjective layer** — tags, scores, free-text notes per company, and **frames**: custom evaluation axes you define, score companies on, and re-rank by as your thinking evolves.
- **The Map** — a 2D plot of every company on any two of your frames. Drag axes, filter chips, hover for detail.
- **Fit notes** — a short, bulleted "lobbycat says ❤" panel per company, grounded in your profile + the company's specifics. Ask follow-ups; the cat answers.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Vercel                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Next.js 16 (App Router, TS, Tailwind v4)             │   │
│  │                                                       │   │
│  │   /              Map + Tracker dashboard             │   │
│  │   /companies     Tiered list                         │   │
│  │   /companies/[s] Detail + frames + fit-note chat     │   │
│  │   /frames        Frames CRUD (scale/tag/question)    │   │
│  │   /compare       Side-by-side                        │   │
│  │   /about         Editable profile                    │   │
│  │   /login         Password gate                       │   │
│  │                                                       │   │
│  │   Server actions for all writes                       │   │
│  │   Middleware: cookie-based auth                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Vercel Cron (daily 06:00 UTC) — refresh roles + posts      │
└──────────────────────────────────────────────────────────────┘
          │                                    │
          │ Drizzle ORM                        │ Anthropic API
          ▼                                    ▼
┌──────────────────────┐                ┌──────────────────────┐
│   Neon Postgres      │                │   Claude Sonnet 4.5  │
│   (eu-west-2)        │                │   - Fit-note bullets │
│                      │                │   - Chat follow-ups  │
│   12+ tables         │                │   - Frame suggesting │
└──────────────────────┘                └──────────────────────┘
```

## Stack

- **Framework:** Next.js 16 App Router + TypeScript
- **Styling:** Tailwind v4 with custom `@theme` tokens (Earthcore palette: warm cream, moss, sage, ochre, terracotta)
- **Type:** Fraunces (serif, narrative copy) · Inter (UI sans) · Geist Mono (data labels)
- **Database:** Postgres on Neon (London, `eu-west-2`)
- **ORM:** Drizzle (no magic, fully typed)
- **Auth:** Cookie-based password gate (v0.3); magic-link via Resend on the roadmap
- **Hosting:** Vercel (Hobby tier)
- **Cron:** Vercel Cron for daily refresh
- **Agent:** Anthropic Claude Sonnet 4.5 with structured outputs for fit-notes and conversational follow-ups
- **Jobs feed:** Greenhouse / Lever / Ashby APIs (planned for v0.4)
- **Content feed:** RSS / sitemap (planned for v0.4)
- **Lobbying data:** EU Transparency Register CSV + US LDA via OpenSecrets (planned for v0.5)

## Data model

Drizzle schema in [`src/db/schema.ts`](src/db/schema.ts). High level:

| Table | Purpose |
|---|---|
| `companies` | Name, HQ, tier, focus areas, status, score, notes, refresh metadata |
| `roles` | Open positions per company (from ATS or manual) |
| `people` | Known policy team members (surfaced, not scraped) |
| `publications` | Blog / press / filing / paper with Claude-summarised topic + 1-sentence takeaway |
| `lobbying_records` | Per company, jurisdiction, period, spend, topics |
| `tags` + `company_tags` | Coloured taxonomic labels |
| `frames` + `frame_scores` | Custom evaluation axes (1–5) and user's scores per company |
| `frame_answers` | Free-text answers for question-kind frames |
| `user_profile` | Single-row bio, concerns, weights — grounds fit notes |
| `fit_notes` | Cached bulleted fit-notes per (company, profile-version) |
| `fit_note_messages` | Chat thread per company between user and cat |
| `agent_runs` | Audit log of agent interactions |

## Routes

| Path | Purpose |
|---|---|
| `/` | Map + Tracker dashboard |
| `/companies` | Tiered list view |
| `/companies/[slug]` | Company detail + frame scoring + fit-note chat |
| `/compare` | Side-by-side comparison on user frames |
| `/frames` | Frames CRUD (scale / tag / question) |
| `/about` | Profile editor |
| `/login` | Password gate |

## Project structure

```
/
├── docs/
│   ├── DESIGN.md              # Design system (palette, type, components)
│   ├── IMPLEMENTATION.md      # Initial spec (v0.1)
│   ├── REFACTOR-v0.3.md       # The current refactor plan
│   ├── V03-BRIEF.md           # User's verbatim brief for v0.3
│   └── journal/
│       └── YYYY-MM-DD.md      # Daily build journal
├── drizzle/                   # Generated migrations
├── public/
│   └── cat/lobbycat.png       # The mascot
├── research/                  # Grounding profile + research notes
├── src/
│   ├── app/                   # Routes + server actions
│   ├── components/            # React components
│   ├── db/                    # Drizzle schema, seed, queries
│   ├── lib/                   # Query helpers, utilities
│   └── middleware.ts          # Auth gate
└── drizzle.config.ts
```

## Local development

```bash
npm install
npm run db:push           # Apply schema to your Neon DB
npm run db:seed           # Seed companies, tags, frames, profile
npm run dev               # http://localhost:3000
```

Env vars required (`.env.local`):

```
DATABASE_URL=postgresql://...    # Neon
ANTHROPIC_API_KEY=sk-ant-...     # For fit-notes and chat
LOBBYCAT_PASSWORD=...            # Shared password gate
```

## Roadmap

| Version | Theme | Status |
|---|---|---|
| v0.1 | Walking skeleton | ✅ shipped 2026-06-17 |
| v0.2 | 30 companies + /about + name greet | ✅ shipped 2026-06-17 |
| **v0.3** | **Editable frames + Map + Tracker + cat** | 🚧 in progress |
| v0.4 | Live job feeds + daily cron | planned |
| v0.5 | Lobbying data (EU + US) | planned |
| v0.6 | Magic-link auth (Resend) | planned |
| v0.7 | Agent chat with DB tool-calling | planned |

See [`docs/REFACTOR-v0.3.md`](docs/REFACTOR-v0.3.md) for the current build plan and [`docs/journal/`](docs/journal/) for daily progress.

## License

Private repo. All rights reserved.
