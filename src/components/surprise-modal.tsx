"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import quotes from "@/db/lobbycat-quotes.json";
import { getSurpriseAction } from "@/app/actions-surprise";
import type { SurprisePick, SurpriseVariant } from "@/lib/surprise";

type Quotes = { surprisePreamble: string[] };

const MAX_PICKS_PER_SESSION = 3;

/**
 * Surprise modal — §3.5 of REFACTOR-v0.6.
 *
 * - Up to 3 picks per session (session = while the modal is open here).
 * - Each pick: a `surprisePreamble` quote + a one-sentence "why" from the
 *   server, with a link into the company detail page.
 * - Variants cycle Adjacency → Recency → Underrated.
 *
 * Trigger lives in the nav (`<SurpriseButton />`).
 */
export function SurpriseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const q = quotes as unknown as Quotes;
  const [picks, setPicks] = useState<SurprisePick[]>([]);
  const [preambles, setPreambles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [exhausted, setExhausted] = useState(false);

  const requestedRef = useRef(false);

  const randomPreamble = useCallback(() => {
    const pool = q.surprisePreamble ?? [];
    if (pool.length === 0) return "";
    return pool[Math.floor(Math.random() * pool.length)];
  }, [q.surprisePreamble]);

  const drawNext = useCallback(() => {
    if (picks.length >= MAX_PICKS_PER_SESSION) {
      setExhausted(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      // Round-robin: prefer a variant we haven't shown yet.
      const shownVariants = new Set(picks.map((p) => p.variant));
      const allVariants: SurpriseVariant[] = ["adjacency", "recency", "underrated"];
      const fresh = allVariants.filter((v) => !shownVariants.has(v));
      const exclude = fresh.length > 0 ? allVariants.filter((v) => !fresh.includes(v)) : [];
      const res = await getSurpriseAction({
        excludeIds: picks.map((p) => p.company.id),
        excludeVariants: exclude,
      });
      if (!res.ok) {
        setError(res.reason);
        return;
      }
      setPicks((xs) => [...xs, res.pick]);
      setPreambles((xs) => [...xs, randomPreamble()]);
    });
  }, [picks, randomPreamble]);

  // Open → first pick. (Reset on close is handled by the parent when it
  // toggles `open` false → true again; we key off `requestedRef` so the
  // first-pick request only fires once per open.)
  useEffect(() => {
    if (open && !requestedRef.current) {
      requestedRef.current = true;
      drawNext();
    } else if (!open && requestedRef.current) {
      requestedRef.current = false;
    }
  }, [open, drawNext]);

  // Reset picks when the modal closes — done in a callback (not an effect)
  // via the parent's onClose, plus a defensive cleanup on unmount.
  const handleClose = useCallback(() => {
    setPicks([]);
    setPreambles([]);
    setError(null);
    setExhausted(false);
    onClose();
  }, [onClose]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!open) return null;

  const latestIdx = picks.length - 1;
  const latest = latestIdx >= 0 ? picks[latestIdx] : null;
  const preamble = latestIdx >= 0 ? preambles[latestIdx] : "";
  const canShowAnother = picks.length < MAX_PICKS_PER_SESSION && !exhausted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-ink/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Surprise me"
      onClick={handleClose}
    >
      <div
        className="bg-bg border border-rule max-w-lg w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="serif text-xl text-ink">Surprise</h2>
          <button
            type="button"
            onClick={handleClose}
            className="mono text-xs uppercase tracking-[0.14em] text-muted hover:text-ink transition"
            aria-label="Close surprise"
          >
            Close
          </button>
        </div>

        {pending && picks.length === 0 ? (
          <p className="text-body italic">The cat is thinking…</p>
        ) : null}

        {error ? (
          <p className="text-body italic mb-4">{error}</p>
        ) : null}

        {latest ? (
          <div>
            {preamble ? (
              <p className="text-muted italic mb-4">{preamble}</p>
            ) : null}
            <Link
              href={`/companies/${latest.company.slug}`}
              onClick={handleClose}
              className="block border border-rule p-4 hover:bg-rule/20 transition"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="serif text-lg text-ink">{latest.company.name}</span>
                <span className="mono text-[10px] uppercase tracking-[0.14em] text-whisper">
                  {latest.variant}
                </span>
              </div>
              {latest.company.hq ? (
                <div className="mono text-xs text-muted mb-2">{latest.company.hq}</div>
              ) : null}
              <p className="text-body text-sm">{latest.line}</p>
              {latest.frame ? (
                <div className="mono text-[10px] uppercase tracking-[0.14em] text-whisper mt-3">
                  anchor · {latest.frame.name}
                  {latest.anchor && latest.anchor.kind === "score"
                    ? ` · ${latest.anchor.value.toFixed(1)}/5`
                    : latest.anchor && latest.anchor.kind === "daysAgo"
                      ? ` · ${latest.anchor.value}d ago`
                      : latest.anchor && latest.anchor.kind === "aggregate"
                        ? ` · ${latest.anchor.value.toFixed(1)}/5 overall`
                        : ""}
                </div>
              ) : null}
            </Link>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between">
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-whisper">
            {picks.length}/{MAX_PICKS_PER_SESSION} picks
          </span>
          {canShowAnother && latest ? (
            <button
              type="button"
              onClick={drawNext}
              disabled={pending}
              className="mono text-xs uppercase tracking-[0.14em] text-ink border border-rule px-3 py-1 hover:bg-rule/30 transition disabled:opacity-50"
            >
              {pending ? "Pawing through…" : "Show me another"}
            </button>
          ) : !canShowAnother && latest ? (
            <span className="mono text-[10px] uppercase tracking-[0.14em] text-whisper italic">
              The cat is tired.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SurpriseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mono text-xs uppercase tracking-[0.14em] text-muted hover:text-ink transition"
        aria-haspopup="dialog"
      >
        Surprise
      </button>
      <SurpriseModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
