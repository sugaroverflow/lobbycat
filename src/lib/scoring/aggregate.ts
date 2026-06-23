/**
 * Client-safe aggregate maths for v0.6 live scoring.
 *
 * Lives in its own module so client components (`useLiveAggregates`) can
 * import it without dragging the DB / Anthropic / drizzle deps in
 * `./index.ts` into the browser bundle.
 */

export type FrameWeightLevel = "low" | "medium" | "high";

const WEIGHT_MULT: Record<FrameWeightLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function aggregateScore(
  perFrame: Array<{ frameId: number; score: number | null }>,
  weights: Record<string, FrameWeightLevel>,
): { overall: number | null; coverage: number } {
  let weightedSum = 0;
  let weightTotal = 0;
  let covered = 0;
  for (const row of perFrame) {
    const w = WEIGHT_MULT[weights[String(row.frameId)] ?? "medium"];
    if (row.score === null) continue;
    weightedSum += row.score * w;
    weightTotal += w;
    covered += 1;
  }
  const overall = weightTotal === 0 ? null : weightedSum / weightTotal;
  return {
    overall: overall === null ? null : Number(overall.toFixed(2)),
    coverage: covered,
  };
}
