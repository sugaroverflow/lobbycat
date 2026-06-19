/**
 * Minimal RSS 2.0 / Atom 1.0 parser.
 *
 * We avoid pulling in a full XML library. The cron only ingests feeds we already
 * vetted via blogRssUrl / pressRssUrl, so robustness > exhaustiveness — we just
 * need enough to grab item title, link, pubDate/updated, and a short
 * description/summary block.
 *
 * If a feed in the wild trips this parser we'll log + skip; corrupt items don't
 * kill the run (see lib/rss/index.ts).
 */

export type ParsedItem = {
  title: string;
  url: string;
  publishedAt: Date | null;
  excerpt: string;
};

/** Cheap entity decode for the handful of named entities we actually see. */
function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function stripTags(s: string): string {
  return decode(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, tag: string): string | null {
  // Match <tag ...>...</tag> non-greedy. Handles CDATA inside via decode().
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1] : null;
}

function selfClosingHref(block: string, tag: string): string | null {
  // <link href="..." /> or <link rel="alternate" href="..."/>
  const re = new RegExp(
    `<${tag}\\b[^>]*\\bhref="([^"]+)"[^>]*/?>`,
    "i",
  );
  const m = block.match(re);
  return m ? decode(m[1]) : null;
}

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const cleaned = decode(raw).trim();
  if (!cleaned) return null;
  const d = new Date(cleaned);
  return Number.isFinite(d.getTime()) ? d : null;
}

function splitBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "gi");
  return xml.match(re) ?? [];
}

export function parseFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];

  // RSS 2.0 — <item>
  for (const block of splitBlocks(xml, "item")) {
    const title = stripTags(firstTag(block, "title") ?? "");
    const linkRaw = firstTag(block, "link");
    const url = linkRaw
      ? stripTags(linkRaw) || selfClosingHref(block, "link") || ""
      : selfClosingHref(block, "link") || "";
    const publishedAt =
      parseDate(firstTag(block, "pubDate")) ??
      parseDate(firstTag(block, "dc:date")) ??
      parseDate(firstTag(block, "published"));
    const excerpt = stripTags(
      firstTag(block, "description") ??
        firstTag(block, "content:encoded") ??
        firstTag(block, "summary") ??
        "",
    ).slice(0, 1200);
    if (title && url) {
      items.push({ title, url, publishedAt, excerpt });
    }
  }

  // Atom 1.0 — <entry>
  for (const block of splitBlocks(xml, "entry")) {
    const title = stripTags(firstTag(block, "title") ?? "");
    const url =
      selfClosingHref(block, "link") || stripTags(firstTag(block, "id") ?? "");
    const publishedAt =
      parseDate(firstTag(block, "published")) ??
      parseDate(firstTag(block, "updated"));
    const excerpt = stripTags(
      firstTag(block, "summary") ?? firstTag(block, "content") ?? "",
    ).slice(0, 1200);
    if (title && url) {
      items.push({ title, url, publishedAt, excerpt });
    }
  }

  // De-dupe by URL within the feed; latest wins.
  const byUrl = new Map<string, ParsedItem>();
  for (const it of items) byUrl.set(it.url, it);
  return Array.from(byUrl.values());
}
