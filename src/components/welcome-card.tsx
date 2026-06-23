"use client";

import { useState, useTransition } from "react";
import quotes from "@/db/lobbycat-quotes.json";
import { rescoreCompanyAction } from "@/app/actions-rescore";
import type { WelcomeBackData } from "@/lib/welcome-back";

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
  firstName,
  welcomeBack,
}: {
  welcomeLine: string;
  oldestScoreAt: string | null;
  ageDays: number | null;
  companyIds: number[];
  firstName?: string | null;
  welcomeBack?: WelcomeBackData;
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
      {welcomeBack?.available ? (
        <WelcomeBackDiff
          welcomeBack={welcomeBack}
          firstName={firstName ?? null}
        />
      ) : null}
    </section>
  );
}

/**
 * v0.7 step 8 — "New since you were last in:" panel.
 *
 * Renders Glyphie's diff (filtered against the user's frame weights) under
 * the welcome quote. Three named bullets max, with an optional rollup
 * count for the residual. Degrades to a single muted line when the window
 * is empty, and the parent skips rendering entirely when the feed is
 * missing / malformed (`welcomeBack.available === false`).
 */
function WelcomeBackDiff({
  welcomeBack,
  firstName,
}: {
  welcomeBack: WelcomeBackData;
  firstName: string | null;
}) {
  const heading = firstName
    ? `New since you were last in, ${firstName}…`
    : "New since you were last in…";
  if (welcomeBack.newEventCount === 0) {
    return (
      <div
        className="pt-4 mono text-[11px] uppercase tracking-[0.14em] text-whisper"
        data-testid="welcome-back-empty"
      >
        no new updates since your last visit
      </div>
    );
  }
  return (
    <div
      className="pt-4"
      data-testid="welcome-back"
      aria-label="new since you were last in"
    >
      <p className="mono text-[11px] uppercase tracking-[0.14em] text-whisper pb-2">
        {heading}
      </p>
      <ul className="prose-face text-sm text-[var(--fg-prose)] space-y-1.5">
        {welcomeBack.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span
              aria-hidden
              className="text-[var(--accent,#FF00FF)] select-none"
            >
              ·
            </span>
            {b.href ? (
              <a
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-rule hover:decoration-current"
              >
                {b.text}
              </a>
            ) : (
              <span className="text-muted">{b.text}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
