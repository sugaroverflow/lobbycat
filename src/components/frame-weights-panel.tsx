"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setFrameWeights } from "@/app/actions";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";

type WeightFrame = {
  id: number;
  name: string;
  lowLabel: string | null;
  highLabel: string | null;
};

const LEVELS: FrameWeightLevel[] = ["low", "medium", "high"];
const GLYPH: Record<FrameWeightLevel, string> = {
  low: "L",
  medium: "M",
  high: "H",
};
const COPY: Record<FrameWeightLevel, string> = {
  low: "low",
  medium: "medium",
  high: "high",
};

/**
 * v0.6 step 6 — L/M/H weight controls per scale frame.
 *
 * Sits above the FramesEditor on /frames. The home table re-aggregates
 * client-side (via `useLiveAggregates`) when these weights persist, so
 * Aadi can flip a weight, hop home, and see the field rearrange without
 * waiting on a rescore.
 *
 * Pure persistence: no scores re-run from here. Frame definition edits
 * (which DO require rescoring) live in the FramesEditor below.
 */
export function FrameWeightsPanel({
  frames,
  initial,
}: {
  frames: WeightFrame[];
  initial: Record<string, FrameWeightLevel>;
}) {
  const [weights, setWeights] = useState<Record<string, FrameWeightLevel>>(
    () => {
      const seed: Record<string, FrameWeightLevel> = {};
      for (const f of frames) {
        const v = initial[String(f.id)];
        seed[String(f.id)] = v ?? "medium";
      }
      return seed;
    },
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const persist = (patch: Record<string, FrameWeightLevel>) => {
    startTransition(async () => {
      await setFrameWeights(patch);
      setSavedAt(Date.now());
    });
  };

  const setOne = (frameId: number, level: FrameWeightLevel) => {
    const key = String(frameId);
    if (weights[key] === level) return;
    const next = { ...weights, [key]: level };
    setWeights(next);
    persist({ [key]: level });
  };

  const resetAll = () => {
    const next: Record<string, FrameWeightLevel> = {};
    for (const f of frames) next[String(f.id)] = "medium";
    setWeights(next);
    persist(next);
  };

  if (frames.length === 0) return null;

  return (
    <section
      aria-label="Frame weights"
      className="mb-12 border border-rule rounded-sm bg-panel-raised/40"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-rule">
        <div>
          <h2 className="serif text-lg text-ink font-medium">
            What you care about
          </h2>
          <p className="serif text-sm text-muted mt-0.5">
            Set each frame to{" "}
            <span className="mono text-xs">low</span> ·{" "}
            <span className="mono text-xs">medium</span> ·{" "}
            <span className="mono text-xs">high</span>. The{" "}
            <Link href="/" className="underline hover:text-ink">
              ranked table
            </Link>{" "}
            re-orders instantly.
          </p>
        </div>
        <div className="flex items-center gap-3 mono text-[10px] uppercase tracking-[0.14em] text-whisper">
          {pending ? (
            <span>saving…</span>
          ) : savedAt ? (
            <span>saved</span>
          ) : null}
          <button
            type="button"
            onClick={resetAll}
            disabled={pending}
            className="border border-rule-strong px-2 py-1 rounded-sm hover:bg-panel disabled:opacity-60"
            title="Reset every frame to medium"
          >
            reset to default
          </button>
        </div>
      </header>
      <ul className="divide-y divide-rule">
        {frames.map((f) => {
          const cur = weights[String(f.id)] ?? "medium";
          return (
            <li
              key={f.id}
              className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="serif text-ink text-base">{f.name}</div>
                {(f.lowLabel || f.highLabel) && (
                  <div className="mono text-[10px] uppercase tracking-[0.14em] text-whisper mt-0.5 truncate">
                    {f.lowLabel ?? "—"}{" "}
                    <span className="opacity-60">→</span>{" "}
                    {f.highLabel ?? "—"}
                  </div>
                )}
              </div>
              <div
                role="radiogroup"
                aria-label={`Weight for ${f.name}`}
                className="inline-flex border border-rule-strong rounded-sm overflow-hidden self-start md:self-auto"
              >
                {LEVELS.map((lvl) => {
                  const active = cur === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setOne(f.id, lvl)}
                      disabled={pending}
                      className={[
                        "px-3 py-1.5 mono text-[11px] uppercase tracking-[0.14em]",
                        "border-r border-rule-strong last:border-r-0",
                        active
                          ? "bg-ink text-bg"
                          : "bg-transparent text-muted hover:bg-panel",
                        "disabled:opacity-60",
                      ].join(" ")}
                      title={COPY[lvl]}
                    >
                      {GLYPH[lvl]}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
