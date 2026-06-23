"use client";

import { useState, useTransition } from "react";
import quotes from "@/db/lobbycat-quotes.json";
import { rescoreCompanyAction } from "@/app/actions-rescore";

type Quotes = {
  welcomeBack: string[];
  rescoring: string[];
};

const STALE_DAYS = 7;

/**
 * Welcome card for the v0.6 ranked home (§3.2).
 *
 * - `welcomeLine` is picked on the server (random per request render) so
 *   the client renders pure and the SSR hydrates without flicker.
 * - `ageDays` is also computed on the server from `oldestScoreAt`; this is
 *   plenty accurate for "scored N days ago" staleness display.
 */
export function WelcomeCard({
  welcomeLine,
  oldestScoreAt,
  ageDays,
  companyIds,
}: {
  welcomeLine: string;
  oldestScoreAt: string | null;
  ageDays: number | null;
  companyIds: number[];
}) {
  const q = quotes as unknown as Quotes;
  const stale = ageDays !== null && ageDays > STALE_DAYS;

  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);

  const handleRescore = () => {
    const pool = q.rescoring ?? [];
    setProgress(
      pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : "the cat is re-reading",
    );
    startTransition(async () => {
      // Sequential to keep the LLM bill polite. The /api/cron/rescore
      // worker does the nightly catch-up; this is the user-initiated kick.
      for (const id of companyIds) {
        await rescoreCompanyAction(id);
      }
      setProgress(null);
    });
  };

  return (
    <section
      aria-label="Welcome"
      className="max-w-[72rem] mx-auto px-6 pt-10 pb-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-rule pb-6">
        <p
          className="prose-face text-base text-[var(--fg-prose)] leading-relaxed max-w-2xl"
          data-testid="welcome-quote"
        >
          {welcomeLine}
        </p>
        <div className="flex items-center gap-3 mono text-[11px] uppercase tracking-[0.14em] text-whisper">
          {ageDays !== null ? (
            <span title={oldestScoreAt ?? undefined}>
              scored {ageDays === 0 ? "today" : `${ageDays}d ago`}
            </span>
          ) : (
            <span>no scores yet</span>
          )}
          {stale ? (
            <button
              type="button"
              onClick={handleRescore}
              disabled={pending}
              className="border border-rule-strong px-2 py-1 rounded-sm hover:bg-panel-raised disabled:opacity-60"
            >
              {pending ? "re-scoring…" : "re-score now"}
            </button>
          ) : null}
        </div>
      </div>
      {pending && progress ? (
        <p className="prose-face text-xs text-muted italic pt-2">{progress}</p>
      ) : null}
    </section>
  );
}
