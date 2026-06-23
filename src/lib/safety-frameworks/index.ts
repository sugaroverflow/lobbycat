/**
 * Safety frameworks ingestion (v0.6 Step 11).
 *
 * Reads the hand-curated `src/db/safety-frameworks-seed.json`, resolves
 * each entry against the `companies` table by slug, and upserts into
 * `safety_frameworks` (uniq on companyId + title).
 *
 * No external API calls — this is a curated seed pipeline. Safety
 * frameworks are slow-moving (most labs update theirs once or twice a
 * year); a scraper here would be over-engineering. Future scraper
 * iterations should write rows with `source = 'scraped'`. The scoring
 * engine treats both kinds identically.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, safetyFrameworks } from "@/db/schema";

export type SeedEntry = {
  slug: string;
  frameworkType: string;
  title: string;
  version?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
  commitments?: string[];
  strength?: number | null;
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
  "safety-frameworks-seed.json",
);

export async function loadSeedFile(
  seedPath: string = DEFAULT_SEED_PATH,
): Promise<{ frameworks: SeedEntry[] }> {
  const raw = await fs.readFile(seedPath, "utf8");
  const parsed = JSON.parse(raw) as { frameworks?: SeedEntry[] };
  return {
    frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
  };
}

export type IngestOptions = {
  seedPath?: string;
  onlySlugs?: string[];
  dryRun?: boolean;
};

export async function runSafetyFrameworksPipeline(
  opts: IngestOptions = {},
): Promise<IngestResult> {
  const { frameworks } = await loadSeedFile(opts.seedPath);

  const wantedSlugs =
    opts.onlySlugs && opts.onlySlugs.length > 0
      ? new Set(opts.onlySlugs.map((s) => s.toLowerCase()))
      : null;

  const filtered = wantedSlugs
    ? frameworks.filter((s) => wantedSlugs.has(s.slug.toLowerCase()))
    : frameworks;

  const allSlugs = Array.from(new Set(filtered.map((e) => e.slug)));
  if (allSlugs.length === 0) {
    return {
      source: "curated",
      totalSeedEntries: frameworks.length,
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
      frameworkType: entry.frameworkType,
      title: entry.title,
      version: entry.version ?? null,
      url: entry.url ?? null,
      publishedAt: entry.publishedAt ? new Date(entry.publishedAt) : null,
      summary: entry.summary ?? null,
      commitments: entry.commitments ?? [],
      strength:
        typeof entry.strength === "number" && Number.isFinite(entry.strength)
          ? Math.max(1, Math.min(5, Math.round(entry.strength)))
          : null,
      rawExcerpt: entry.rawExcerpt ?? null,
      source: "curated" as const,
    };

    const [existing] = await db
      .select({ id: safetyFrameworks.id })
      .from(safetyFrameworks)
      .where(
        and(
          eq(safetyFrameworks.companyId, companyId),
          eq(safetyFrameworks.title, entry.title),
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
        .insert(safetyFrameworks)
        .values(values)
        .onConflictDoUpdate({
          target: [safetyFrameworks.companyId, safetyFrameworks.title],
          set: {
            frameworkType: values.frameworkType,
            version: values.version,
            url: values.url,
            publishedAt: values.publishedAt,
            summary: values.summary,
            commitments: values.commitments,
            strength: values.strength,
            rawExcerpt: values.rawExcerpt,
            source: values.source,
          },
        });
    }

    perSlugStats.set(entry.slug, stats);
  }

  return {
    source: "curated",
    totalSeedEntries: frameworks.length,
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
