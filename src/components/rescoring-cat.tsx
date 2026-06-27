"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import quotes from "@/db/lobbycat-quotes.json";

type Quotes = { rescoring: string[] };

type Status = { pending: number; frames: number[] };

const POLL_INTERVAL_MS = 2000;
const QUOTE_ROTATE_MS = 4500;

/**
 * v0.6 step 11.5 — animated cat that surfaces whenever the background frame
 * rescore worker is in flight (any `frame_scores.stale_at` IS NOT NULL).
 *
 * - Polls `/api/rescore-status` every 2s. Lightweight (count + frame ids).
 * - When `pending > 0`, fades in the pixel cat with a tiny tail/blink CSS
 *   animation and cycles through the existing `rescoring[]` quotes.
 * - When `pending === 0`, fades out and stops the poll cascade.
 *
 * Mounted high in the layout (welcome card area on `/`) so it can flicker
 * to life mid-page without remounting the page that triggered the edit.
 */
export function RescoringCat() {
  const q = quotes as unknown as Quotes;
  const pool = q.rescoring ?? [];

  const [status, setStatus] = useState<Status>({ pending: 0, frames: [] });
  const [quoteIdx, setQuoteIdx] = useState(() =>
    pool.length > 0 ? Math.floor(Math.random() * pool.length) : 0,
  );

  // Poll. Always run — but back off to a slow heartbeat when idle so the cat
  // notices when something *new* goes stale (server-action triggered).
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const r = await fetch("/api/rescore-status", { cache: "no-store" });
        if (!cancelled && r.ok) {
          const data = (await r.json()) as Status;
          setStatus(data);
        }
      } catch {
        // Network blips are fine — just try again next tick.
      }
      if (!cancelled) {
        const next = status.pending > 0 ? POLL_INTERVAL_MS : 8000;
        timer = setTimeout(tick, next);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // Re-establish the loop when pending toggles between 0 / >0 so the
    // interval shifts gear.
  }, [status.pending]);

  // Cycle quotes while active.
  useEffect(() => {
    if (status.pending === 0 || pool.length === 0) return;
    const id = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % pool.length);
    }, QUOTE_ROTATE_MS);
    return () => clearInterval(id);
  }, [status.pending, pool.length]);

  const visible = status.pending > 0;
  const quote = pool[quoteIdx] ?? "lobbycat is re-reading…";

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed bottom-4 right-4 z-40 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-end gap-3 max-w-[18rem]">
        <div className="rescoring-cat-sprite shrink-0">
          <Image
            src="/cat/lobbycat.png"
            alt=""
            width={56}
            height={56}
            className="block"
            priority={false}
          />
        </div>
        <div className="rounded-lg bg-surface border border-rule px-3 py-2 shadow-sm">
          <p className="mono text-[0.65rem] uppercase tracking-[0.12em] text-whisper">
            re-scoring · {status.pending} cell{status.pending === 1 ? "" : "s"}
          </p>
          <p className="serif text-sm text-ink mt-1 leading-snug">{quote}</p>
        </div>
      </div>

      <style jsx>{`
        .rescoring-cat-sprite {
          animation: cat-sway 1.8s ease-in-out infinite;
          transform-origin: 50% 90%;
        }
        .rescoring-cat-sprite :global(img) {
          animation: cat-blink 4s steps(1, end) infinite;
          image-rendering: pixelated;
        }
        @keyframes cat-sway {
          0%, 100% {
            transform: rotate(-2deg) translateY(0);
          }
          50% {
            transform: rotate(2deg) translateY(-2px);
          }
        }
        @keyframes cat-blink {
          0%, 92%, 100% {
            filter: none;
          }
          93%, 96% {
            filter: brightness(0.85) contrast(1.05);
          }
        }
      `}</style>
    </div>
  );
}
