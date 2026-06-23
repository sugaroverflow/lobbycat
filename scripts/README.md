# scripts/

Operational scripts for the v0.6 build. All read `.env.local` for
`DATABASE_URL` and the runtime env for `ANTHROPIC_API_KEY`.

Run with: `npx tsx scripts/<name>.ts`

| Script | Purpose |
|---|---|
| `apply-migrations.ts <file.sql> [...]` | Apply specific `drizzle/*.sql` migration files statement-by-statement, idempotent on "already exists". Use when `db:push` is overkill. |
| `seed-evidence.ts` | Re-run the curated consultations + safety-frameworks ingestion pipelines from their seed JSON. |
| `rescore-all.ts` | Full re-curation: every (company × frame) cell, in batches. Env: `RESCORE_BATCH` (default 6), `RESCORE_LIMIT`, `ONLY_FALLBACK=1`. Writes `docs/recuration-v0.6.csv`. |
| `audit-recuration.ts` | Confidence / score distribution + zero-citation cells. |
| `spot-check.ts` | High-signal slug spot-check (rationales for anthropic/google-deepmind/openai/wayve/…). |
