/**
 * Consultation submissions ingestion (v0.6 Step 10).
 *
 * Reads the hand-curated `src/db/consultations-seed.json`, resolves each
 * entry against the `companies` table by slug, and upserts into
 * `consultation_submissions` (uniq on companyId + consultationName).
 *
 * No external API calls — this is a curated seed pipeline. Future
 * iteration may add a scraper for gov.uk consultation listings, in which
 * case it should write rows with `source = 'scraped'`. The scoring
 * engine treats both kinds identically.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, consultationSubmissions } from "@/db/schema";

export type SeedEntry = {
  slug: string;
  regulator: string;
  jurisdiction: string;
  consultationName: string;
  submittedAt?: string | null;
  url?: string | null;
  summary?: string | null;
  topics?: string[];
  rawExcerpt?: string | null;
};

export type IngestResult = {
  source: "curated";
  totalSeedEntries: number;
  matchedCompanies: number;
  inserted: number;
  updated: number;
  skipped: number; // unknown slug
  unknownSlugs: string[];
  perSlug: Array<{ slug: string; inserted: number; updated: number }>;
};

const DEFAULT_SEED_PATH = path.join(
  process.cwd(),
  "src",
  "db",
  "consultations-seed.json",
);

export async function loadSeedFile(seedPath: string = DEFAULT_SEED_PATH): Promise<{
  submissions: SeedEntry[];
}> {
  const raw = await fs.readFile(seedPath, "utf8");
  const parsed = JSON.parse(raw) as { submissions?: SeedEntry[] };
  return { submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [] };
}

export type IngestOptions = {
  seedPath?: string;
  onlySlugs?: string[];
  dryRun?: boolean;
};

export async function runConsultationsPipeline(
  opts: IngestOptions = {},
): Promise<IngestResult> {
  const { submissions } = await loadSeedFile(opts.seedPath);

  const wantedSlugs = opts.onlySlugs && opts.onlySlugs.length > 0
    ? new Set(opts.onlySlugs.map((s) => s.toLowerCase()))
    : null;

  const filtered = wantedSlugs
    ? submissions.filter((s) => wantedSlugs.has(s.slug.toLowerCase()))
    : submissions;

  const allSlugs = Array.from(new Set(filtered.map((e) => e.slug)));
  if (allSlugs.length === 0) {
    return {
      source: "curated",
      totalSeedEntries: submissions.length,
      matchedCompanies: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      unknownSlugs: [],
      perSlug: [],
    };
  }

  const matchedCompanies = await db
    .select({ id: companies.id, slug: companies.slug })
    .from(companies)
    .where(inArray(companies.slug, allSlugs));

  const slugToId = new Map(matchedCompanies.map((c) => [c.slug, c.id]));
  const unknownSlugs = allSlugs.filter((s) => !slugToId.has(s));

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const perSlugStats = new Map<string, { inserted: number; updated: number }>();

  for (const entry of filtered) {
    const companyId = slugToId.get(entry.slug);
    if (!companyId) {
      skipped += 1;
      continue;
    }
    const stats = perSlugStats.get(entry.slug) ?? { inserted: 0, updated: 0 };

    const values = {
      companyId,
      jurisdiction: entry.jurisdiction,
      regulator: entry.regulator,
      consultationName: entry.consultationName,
      submittedAt: entry.submittedAt ? new Date(entry.submittedAt) : null,
      url: entry.url ?? null,
      summary: entry.summary ?? null,
      topics: entry.topics ?? [],
      rawExcerpt: entry.rawExcerpt ?? null,
      source: "curated" as const,
    };

    // Pre-check existence so insert/update counts are accurate — seed is
    // small (~28 rows), the extra round-trip cost is negligible.
    const [existing] = await db
      .select({ id: consultationSubmissions.id })
      .from(consultationSubmissions)
      .where(
        and(
          eq(consultationSubmissions.companyId, companyId),
          eq(consultationSubmissions.consultationName, entry.consultationName),
        ),
      )
      .limit(1);

    const isUpdate = !!existing;
    if (isUpdate) {
      updated += 1;
      stats.updated += 1;
    } else {
      inserted += 1;
      stats.inserted += 1;
    }

    if (!opts.dryRun) {
      await db
        .insert(consultationSubmissions)
        .values(values)
        .onConflictDoUpdate({
          target: [
            consultationSubmissions.companyId,
            consultationSubmissions.consultationName,
          ],
          set: {
            jurisdiction: values.jurisdiction,
            regulator: values.regulator,
            submittedAt: values.submittedAt,
            url: values.url,
            summary: values.summary,
            topics: values.topics,
            rawExcerpt: values.rawExcerpt,
            source: values.source,
          },
        });
    }

    perSlugStats.set(entry.slug, stats);
  }

  return {
    source: "curated",
    totalSeedEntries: submissions.length,
    matchedCompanies: matchedCompanies.length,
    inserted,
    updated,
    skipped,
    unknownSlugs,
    perSlug: Array.from(perSlugStats.entries()).map(([slug, v]) => ({
      slug,
      ...v,
    })),
  };
}
