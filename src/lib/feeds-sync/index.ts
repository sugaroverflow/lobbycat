/**
 * feeds-sync
 * ----------
 * Reads Glyphie's per-company feed files (`research/feeds/<slug>.json`)
 * and upserts their publications into the Postgres `publications` table
 * that the dashboard reads from.
 *
 * Why this exists: Glyphie writes JSON via daily PRs (Lotus's domain
 * boundary), but the dashboard reads from the DB. Without this sync,
 * Glyphie's reading work never reaches the UI — which is exactly the bug
 * Fatima caught for v0.7.2 ("there's no way there are no publications
 * from all of these companies"). It was 3 RSS-configured companies vs.
 * 70 Glyphie-tracked companies; the dashboard was reading from the
 * 3-feed table.
 *
 * Idempotent: re-running is safe. Conflict target is (companyId, url),
 * matching the unique index on `publications`.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, publications } from "@/db/schema";

type GlyphiePublication = {
  date?: string | null;
  title: string;
  url: string;
  type?: string | null;
  byline?: string | null;
  summary?: string | null;
  topics?: string[] | null;
};

type GlyphieFeed = {
  slug: string;
  lastUpdated?: string;
  publications?: GlyphiePublication[];
};

export type FeedSyncCompanyResult = {
  slug: string;
  companyId?: number;
  found: number;
  inserted: number;
  updated: number;
  skipped: number;
  error?: string;
};

export type FeedSyncResult = {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  feedsDir: string;
  companies: FeedSyncCompanyResult[];
  totals: {
    feeds: number;
    failed: number;
    found: number;
    inserted: number;
    updated: number;
    skipped: number;
  };
};

const ALLOWED_TYPES = new Set(["blog", "press", "filing", "paper", "other"]);

function resolveFeedsDir(): string {
  // Prefer cwd-relative (matches Next.js runtime), fall back one level
  // up to support monorepo layouts and scripts run from src/.
  const candidates = [
    path.join(process.cwd(), "research", "feeds"),
    path.join(process.cwd(), "..", "research", "feeds"),
  ];
  return candidates[0]!;
}

async function listFeedFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
}

async function readFeedFile(file: string): Promise<GlyphieFeed | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as GlyphieFeed;
    if (!parsed || typeof parsed.slug !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function normaliseType(t: string | null | undefined): string {
  if (!t) return "other";
  const v = t.toLowerCase().trim();
  return ALLOWED_TYPES.has(v) ? v : "other";
}

function parseDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  const ts = Date.parse(d);
  return Number.isFinite(ts) ? new Date(ts) : null;
}

async function syncOne(
  feed: GlyphieFeed,
  companyId: number,
  options: { dryRun: boolean },
): Promise<FeedSyncCompanyResult> {
  const result: FeedSyncCompanyResult = {
    slug: feed.slug,
    companyId,
    found: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
  };

  const items = (feed.publications ?? []).filter(
    (p): p is GlyphiePublication =>
      !!p && typeof p.title === "string" && typeof p.url === "string",
  );
  result.found = items.length;
  if (items.length === 0) return result;

  // Pull the URLs we already have for this company so we can detect
  // insert vs update without doing a round-trip per row.
  const urls = Array.from(new Set(items.map((i) => i.url)));
  const existingRows = await db
    .select({ url: publications.url })
    .from(publications)
    .where(eq(publications.companyId, companyId));
  const existing = new Set(
    existingRows.filter((r) => urls.includes(r.url)).map((r) => r.url),
  );

  if (options.dryRun) {
    for (const item of items) {
      if (existing.has(item.url)) result.updated += 1;
      else result.inserted += 1;
    }
    return result;
  }

  // Per-row upsert. Volumes are small (≤ a few hundred per company),
  // so this stays well within Vercel's request budget. We use
  // onConflictDoUpdate so re-running picks up Glyphie's improved
  // summaries on subsequent passes.
  for (const item of items) {
    try {
      await db
        .insert(publications)
        .values({
          companyId,
          type: normaliseType(item.type),
          title: item.title,
          url: item.url,
          publishedAt: parseDate(item.date),
          summary: item.summary ?? null,
          topics: Array.isArray(item.topics) ? item.topics : [],
          rawExcerpt: null,
        })
        .onConflictDoUpdate({
          target: [publications.companyId, publications.url],
          set: {
            type: normaliseType(item.type),
            title: item.title,
            publishedAt: parseDate(item.date),
            summary: item.summary ?? null,
            topics: Array.isArray(item.topics) ? item.topics : [],
          },
        });
      if (existing.has(item.url)) result.updated += 1;
      else result.inserted += 1;
    } catch (err) {
      result.skipped += 1;
      result.error = err instanceof Error ? err.message : String(err);
    }
  }

  return result;
}

export async function runFeedsSync(options?: {
  onlySlugs?: string[];
  dryRun?: boolean;
  feedsDir?: string;
}): Promise<FeedSyncResult> {
  const startedAt = new Date();
  const dryRun = options?.dryRun ?? false;
  const feedsDir = options?.feedsDir ?? resolveFeedsDir();
  const onlySlugs = options?.onlySlugs?.length
    ? new Set(options.onlySlugs)
    : undefined;

  const files = await listFeedFiles(feedsDir);

  // Build slug -> companyId map once.
  const companyRows = await db
    .select({ id: companies.id, slug: companies.slug })
    .from(companies);
  const slugToId = new Map(companyRows.map((c) => [c.slug, c.id]));

  const out: FeedSyncCompanyResult[] = [];

  for (const file of files) {
    const feed = await readFeedFile(path.join(feedsDir, file));
    if (!feed) {
      out.push({
        slug: file.replace(/\.json$/, ""),
        found: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        error: "could not parse feed json",
      });
      continue;
    }
    if (onlySlugs && !onlySlugs.has(feed.slug)) continue;

    const companyId = slugToId.get(feed.slug);
    if (!companyId) {
      out.push({
        slug: feed.slug,
        found: feed.publications?.length ?? 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        error: "no matching company in db",
      });
      continue;
    }

    out.push(await syncOne(feed, companyId, { dryRun }));
  }

  // Avoid unused-import warning if `inArray` ever gets dropped.
  void inArray;

  const finishedAt = new Date();
  const totals = out.reduce(
    (acc, r) => ({
      feeds: acc.feeds + 1,
      failed: acc.failed + (r.error ? 1 : 0),
      found: acc.found + r.found,
      inserted: acc.inserted + r.inserted,
      updated: acc.updated + r.updated,
      skipped: acc.skipped + r.skipped,
    }),
    { feeds: 0, failed: 0, found: 0, inserted: 0, updated: 0, skipped: 0 },
  );

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    feedsDir,
    companies: out,
    totals,
  };
}
