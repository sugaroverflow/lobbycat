/**
 * v0.6 Surprise engine.
 *
 * Three variants, each with a rule-based pick + an LLM-written "why" line.
 * §3.5 of REFACTOR-v0.6:
 *
 *   - Adjacency  — "X resembles a company you like on frame F"
 *   - Recency    — "Y published recently on your top-weighted frame"
 *   - Underrated — "Z has lobbying-register footprint matching your low weight"
 *
 * Server-side only. The client just receives a flat payload + a string line.
 * If ANTHROPIC_API_KEY is missing we fall back to a template line so the
 * modal still works locally.
 */

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  companies,
  companyNotes,
  frames as framesTable,
  frameScores,
  lobbyingRecords,
  publications,
  userProfile,
} from "@/db/schema";
import {
  aggregateScore,
  type FrameWeightLevel,
} from "@/lib/scoring/aggregate";

export type SurpriseVariant = "adjacency" | "recency" | "underrated";

export type SurprisePick = {
  variant: SurpriseVariant;
  company: {
    id: number;
    slug: string;
    name: string;
    hq: string | null;
    description: string | null;
  };
  /** Frame this pick is anchored around (for the why-line context). */
  frame: { id: number; name: string } | null;
  /** Numeric anchor — score on `frame`, or aggregate, or recency days. */
  anchor: { kind: "score" | "aggregate" | "daysAgo"; value: number } | null;
  /** The cat's reason. ~1 sentence. */
  line: string;
};

const WEIGHT_MULT: Record<FrameWeightLevel, number> = { low: 1, medium: 2, high: 3 };
const RECENCY_DAYS = 21;

type SnapshotCompany = {
  id: number;
  slug: string;
  name: string;
  hq: string | null;
  description: string | null;
};

type FrameRow = { id: number; name: string; sortIndex: number };

type ScoreRow = { companyId: number; frameId: number; score: number };

async function loadCommonSnapshot() {
  const [allCompanies, allFrames, scoreRows, profile, notedRows] = await Promise.all([
    db
      .select({
        id: companies.id,
        slug: companies.slug,
        name: companies.name,
        hq: companies.hq,
        description: companies.description,
      })
      .from(companies)
      .orderBy(companies.name),
    db
      .select({ id: framesTable.id, name: framesTable.name, sortIndex: framesTable.sortIndex })
      .from(framesTable)
      .where(eq(framesTable.kind, "scale"))
      .orderBy(framesTable.sortIndex),
    db
      .select({
        companyId: frameScores.companyId,
        frameId: frameScores.frameId,
        score: frameScores.score,
      })
      .from(frameScores),
    db.select().from(userProfile).limit(1),
    db.select({ companyId: companyNotes.companyId }).from(companyNotes),
  ]);

  const scores: ScoreRow[] = scoreRows
    .map((r) => ({
      companyId: r.companyId,
      frameId: r.frameId,
      score: r.score === null ? NaN : Number(r.score),
    }))
    .filter((r) => Number.isFinite(r.score));

  const weights: Record<string, FrameWeightLevel> =
    (profile[0]?.frameWeights as Record<string, FrameWeightLevel> | undefined) ?? {};

  const engagedIds = new Set<number>(notedRows.map((r) => r.companyId));

  return { allCompanies, allFrames, scores, weights, engagedIds };
}

/** Group scores by company for aggregate lookups. */
function groupScoresByCompany(scores: ScoreRow[]) {
  const m = new Map<number, Array<{ frameId: number; score: number | null }>>();
  for (const s of scores) {
    const list = m.get(s.companyId) ?? [];
    list.push({ frameId: s.frameId, score: s.score });
    m.set(s.companyId, list);
  }
  return m;
}

/** Pick the user's highest-weight frame (ties: pick by sortIndex). */
function topWeightedFrame(
  frames: FrameRow[],
  weights: Record<string, FrameWeightLevel>,
): FrameRow | null {
  if (frames.length === 0) return null;
  const ranked = [...frames].sort((a, b) => {
    const wa = WEIGHT_MULT[weights[String(a.id)] ?? "medium"];
    const wb = WEIGHT_MULT[weights[String(b.id)] ?? "medium"];
    if (wb !== wa) return wb - wa;
    return a.sortIndex - b.sortIndex;
  });
  return ranked[0];
}

/** Pick the user's lowest-weight frame (ties: pick by sortIndex). */
function lowestWeightedFrame(
  frames: FrameRow[],
  weights: Record<string, FrameWeightLevel>,
): FrameRow | null {
  if (frames.length === 0) return null;
  const ranked = [...frames].sort((a, b) => {
    const wa = WEIGHT_MULT[weights[String(a.id)] ?? "medium"];
    const wb = WEIGHT_MULT[weights[String(b.id)] ?? "medium"];
    if (wa !== wb) return wa - wb;
    return a.sortIndex - b.sortIndex;
  });
  return ranked[0];
}

function pickOne<T>(xs: T[]): T | null {
  if (xs.length === 0) return null;
  return xs[Math.floor(Math.random() * xs.length)];
}

/* ------------------------------------------------------------------ */
/* Variant rules                                                      */
/* ------------------------------------------------------------------ */

async function pickAdjacency(
  excludeIds: Set<number>,
): Promise<SurprisePick | null> {
  const { allCompanies, allFrames, scores, weights, engagedIds } =
    await loadCommonSnapshot();
  const topFrame = topWeightedFrame(allFrames, weights);
  if (!topFrame) return null;

  // Anchor = the company the user has engaged with that scores highest on
  // topFrame. Fallback: overall top scorer on topFrame.
  const onFrame = scores
    .filter((s) => s.frameId === topFrame.id)
    .sort((a, b) => b.score - a.score);
  if (onFrame.length === 0) return null;

  const engagedTop = onFrame.find((s) => engagedIds.has(s.companyId));
  const anchorScore = engagedTop ?? onFrame[0];

  // Candidates = anyone else with score >= anchor - 1.0 on this frame,
  // excluding the anchor and anything we've already shown this session,
  // preferring not-yet-engaged.
  const threshold = Math.max(2.5, anchorScore.score - 1.0);
  const candidates = onFrame.filter(
    (s) =>
      s.companyId !== anchorScore.companyId &&
      !excludeIds.has(s.companyId) &&
      s.score >= threshold,
  );
  const unread = candidates.filter((c) => !engagedIds.has(c.companyId));
  const pool = unread.length > 0 ? unread : candidates;
  const chosen = pickOne(pool);
  if (!chosen) return null;

  const company = allCompanies.find((c) => c.id === chosen.companyId);
  if (!company) return null;

  const anchorCompany = allCompanies.find((c) => c.id === anchorScore.companyId);
  const line = await writeWhyLine({
    variant: "adjacency",
    company,
    frame: topFrame,
    extra: {
      score: chosen.score,
      anchorName: anchorCompany?.name ?? null,
      anchorScore: anchorScore.score,
    },
  });

  return {
    variant: "adjacency",
    company,
    frame: { id: topFrame.id, name: topFrame.name },
    anchor: { kind: "score", value: chosen.score },
    line,
  };
}

async function pickRecency(
  excludeIds: Set<number>,
): Promise<SurprisePick | null> {
  const { allCompanies, allFrames, scores, weights } = await loadCommonSnapshot();
  const topFrame = topWeightedFrame(allFrames, weights);
  if (!topFrame) return null;

  const sinceMs = Date.now() - RECENCY_DAYS * 24 * 60 * 60 * 1000;
  const recent = await db
    .select({
      companyId: publications.companyId,
      publishedAt: publications.publishedAt,
    })
    .from(publications)
    .where(sql`${publications.publishedAt} >= ${new Date(sinceMs).toISOString()}`)
    .orderBy(desc(publications.publishedAt));

  if (recent.length === 0) return null;

  // Newest publication per company.
  const byCompany = new Map<number, Date>();
  for (const r of recent) {
    if (!r.publishedAt) continue;
    const t = r.publishedAt instanceof Date ? r.publishedAt : new Date(r.publishedAt);
    if (!byCompany.has(r.companyId)) byCompany.set(r.companyId, t);
  }

  // Pair with score on topFrame; require score >= 3.5 to feel relevant.
  const scoreByCompany = new Map<number, number>();
  for (const s of scores) {
    if (s.frameId === topFrame.id) scoreByCompany.set(s.companyId, s.score);
  }

  const candidates: Array<{ companyId: number; daysAgo: number; score: number }> = [];
  for (const [companyId, when] of byCompany) {
    if (excludeIds.has(companyId)) continue;
    const score = scoreByCompany.get(companyId);
    if (score === undefined || score < 3.5) continue;
    const daysAgo = Math.floor((Date.now() - when.getTime()) / (24 * 60 * 60 * 1000));
    candidates.push({ companyId, daysAgo, score });
  }

  // Prefer freshest; break ties by highest score.
  candidates.sort((a, b) => a.daysAgo - b.daysAgo || b.score - a.score);
  // Slight randomness so we don't always pick the same one: pick from top 3.
  const chosen = pickOne(candidates.slice(0, 3));
  if (!chosen) return null;

  const company = allCompanies.find((c) => c.id === chosen.companyId);
  if (!company) return null;

  const line = await writeWhyLine({
    variant: "recency",
    company,
    frame: topFrame,
    extra: { daysAgo: chosen.daysAgo, score: chosen.score },
  });

  return {
    variant: "recency",
    company,
    frame: { id: topFrame.id, name: topFrame.name },
    anchor: { kind: "daysAgo", value: chosen.daysAgo },
    line,
  };
}

async function pickUnderrated(
  excludeIds: Set<number>,
): Promise<SurprisePick | null> {
  const { allCompanies, allFrames, scores, weights, engagedIds } =
    await loadCommonSnapshot();

  // Lobbying footprint per company (record count + total spend signal).
  const lobbyRows = await db
    .select({
      companyId: lobbyingRecords.companyId,
      n: sql<number>`count(*)::int`,
    })
    .from(lobbyingRecords)
    .groupBy(lobbyingRecords.companyId);
  const lobbyCount = new Map<number, number>(
    lobbyRows.map((r) => [r.companyId, Number(r.n)]),
  );

  const lowFrame = lowestWeightedFrame(allFrames, weights);
  const byCompany = groupScoresByCompany(scores);

  // Score each unread, not-engaged candidate by: (lobbying footprint) +
  // (overall aggregate ignoring user weights, to surface "solid but under-attended").
  const candidates: Array<{
    companyId: number;
    lobby: number;
    aggregate: number;
    onLow: number | null;
  }> = [];
  for (const c of allCompanies) {
    if (excludeIds.has(c.id)) continue;
    if (engagedIds.has(c.id)) continue;
    const perFrame = byCompany.get(c.id) ?? [];
    if (perFrame.length === 0) continue;
    const flatWeights: Record<string, FrameWeightLevel> = {};
    for (const f of allFrames) flatWeights[String(f.id)] = "medium";
    const agg = aggregateScore(perFrame, flatWeights).overall ?? 0;
    const onLow = lowFrame
      ? perFrame.find((r) => r.frameId === lowFrame.id)?.score ?? null
      : null;
    candidates.push({
      companyId: c.id,
      lobby: lobbyCount.get(c.id) ?? 0,
      aggregate: agg,
      onLow,
    });
  }

  if (candidates.length === 0) return null;

  // Rank by lobby footprint (>=1 strongly preferred), then aggregate.
  candidates.sort((a, b) => {
    if ((b.lobby > 0 ? 1 : 0) !== (a.lobby > 0 ? 1 : 0)) {
      return (b.lobby > 0 ? 1 : 0) - (a.lobby > 0 ? 1 : 0);
    }
    if (b.lobby !== a.lobby) return b.lobby - a.lobby;
    return b.aggregate - a.aggregate;
  });
  const chosen = pickOne(candidates.slice(0, 4));
  if (!chosen) return null;

  const company = allCompanies.find((c) => c.id === chosen.companyId);
  if (!company) return null;

  const line = await writeWhyLine({
    variant: "underrated",
    company,
    frame: lowFrame,
    extra: { lobby: chosen.lobby, aggregate: chosen.aggregate, onLow: chosen.onLow },
  });

  return {
    variant: "underrated",
    company,
    frame: lowFrame ? { id: lowFrame.id, name: lowFrame.name } : null,
    anchor: { kind: "aggregate", value: chosen.aggregate },
    line,
  };
}

/* ------------------------------------------------------------------ */
/* Why-line                                                           */
/* ------------------------------------------------------------------ */

type WhyContext = {
  variant: SurpriseVariant;
  company: SnapshotCompany;
  frame: FrameRow | null;
  extra: Record<string, unknown>;
};

const WHY_SYSTEM = `You are the lobbycat. You write the single-sentence
reason the lobbycat is recommending one company to the user, given the
variant (adjacency / recency / underrated), the frame the pick is anchored
on, and a snippet of evidence. Voice: dry, observational, third person
("the cat noticed"), never twee, never marketing, under 30 words. Return
only the sentence, no preamble.`;

async function writeWhyLine(ctx: WhyContext): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return templateWhyLine(ctx);

  const userMsg = JSON.stringify(
    {
      variant: ctx.variant,
      company: {
        name: ctx.company.name,
        hq: ctx.company.hq,
        description: ctx.company.description,
      },
      frame: ctx.frame ? { name: ctx.frame.name } : null,
      extra: ctx.extra,
    },
    null,
    2,
  );

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 120,
        system: WHY_SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) return templateWhyLine(ctx);
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (data.content?.find((c) => c.type === "text")?.text ?? "").trim();
    if (!text) return templateWhyLine(ctx);
    // Strip surrounding quotes if the model added any.
    return text.replace(/^["'`]|["'`]$/g, "").trim();
  } catch {
    return templateWhyLine(ctx);
  }
}

function templateWhyLine(ctx: WhyContext): string {
  const { variant, company, frame, extra } = ctx;
  const frameName = frame?.name ?? "the field overall";
  if (variant === "adjacency") {
    const anchor = (extra as { anchorName?: string | null }).anchorName ?? "another high scorer";
    return `${company.name} scores close to ${anchor} on ${frameName}. Different posture, same neighbourhood.`;
  }
  if (variant === "recency") {
    const days = (extra as { daysAgo?: number }).daysAgo ?? 0;
    return `${company.name} published ${days <= 1 ? "in the last day" : `${days}d ago`} and lines up with ${frameName}.`;
  }
  // underrated
  const lobby = (extra as { lobby?: number }).lobby ?? 0;
  return lobby > 0
    ? `${company.name} shows up on the lobbying register (${lobby} record${lobby === 1 ? "" : "s"}) and is quiet in your notes.`
    : `${company.name} has a solid spread of frame scores and no notes from you yet. The cat noticed.`;
}

/* ------------------------------------------------------------------ */
/* Public entrypoint                                                  */
/* ------------------------------------------------------------------ */

/** Round-robin order, with fallbacks if a variant has nothing fresh. */
const VARIANT_ORDER: SurpriseVariant[] = ["adjacency", "recency", "underrated"];

export async function pickSurprise(args: {
  excludeIds: number[];
  excludeVariants: SurpriseVariant[];
}): Promise<SurprisePick | null> {
  const exclude = new Set(args.excludeIds);
  const skipped = new Set(args.excludeVariants);
  const order = VARIANT_ORDER.filter((v) => !skipped.has(v)).concat(
    VARIANT_ORDER.filter((v) => skipped.has(v)),
  );
  for (const v of order) {
    const pick =
      v === "adjacency"
        ? await pickAdjacency(exclude)
        : v === "recency"
          ? await pickRecency(exclude)
          : await pickUnderrated(exclude);
    if (pick) return pick;
  }
  return null;
}
