/**
 * v0.7 step 8 — Welcome-back diff builder.
 *
 * Reads `research/feed.json` (Glyphie's daily output) and produces the
 * "new since you were last in" content for the welcome-back card.
 *
 * Inputs:
 *   - `prevLastSeen`  the user's previous home-visit timestamp. Null on
 *                     the first ever visit; we default the diff window to
 *                     the last 14 days then.
 *   - `companies`     all companies (id, slug, name) for company_slug lookup
 *   - `scores`        flattened frame scores, used to prioritise events
 *                     against the user's high-weighted frames
 *   - `frameWeights`  user's Must/Should/Could (low/medium/high) per frame
 *   - `frames`        frame metadata for nicer copy ("you scored ≥4 on …")
 *
 * Output: a structured diff for the client to render. We never throw on
 * a missing / malformed feed.json — the home page degrades to the bare
 * welcome quote instead.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type FeedEvent = {
  date: string;
  company_slug: string;
  event_type: string;
  summary: string;
  source_url: string;
};

export type WelcomeBackBullet = {
  kind: "named" | "count";
  text: string;
  href?: string;
};

export type WelcomeBackData = {
  available: boolean;
  windowStart: string | null;
  newEventCount: number;
  bullets: WelcomeBackBullet[];
  highlightedFrameName: string | null;
};

const DEFAULT_WINDOW_DAYS = 14;
const MAX_NAMED_BULLETS = 3;

type ReadFeedResult = {
  events: FeedEvent[];
  lastUpdated: string | null;
};

async function readFeed(): Promise<ReadFeedResult | null> {
  // We resolve relative to process.cwd() which on Vercel is the function
  // root. next.config.ts's outputFileTracingIncludes ships the JSON.
  const candidates = [
    path.join(process.cwd(), "research", "feed.json"),
    path.join(process.cwd(), "..", "research", "feed.json"),
  ];
  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      const parsed = JSON.parse(raw) as {
        lastUpdated?: string;
        events?: FeedEvent[];
      };
      if (!Array.isArray(parsed.events)) continue;
      return {
        events: parsed.events,
        lastUpdated: parsed.lastUpdated ?? null,
      };
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function buildWelcomeBack({
  prevLastSeen,
  companies,
  scores,
  frameWeights,
  frames,
}: {
  prevLastSeen: string | null;
  companies: Array<{ id: number; slug: string; name: string }>;
  scores: Array<{
    companyId: number;
    frameId: number;
    score: number | null;
  }>;
  frameWeights: Record<string, "low" | "medium" | "high">;
  frames: Array<{ id: number; name: string }>;
}): Promise<WelcomeBackData> {
  const empty: WelcomeBackData = {
    available: false,
    windowStart: null,
    newEventCount: 0,
    bullets: [],
    highlightedFrameName: null,
  };

  const feed = await readFeed();
  if (!feed) return empty;

  // Define the diff window. First-ever visit → default 14 days.
  const now = Date.now();
  const fallbackStartMs = now - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const startMs = prevLastSeen
    ? Math.min(now, new Date(prevLastSeen).getTime())
    : fallbackStartMs;
  const windowStartIso = new Date(startMs).toISOString();

  const inWindow = feed.events.filter((e) => {
    const t = Date.parse(e.date);
    return Number.isFinite(t) && t >= startMs;
  });

  if (inWindow.length === 0) {
    // Card is still "available" — we show the empty-state line ("no new
    // updates since your last visit"). The page can still degrade to the
    // bare quote if it wants by checking newEventCount === 0.
    return {
      available: true,
      windowStart: windowStartIso,
      newEventCount: 0,
      bullets: [],
      highlightedFrameName: null,
    };
  }

  const companyBySlug = new Map(companies.map((c) => [c.slug, c]));

  // Pick the user's top weighted frame (Must > Should > Could) so we can
  // copy "things at companies you scored ≥4 on <frame>". If they put
  // everything at the same level, we still pick the first sort-order
  // frame to keep the copy concrete.
  const weightOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const sortedFrames = [...frames].sort((a, b) => {
    const aw = weightOrder[frameWeights[String(a.id)] ?? "medium"] ?? 2;
    const bw = weightOrder[frameWeights[String(b.id)] ?? "medium"] ?? 2;
    if (aw !== bw) return bw - aw;
    return a.id - b.id;
  });
  const focusFrame = sortedFrames[0] ?? null;

  // Score lookup keyed by company id → highest score across user's
  // high-weighted frames (or focus frame if no high). Used to prioritise
  // events: an event at a high-scoring company surfaces first.
  const highFrameIds = new Set(
    frames
      .filter((f) => frameWeights[String(f.id)] === "high")
      .map((f) => f.id),
  );
  const priorityFrameIds =
    highFrameIds.size > 0
      ? highFrameIds
      : new Set(focusFrame ? [focusFrame.id] : []);

  const topScoreByCompany = new Map<number, number>();
  for (const s of scores) {
    if (s.score === null) continue;
    if (!priorityFrameIds.has(s.frameId)) continue;
    const prev = topScoreByCompany.get(s.companyId) ?? -Infinity;
    if (s.score > prev) topScoreByCompany.set(s.companyId, s.score);
  }

  // Sort events: company priority score desc, then date desc.
  const ranked = [...inWindow].sort((a, b) => {
    const aCo = companyBySlug.get(a.company_slug);
    const bCo = companyBySlug.get(b.company_slug);
    const aScore = aCo ? (topScoreByCompany.get(aCo.id) ?? 0) : 0;
    const bScore = bCo ? (topScoreByCompany.get(bCo.id) ?? 0) : 0;
    if (aScore !== bScore) return bScore - aScore;
    return Date.parse(b.date) - Date.parse(a.date);
  });

  const bullets: WelcomeBackBullet[] = [];
  for (const event of ranked.slice(0, MAX_NAMED_BULLETS)) {
    const co = companyBySlug.get(event.company_slug);
    const companyName = co?.name ?? event.company_slug;
    bullets.push({
      kind: "named",
      text: `${companyName} — ${event.summary}`,
      href: event.source_url,
    });
  }

  // Optional rollup bullet at the bottom: if the window has more than
  // we surfaced, mention the residual as a count.
  if (ranked.length > MAX_NAMED_BULLETS) {
    const extra = ranked.length - MAX_NAMED_BULLETS;
    bullets.push({
      kind: "count",
      text: `${extra} more update${extra === 1 ? "" : "s"} since your last visit`,
    });
  }

  return {
    available: true,
    windowStart: windowStartIso,
    newEventCount: ranked.length,
    bullets,
    highlightedFrameName: focusFrame?.name ?? null,
  };
}
