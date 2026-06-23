/**
 * v0.6 live scoring engine.
 *
 * Given a (company, frame), build a prompt grounded in:
 *  - frame definition (low/high descriptions, scale)
 *  - company description, focus areas, status
 *  - recent publications (title + summary)
 *  - lobbying records (spend, topics)
 *
 * Call Anthropic (claude-3-5-sonnet) to produce a JSON
 *   { score: 1.0..5.0, rationale: "...", confidence: "low|medium|high",
 *     citations: [{kind, id, weight}] }
 *
 * Persist into `frame_scores` (upsert) + `frame_score_evidence` (replace).
 * Falls back to a deterministic median score when ANTHROPIC_API_KEY is missing.
 */

import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  companies,
  frames as framesTable,
  frameScores,
  frameScoreEvidence,
  lobbyingRecords,
  publications,
} from "@/db/schema";

const ANTHROPIC_MODEL = "claude-3-5-sonnet-latest";
const MAX_PUBS = 12;
const MAX_LOBBY = 8;

export type ScoringEvidence = {
  kind: "publication" | "lobbying_record";
  id: number;
  weight: number;
};

export type ScoringResult = {
  score: number;
  rationale: string;
  confidence: "low" | "medium" | "high";
  citations: ScoringEvidence[];
  evidenceVersion: string;
  fallback: boolean;
};

const SYSTEM = `You are the lobbycat scoring brain.

You score a single (AI company, frame) pair on a 1.0–5.0 decimal scale, given:
- the frame's definition (low/high anchor descriptions)
- a short description of the company
- recent publications, blog posts, filings, and lobbying records

Return STRICT JSON, no preamble, no markdown:
{
  "score": <number, 1.0..5.0, one decimal>,
  "rationale": "<2-3 sentences, plain prose, no hype, name specific evidence>",
  "confidence": "low" | "medium" | "high",
  "citation_ids": [<int>, ...]
}

Rules:
- "score" is a decimal (e.g. 3.7), not an integer. Anchor 1 = low side, 5 = high side per the frame.
- "rationale" stays under 60 words. Reference what you actually saw. No marketing language.
- "confidence" is "low" if evidence is thin or contradictory, "high" if substantial.
- "citation_ids" lists the evidence ids (provided in the user message) that most informed the score.`;

function median(scale: number): number {
  // For a 5-scale, the median centre is 3.0; keeps us safe when no API key.
  return Number(((scale + 1) / 2).toFixed(1));
}

function hashEvidence(payload: {
  pubs: Array<{ id: number; title: string | null; summary: string | null }>;
  lobby: Array<{ id: number; topics: string[]; spend: number | null }>;
}): string {
  const h = createHash("sha256");
  for (const p of payload.pubs) h.update(`p:${p.id}:${p.summary ?? p.title ?? ""}\n`);
  for (const l of payload.lobby)
    h.update(`l:${l.id}:${l.spend ?? ""}:${(l.topics ?? []).join(",")}\n`);
  return h.digest("hex").slice(0, 16);
}

async function callAnthropic(args: {
  apiKey: string;
  company: { name: string; description: string | null; focusAreas: string[] };
  frame: {
    name: string;
    description: string | null;
    scale: number;
    lowLabel: string | null;
    lowDescription: string | null;
    highLabel: string | null;
    highDescription: string | null;
  };
  pubs: Array<{
    id: number;
    title: string;
    type: string;
    summary: string | null;
    topics: string[];
    publishedAt: Date | null;
  }>;
  lobby: Array<{
    id: number;
    jurisdiction: string;
    period: string;
    topics: string[];
    spendEur: number | null;
    spendUsd: number | null;
    meetings: number | null;
  }>;
}): Promise<Omit<ScoringResult, "evidenceVersion" | "fallback"> | null> {
  const { company, frame, pubs, lobby } = args;
  const userMsg = JSON.stringify(
    {
      frame: {
        name: frame.name,
        description: frame.description,
        scale: `1.0..${frame.scale}.0`,
        low: { label: frame.lowLabel, description: frame.lowDescription },
        high: { label: frame.highLabel, description: frame.highDescription },
      },
      company: {
        name: company.name,
        description: company.description,
        focus_areas: company.focusAreas,
      },
      evidence: {
        publications: pubs.map((p) => ({
          id: p.id,
          type: p.type,
          title: p.title,
          summary: p.summary,
          topics: p.topics,
          published_at: p.publishedAt?.toISOString() ?? null,
        })),
        lobbying_records: lobby.map((l) => ({
          id: l.id,
          jurisdiction: l.jurisdiction,
          period: l.period,
          topics: l.topics,
          spend_eur: l.spendEur,
          spend_usd: l.spendUsd,
          meetings: l.meetings,
        })),
      },
    },
    null,
    2,
  );

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": args.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 600,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as {
      score?: unknown;
      rationale?: unknown;
      confidence?: unknown;
      citation_ids?: unknown;
    };
    const rawScore = typeof parsed.score === "number" ? parsed.score : Number(parsed.score);
    if (!Number.isFinite(rawScore)) return null;
    const score = Math.max(1, Math.min(frame.scale, Number(rawScore.toFixed(1))));
    const rationale =
      typeof parsed.rationale === "string" ? parsed.rationale.trim() : "";
    const confidenceRaw =
      typeof parsed.confidence === "string"
        ? parsed.confidence.toLowerCase().trim()
        : "medium";
    const confidence: "low" | "medium" | "high" =
      confidenceRaw === "low" || confidenceRaw === "high"
        ? (confidenceRaw as "low" | "high")
        : "medium";
    const citationIds = Array.isArray(parsed.citation_ids)
      ? (parsed.citation_ids
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n)) as number[])
      : [];

    const citations: ScoringEvidence[] = [];
    for (const id of citationIds) {
      if (pubs.some((p) => p.id === id))
        citations.push({ kind: "publication", id, weight: 1.0 });
      else if (lobby.some((l) => l.id === id))
        citations.push({ kind: "lobbying_record", id, weight: 1.0 });
    }

    return { score, rationale, confidence, citations };
  } catch {
    return null;
  }
}

export type RescoreOptions = {
  force?: boolean; // skip evidence-version short-circuit
};

export async function rescoreCompanyFrame(
  companyId: number,
  frameId: number,
  opts: RescoreOptions = {},
): Promise<ScoringResult> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) throw new Error(`company ${companyId} not found`);

  const [frame] = await db
    .select()
    .from(framesTable)
    .where(eq(framesTable.id, frameId))
    .limit(1);
  if (!frame) throw new Error(`frame ${frameId} not found`);

  const pubs = await db
    .select({
      id: publications.id,
      type: publications.type,
      title: publications.title,
      summary: publications.summary,
      topics: publications.topics,
      publishedAt: publications.publishedAt,
    })
    .from(publications)
    .where(eq(publications.companyId, companyId))
    .orderBy(desc(publications.publishedAt))
    .limit(MAX_PUBS);

  const lobby = await db
    .select({
      id: lobbyingRecords.id,
      jurisdiction: lobbyingRecords.jurisdiction,
      period: lobbyingRecords.period,
      topics: lobbyingRecords.topics,
      spendEur: lobbyingRecords.spendEur,
      spendUsd: lobbyingRecords.spendUsd,
      meetings: lobbyingRecords.meetings,
    })
    .from(lobbyingRecords)
    .where(eq(lobbyingRecords.companyId, companyId))
    .limit(MAX_LOBBY);

  const evidenceVersion = hashEvidence({
    pubs: pubs.map((p) => ({ id: p.id, title: p.title, summary: p.summary })),
    lobby: lobby.map((l) => ({
      id: l.id,
      topics: l.topics ?? [],
      spend: l.spendEur ?? l.spendUsd ?? null,
    })),
  });

  // Short-circuit: same evidence + score exists → return existing unless forced.
  if (!opts.force) {
    const [existing] = await db
      .select()
      .from(frameScores)
      .where(
        and(
          eq(frameScores.companyId, companyId),
          eq(frameScores.frameId, frameId),
        ),
      )
      .limit(1);
    if (existing && existing.evidenceVersion === evidenceVersion) {
      return {
        score: Number(existing.score),
        rationale: existing.rationale ?? "",
        confidence:
          (existing.confidence as "low" | "medium" | "high" | null) ?? "medium",
        citations: [],
        evidenceVersion,
        fallback: false,
      };
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let result: Omit<ScoringResult, "evidenceVersion" | "fallback"> | null = null;
  let fallback = false;
  if (apiKey) {
    result = await callAnthropic({
      apiKey,
      company: {
        name: company.name,
        description: company.description,
        focusAreas: company.focusAreas ?? [],
      },
      frame: {
        name: frame.name,
        description: frame.description,
        scale: frame.scale,
        lowLabel: frame.lowLabel,
        lowDescription: frame.lowDescription,
        highLabel: frame.highLabel,
        highDescription: frame.highDescription,
      },
      pubs: pubs.map((p) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        summary: p.summary,
        topics: p.topics ?? [],
        publishedAt: p.publishedAt,
      })),
      lobby,
    });
  }
  if (!result) {
    fallback = true;
    result = {
      score: median(frame.scale),
      rationale: apiKey
        ? "Model call failed; centre-of-scale placeholder until next rescore."
        : "No ANTHROPIC_API_KEY configured; centre-of-scale placeholder.",
      confidence: "low",
      citations: [],
    };
  }

  const scoredAt = new Date();

  await db
    .insert(frameScores)
    .values({
      companyId,
      frameId,
      score: result.score.toFixed(1),
      rationale: result.rationale,
      confidence: result.confidence,
      scoredAt,
      evidenceVersion,
      updatedAt: scoredAt,
    })
    .onConflictDoUpdate({
      target: [frameScores.companyId, frameScores.frameId],
      set: {
        score: result.score.toFixed(1),
        rationale: result.rationale,
        confidence: result.confidence,
        scoredAt,
        evidenceVersion,
        updatedAt: scoredAt,
      },
    });

  // Replace evidence rows for this (company, frame).
  await db
    .delete(frameScoreEvidence)
    .where(
      and(
        eq(frameScoreEvidence.companyId, companyId),
        eq(frameScoreEvidence.frameId, frameId),
      ),
    );
  if (result.citations.length > 0) {
    await db.insert(frameScoreEvidence).values(
      result.citations.map((c) => ({
        companyId,
        frameId,
        evidenceKind: c.kind,
        evidenceId: c.id,
        weight: c.weight.toFixed(1),
        scoredAt,
      })),
    );
  }

  return { ...result, evidenceVersion, fallback };
}

export async function rescoreCompany(
  companyId: number,
  frameId?: number,
  opts: RescoreOptions = {},
): Promise<ScoringResult[]> {
  if (frameId !== undefined) {
    return [await rescoreCompanyFrame(companyId, frameId, opts)];
  }
  const allFrames = await db
    .select({ id: framesTable.id })
    .from(framesTable)
    .orderBy(framesTable.sortIndex);
  const results: ScoringResult[] = [];
  for (const f of allFrames) {
    results.push(await rescoreCompanyFrame(companyId, f.id, opts));
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* Live aggregate maths (shared with client hook)                     */
/* ------------------------------------------------------------------ */

// Implementation lives in ./aggregate.ts (client-safe, no DB deps).
// Re-exported here so existing server callers keep working.
export { aggregateScore, type FrameWeightLevel } from "./aggregate";
