"use client";

import { useState, useTransition } from "react";
import { setFrameScore } from "@/app/actions";

type Frame = {
  id: number;
  name: string;
  description: string | null;
  scale: number;
  lowLabel: string | null;
  highLabel: string | null;
  score: number | null;
  rationale: string | null;
};

export function FrameScorer({
  companyId,
  frame,
}: {
  companyId: number;
  frame: Frame;
}) {
  const [score, setScore] = useState<number | null>(frame.score);
  const [rationale, setRationale] = useState(frame.rationale || "");
  const [pending, start] = useTransition();

  const submit = (newScore: number) => {
    setScore(newScore);
    start(() => setFrameScore({ companyId, frameId: frame.id, score: newScore, rationale }));
  };

  const submitRationale = () => {
    if (score === null) return;
    start(() => setFrameScore({ companyId, frameId: frame.id, score, rationale }));
  };

  return (
    <div className="py-5">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <div className="flex items-baseline gap-3">
          <h4 className="serif text-base text-ink font-medium">{frame.name}</h4>
          <span className="mono text-xs text-whisper">
            {score !== null ? `${score} / ${frame.scale}` : "—"}
          </span>
        </div>
        {pending && <span className="mono text-[10px] text-whisper">saving…</span>}
      </div>
      {frame.description && (
        <p className="serif text-sm text-muted mb-3 max-w-2xl">{frame.description}</p>
      )}
      <div className="flex items-center gap-1.5">
        <span className="mono text-[10px] uppercase tracking-[0.1em] text-whisper w-32 shrink-0">
          {frame.lowLabel}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: frame.scale }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => submit(n)}
              className={`mono text-xs w-8 h-8 rounded-sm border transition ${
                score === n
                  ? "bg-accent text-white border-accent"
                  : "border-rule text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="mono text-[10px] uppercase tracking-[0.1em] text-whisper w-32 shrink-0 text-right">
          {frame.highLabel}
        </span>
      </div>
      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        onBlur={submitRationale}
        placeholder="why this score? (optional)"
        rows={2}
        className="serif text-sm text-body w-full mt-3 px-3 py-2 bg-surface border border-rule rounded-sm placeholder:text-whisper focus:outline-none focus:border-accent"
      />
    </div>
  );
}
