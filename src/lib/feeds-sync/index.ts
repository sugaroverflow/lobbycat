/**
 * feeds-sync
 * ----------
 * Reads Glyphie's per-company feed files (`research/feeds/<slug>.json`)
 * and upserts their evidence into the Postgres tables the dashboard reads
 * from: `publications`, `roles`, and `controversies`.
 *
 * Why this exists: Glyphie writes JSON via daily PRs (Lotus's domain
 * boundary), but the dashboard reads from the DB. Without this sync,
 * Glyphie's reading work never reaches the UI — which is exactly the bug
 * Fatima caught for v0.7.2 ("there's no way there are no publications
 * from all of these companies"). It was 3 RSS-configured companies vs.
 * 70 Glyphie-tracked companies; the dashboard was reading from the
 * 3-feed table.
 *
 * v0.8: extended to also ingest `roles[]` (open job postings from the
 * roles lens, into the pre-existing `roles` table) and `controversies[]`
 * (reputational signals, into the new `controversies` table). Each is an
 * independent path so a malformed roles array can't block publications.
 *
 * Idempotent: re-running is safe. Conflict targets match each table's
 * unique index — (companyId, url) for publications/controversies,
 * (companyId, externalId) for roles.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, publications, roles, controversies } from "@/db/schema";

type GlyphiePublication = {
  date?: string | null;
  title: string;
  url: string;
  type?: string | null;
  byline?: string | null;
  summary?: string | null;
  topics?: string[] | null;
};

type GlyphieRole = {
  title: string;
  location?: string | null;
  url: string;
  source?: string | null; // greenhouse | lever | ashby | ats | manual
  seenAt?: string | null;
  londonRelevant?: boolean | null;
  isNew?: boolean | null;
};

type GlyphieControversy = {
  type: string;
  title: string;
  url: string;
  occurredAt?: string | null;
  status: string;
  severity?: string | null;
  companyRole?: string | null;
  summary?: string | null;
  topics?: string[] | null;
  rawExcerpt?: string | null;
  corroboration?: Array<{ outlet: string; url: string; paywalled?: boolean }> | null;
  source?: string | null;
};

type GlyphieFeed = {
  slug: string;
  lastUpdated?: string;
  publications?: GlyphiePublication[];
  roles?: GlyphieRole[];
  controversies?: GlyphieControversy[];
};

export type FeedSyncKindResult = {
  found: number;
  inserted: number;
  updated: number;
  skipped: number;
};

export type FeedSyncCompanyResult = {
  slug: string;
  companyId?: number;
  // Aggregate (publications + roles + controversies) — kept for backwards
  // compatibility with existing callers/logging.
  found: number;
  inserted: number;
  updated: number;
  skipped: number;
  // Per-kind breakdown (v0.8).
  publications?: FeedSyncKindResult;
  roles?: FeedSyncKindResult;
  controversies?: FeedSyncKindResult;
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

const EMPTY_KIND = (): FeedSyncKindResult => ({
  found: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
});

/** Derive a stable per-company external id for a role from its ATS url. */
function roleExternalId(url: string): string {
  // ATS job urls end in the job id, e.g.
  //   greenhouse: .../jobs/4461450008
  //   ashby:      .../<uuid>
  //   lever:      .../<uuid>
  // The last non-empty path segment is the stable id. Fall back to the
  // whole url so we never produce an empty conflict key.
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean);
    return segs[segs.length - 1] || url;
  } catch {
    return url;
  }
}

async function syncPublications(
  feed: GlyphieFeed,
  companyId: number,
  options: { dryRun: boolean },
): Promise<{ kind: FeedSyncKindResult; error?: string }> {
  const kind = EMPTY_KIND();
  const items = (feed.publications ?? []).filter(
    (p): p is GlyphiePublication =>
      !!p && typeof p.title === "string" && typeof p.url === "string",
  );
  kind.found = items.length;
  if (items.length === 0) return { kind };

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
      if (existing.has(item.url)) kind.updated += 1;
      else kind.inserted += 1;
    }
    return { kind };
  }

  let error: string | undefined;
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
      if (existing.has(item.url)) kind.updated += 1;
      else kind.inserted += 1;
    } catch (err) {
      kind.skipped += 1;
      error = err instanceof Error ? err.message : String(err);
    }
  }
  return { kind, error };
}

async function syncRoles(
  feed: GlyphieFeed,
  companyId: number,
  options: { dryRun: boolean },
): Promise<{ kind: FeedSyncKindResult; error?: string }> {
  const kind = EMPTY_KIND();
  const items = (feed.roles ?? []).filter(
    (r): r is GlyphieRole =>
      !!r && typeof r.title === "string" && typeof r.url === "string",
  );
  kind.found = items.length;
  if (items.length === 0) return { kind };

  // Conflict key for roles is (companyId, externalId), so dedupe on that.
  const existingRows = await db
    .select({ externalId: roles.externalId })
    .from(roles)
    .where(eq(roles.companyId, companyId));
  const existing = new Set(
    existingRows
      .map((r) => r.externalId)
      .filter((x): x is string => typeof x === "string"),
  );

  if (options.dryRun) {
    for (const item of items) {
      if (existing.has(roleExternalId(item.url))) kind.updated += 1;
      else kind.inserted += 1;
    }
    return { kind };
  }

  let error: string | undefined;
  for (const item of items) {
    const externalId = roleExternalId(item.url);
    try {
      await db
        .insert(roles)
        .values({
          companyId,
          externalId,
          title: item.title,
          department: null,
          location: item.location ?? null,
          url: item.url,
          source: item.source ?? "ats",
          postedAt: parseDate(item.seenAt),
          snapshot: {
            londonRelevant: item.londonRelevant ?? null,
            isNew: item.isNew ?? null,
          },
          isOpen: true,
        })
        .onConflictDoUpdate({
          target: [roles.companyId, roles.externalId],
          set: {
            title: item.title,
            location: item.location ?? null,
            url: item.url,
            source: item.source ?? "ats",
            isOpen: true,
            snapshot: {
              londonRelevant: item.londonRelevant ?? null,
              isNew: item.isNew ?? null,
            },
          },
        });
      if (existing.has(externalId)) kind.updated += 1;
      else kind.inserted += 1;
    } catch (err) {
      kind.skipped += 1;
      error = err instanceof Error ? err.message : String(err);
    }
  }
  return { kind, error };
}

async function syncControversies(
  feed: GlyphieFeed,
  companyId: number,
  options: { dryRun: boolean },
): Promise<{ kind: FeedSyncKindResult; error?: string }> {
  const kind = EMPTY_KIND();
  const items = (feed.controversies ?? []).filter(
    (c): c is GlyphieControversy =>
      !!c &&
      typeof c.title === "string" &&
      typeof c.url === "string" &&
      typeof c.type === "string" &&
      typeof c.status === "string",
  );
  kind.found = items.length;
  if (items.length === 0) return { kind };

  const urls = Array.from(new Set(items.map((i) => i.url)));
  const existingRows = await db
    .select({ url: controversies.url })
    .from(controversies)
    .where(eq(controversies.companyId, companyId));
  const existing = new Set(
    existingRows.filter((r) => urls.includes(r.url)).map((r) => r.url),
  );

  if (options.dryRun) {
    for (const item of items) {
      if (existing.has(item.url)) kind.updated += 1;
      else kind.inserted += 1;
    }
    return { kind };
  }

  let error: string | undefined;
  for (const item of items) {
    try {
      await db
        .insert(controversies)
        .values({
          companyId,
          type: item.type,
          title: item.title,
          url: item.url,
          occurredAt: parseDate(item.occurredAt),
          status: item.status,
          severity: item.severity ?? null,
          companyRole: item.companyRole ?? null,
          summary: item.summary ?? null,
          topics: Array.isArray(item.topics) ? item.topics : [],
          rawExcerpt: item.rawExcerpt ?? null,
          corroboration: Array.isArray(item.corroboration)
            ? item.corroboration
            : [],
          source: item.source ?? "curated",
        })
        .onConflictDoUpdate({
          target: [controversies.companyId, controversies.url],
          set: {
            type: item.type,
            title: item.title,
            occurredAt: parseDate(item.occurredAt),
            status: item.status,
            severity: item.severity ?? null,
            companyRole: item.companyRole ?? null,
            summary: item.summary ?? null,
            topics: Array.isArray(item.topics) ? item.topics : [],
            rawExcerpt: item.rawExcerpt ?? null,
            corroboration: Array.isArray(item.corroboration)
              ? item.corroboration
              : [],
            source: item.source ?? "curated",
          },
        });
      if (existing.has(item.url)) kind.updated += 1;
      else kind.inserted += 1;
    } catch (err) {
      kind.skipped += 1;
      error = err instanceof Error ? err.message : String(err);
    }
  }
  return { kind, error };
}

async function syncOne(
  feed: GlyphieFeed,
  companyId: number,
  options: { dryRun: boolean },
): Promise<FeedSyncCompanyResult> {
  // Each kind syncs independently so a malformed array in one doesn't
  // block the others.
  const pub = await syncPublications(feed, companyId, options);
  const rol = await syncRoles(feed, companyId, options);
  const con = await syncControversies(feed, companyId, options);

  const errors = [pub.error, rol.error, con.error].filter(Boolean);
  return {
    slug: feed.slug,
    companyId,
    found: pub.kind.found + rol.kind.found + con.kind.found,
    inserted: pub.kind.inserted + rol.kind.inserted + con.kind.inserted,
    updated: pub.kind.updated + rol.kind.updated + con.kind.updated,
    skipped: pub.kind.skipped + rol.kind.skipped + con.kind.skipped,
    publications: pub.kind,
    roles: rol.kind,
    controversies: con.kind,
    ...(errors.length ? { error: errors.join("; ") } : {}),
  };
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
      const found =
        (feed.publications?.length ?? 0) +
        (feed.roles?.length ?? 0) +
        (feed.controversies?.length ?? 0);
      out.push({
        slug: feed.slug,
        found,
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
