"use client";

import { useMemo } from "react";
import {
  aggregateScore,
  type FrameWeightLevel,
} from "./index";

export type FrameScoreSnapshot = {
  companyId: number;
  frameId: number;
  score: number | null;
};

export type CompanyAggregate = {
  companyId: number;
  overall: number | null;
  coverage: number;
};

/**
 * Re-aggregate frame scores against the user's current weights, client-side.
 *
 * The server passes the latest `frame_scores` snapshot (companyId × frameId →
 * score). The user's L/M/H weights are applied here so the table re-ranks
 * instantly when weights change — no round trip until the user wants a
 * full re-score.
 */
export function useLiveAggregates(
  snapshot: FrameScoreSnapshot[],
  weights: Record<string, FrameWeightLevel>,
): CompanyAggregate[] {
  return useMemo(() => {
    const byCompany = new Map<
      number,
      Array<{ frameId: number; score: number | null }>
    >();
    for (const row of snapshot) {
      const list = byCompany.get(row.companyId) ?? [];
      list.push({ frameId: row.frameId, score: row.score });
      byCompany.set(row.companyId, list);
    }
    const out: CompanyAggregate[] = [];
    for (const [companyId, rows] of byCompany.entries()) {
      const { overall, coverage } = aggregateScore(rows, weights);
      out.push({ companyId, overall, coverage });
    }
    out.sort((a, b) => {
      if (a.overall === null && b.overall === null) return 0;
      if (a.overall === null) return 1;
      if (b.overall === null) return -1;
      return b.overall - a.overall;
    });
    return out;
  }, [snapshot, weights]);
}
