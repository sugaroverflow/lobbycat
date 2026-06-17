# 🐱 lobbycat

A quiet dashboard for loud decisions.

Track AI policy roles, teams, publications, and lobbying footprints across companies. Apply your own subjective frames (e.g. "UK-pigeonholed?", "team-building scope?") to compare and re-rank as your thinking evolves.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Postgres on Neon, Drizzle ORM
- Auth: magic link via Resend
- Hosted on Vercel
- Daily refresh via Vercel Cron
- In-app agent powered by Claude (tool-calling against the DB + fresh research)

## Status

🛠 Under construction. No surprises spoiled in this README.

## Dev

```bash
npm install
npm run dev
```
