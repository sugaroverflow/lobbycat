import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/db";
import { companies, publications } from "@/db/schema";
import { parseFeed, type ParsedItem } from "./parse";
import { summariseItem } from "./summarise";

export type FeedKind = "blog" | "press";

export type CompanyFeedResult = {
  companyId: number;
  companySlug: string;
  feedKind: FeedKind;
  feedUrl: string;
  fetched: number;
  inserted: number;
  skipped: number;
  error?: string;
};

export type RssPipelineResult = {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  feeds: CompanyFeedResult[];
  totals: {
    feeds: number;
    failed: number;
    fetched: number;
    inserted: number;
    skipped: number;
  };
};

async function fetchFeed(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "lobbycat-rss/0.1 (+https://lobbycat.app)",
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.5",
    },
    // Don't hang the cron on slow feeds.
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`feed responded ${res.status}`);
  }
  return await res.text();
}

async function processFeed(
  companyId: number,
  companySlug: string,
  kind: FeedKind,
  feedUrl: string,
  options: { dryRun: boolean; maxNewPerFeed: number },
): Promise<CompanyFeedResult> {
  const base: CompanyFeedResult = {
    companyId,
    companySlug,
    feedKind: kind,
    feedUrl,
    fetched: 0,
    inserted: 0,
    skipped: 0,
  };

  let items: ParsedItem[];
  try {
    const xml = await fetchFeed(feedUrl);
    items = parseFeed(xml);
  } catch (err) {
    return { ...base, error: err instanceof Error ? err.message : String(err) };
  }
  base.fetched = items.length;
  if (items.length === 0) return base;

  // Look up which URLs we've already stored for this company so we don't
  // re-summarise (Haiku call costs $).
  const urls = items.map((i) => i.url);
  const existing = await db
    .select({ url: publications.url })
    .from(publications)
    .where(
      and(eq(publications.companyId, companyId), inArray(publications.url, urls)),
    );
  const known = new Set(existing.map((r) => r.url));

  // Process newest first; cap how many we summarise per run to keep cost
  // and latency predictable. Older items in the feed will get picked up on
  // subsequent runs if they're still listed (rare for RSS).
  const fresh = items
    .filter((i) => !known.has(i.url))
    .sort((a, b) => {
      const ax = a.publishedAt?.getTime() ?? 0;
      const bx = b.publishedAt?.getTime() ?? 0;
      return bx - ax;
    })
    .slice(0, options.maxNewPerFeed);

  base.skipped = items.length - fresh.length;

  for (const item of fresh) {
    const { summary, topics } = await summariseItem(item.title, item.excerpt);
    if (options.dryRun) {
      base.inserted += 1;
      continue;
    }
    try {
      await db
        .insert(publications)
        .values({
          companyId,
          type: kind,
          title: item.title,
          url: item.url,
          publishedAt: item.publishedAt,
          summary,
          topics,
          rawExcerpt: item.excerpt || null,
        })
        .onConflictDoNothing({
          target: [publications.companyId, publications.url],
        });
      base.inserted += 1;
    } catch (err) {
      // Don't abort the whole feed for one bad row.
      base.error = err instanceof Error ? err.message : String(err);
    }
  }

  return base;
}

export async function runRssPipeline(options?: {
  onlySlugs?: string[];
  dryRun?: boolean;
  /** Cap per-feed Haiku calls. Default 10. */
  maxNewPerFeed?: number;
}): Promise<RssPipelineResult> {
  const startedAt = new Date();
  const dryRun = options?.dryRun ?? false;
  const maxNewPerFeed = options?.maxNewPerFeed ?? 10;

  const where = and(
    or(isNotNull(companies.blogRssUrl), isNotNull(companies.pressRssUrl)),
    options?.onlySlugs?.length
      ? inArray(companies.slug, options.onlySlugs)
      : undefined,
  );

  const rows = await db
    .select({
      id: companies.id,
      slug: companies.slug,
      blogRssUrl: companies.blogRssUrl,
      pressRssUrl: companies.pressRssUrl,
    })
    .from(companies)
    .where(where);

  const feeds: CompanyFeedResult[] = [];
  for (const c of rows) {
    if (c.blogRssUrl) {
      feeds.push(
        await processFeed(c.id, c.slug, "blog", c.blogRssUrl, {
          dryRun,
          maxNewPerFeed,
        }),
      );
    }
    if (c.pressRssUrl) {
      feeds.push(
        await processFeed(c.id, c.slug, "press", c.pressRssUrl, {
          dryRun,
          maxNewPerFeed,
        }),
      );
    }
  }

  const finishedAt = new Date();
  const totals = feeds.reduce(
    (acc, r) => ({
      feeds: acc.feeds + 1,
      failed: acc.failed + (r.error ? 1 : 0),
      fetched: acc.fetched + r.fetched,
      inserted: acc.inserted + r.inserted,
      skipped: acc.skipped + r.skipped,
    }),
    { feeds: 0, failed: 0, fetched: 0, inserted: 0, skipped: 0 },
  );

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    feeds,
    totals,
  };
}
