"use client";

import { useState, useTransition } from "react";
import quotes from "@/db/lobbycat-quotes.json";
import { rescoreCompanyAction } from "@/app/actions-rescore";
import type { WelcomeBackData } from "@/lib/welcome-back";
import type { WelcomeBackOffer } from "@/lib/clarify/welcome-back-offer";
import { ClarifyLauncher } from "@/components/clarify-launcher";

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
  clarifyOffer,
}: {
  welcomeLine: string;
  oldestScoreAt: string | null;
  ageDays: number | null;
  companyIds: number[];
  firstName?: string | null;
  welcomeBack?: WelcomeBackData;
  clarifyOffer?: WelcomeBackOffer;
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
        : "lobbycat is re-reading",
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
      {clarifyOffer?.offer ? (
        <div
          className="pt-4"
          data-testid="welcome-back-clarify-offer"
          aria-label="clarify offer"
        >
          <p className="prose-face text-sm text-muted italic max-w-2xl pb-1">
            {clarifyOffer.seedLine}
          </p>
          <ClarifyLauncher
            variant="link"
            trigger="welcome-back"
            seedCompanyId={clarifyOffer.seedCompanyId}
            seedFrameId={clarifyOffer.seedFrameId}
            seedLine={clarifyOffer.seedLine}
            label="want to sit with this for a minute?"
          />
        </div>
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

  // v0.8.1 Phase B F2.2 / F2.3 — both states sit in the same vaporwave
  // alert frame (cyan top + magenta left, rule right + bottom) as the
  // dashboard cards (see dashboard-cards.tsx §3.4). Keeps the dashboard's
  // visual language consistent and gives empty-state actual presence
  // instead of a whispered one-liner.
  const alertFrame = {
    background: "var(--card-interior-bg)",
    color: "var(--card-interior-text)",
    borderTop: "1px solid var(--readout-cyan)",
    borderLeft: "1px solid var(--accent-action)",
    borderRight: "1px solid var(--rule)",
    borderBottom: "1px solid var(--rule)",
    borderRadius: "var(--radius-panel)",
  } as const;

  if (welcomeBack.newEventCount === 0) {
    // F2.2 — explicit empty state. Cyan eyebrow + a single calm prose
    // line so the dashboard never opens into dead space.
    return (
      <div
        className="mt-4 px-5 py-4"
        style={alertFrame}
        data-testid="welcome-back-empty"
        aria-label="no new updates since you were last in"
      >
        <p className="mono text-[11px] uppercase tracking-[0.14em] text-readout pb-1">
          {heading}
        </p>
        <p className="prose-face text-sm text-card-interior-muted">
          nothing new since your last visit. lobbycat will let you know.
        </p>
      </div>
    );
  }
  // F2.3 — populated state. Same alert frame; if a synthesised prose
  // snapshot is available and fresh, it sits above the bullets as an
  // editorial briefing. Bullets stay for source-verifiability (per
  // Fatima 2026-07-18: card shows prose + bullets, option b).
  return (
    <div
      className="mt-4 px-5 py-4"
      style={alertFrame}
      data-testid="welcome-back"
      aria-label="new since you were last in"
    >
      <p className="mono text-[11px] uppercase tracking-[0.14em] text-readout pb-2">
        {heading}
      </p>
      {welcomeBack.snapshot ? (
        <p
          className="prose-face text-sm text-card-interior-text leading-relaxed pb-3"
          data-testid="welcome-back-snapshot"
        >
          {renderInlineMarkdownLinks(welcomeBack.snapshot.summary)}
        </p>
      ) : null}
      <ul className="prose-face text-sm space-y-1.5">
        {welcomeBack.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span
              aria-hidden
              className="text-[var(--accent-action)] select-none"
            >
              ·
            </span>
            {b.href ? (
              <a
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-card-interior-text underline decoration-rule hover:decoration-current"
              >
                {b.text}
              </a>
            ) : (
              <span className="text-card-interior-muted">{b.text}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Tiny inline-markdown-link renderer for the LLM-synthesised snapshot
 * prose. We only handle `[text](url)` — the synthesise-daily-summary.mjs
 * prompt is locked to that form and never asks for bold/italic/code/etc.
 * Keep it strict: any bracketed segment that doesn't match the anchored
 * shape falls through as literal text so we never render half-parsed
 * markdown.
 */
function renderInlineMarkdownLinks(text: string): React.ReactNode[] {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(text.slice(lastIndex, match.index));
    }
    out.push(
      <a
        key={`sl-${key++}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-rule hover:decoration-current text-card-interior-text"
      >
        {match[1]}
      </a>,
    );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    out.push(text.slice(lastIndex));
  }
  return out;
}
