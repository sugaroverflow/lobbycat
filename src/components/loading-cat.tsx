"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Shared animated pixel cat for loading surfaces (§7 of REFACTOR-v0.7).
 *
 * - `calm` variant: the Vaporwave "calm cousin" palette — soft halo, sway+blink,
 *   used on per-card surfaces like the fit-note panel.
 * - Cycles through a quote pool every `rotateMs` (default 1.5s — §7 spec).
 *
 * The "theatre" variant lives inline inside `<SurpriseModal>` because it shares
 * the same backdrop/scanline/gradient context. We just pass cycling quotes
 * back into the modal via its own state.
 */
export function LoadingCat({
  quotes,
  rotateMs = 1500,
  size = 48,
  label = "thinking…",
  align = "row",
}: {
  quotes: string[];
  rotateMs?: number;
  size?: number;
  label?: string;
  align?: "row" | "column";
}) {
  const pool = quotes.length > 0 ? quotes : [label];
  const [idx, setIdx] = useState(() =>
    pool.length > 0 ? Math.floor(Math.random() * pool.length) : 0,
  );

  useEffect(() => {
    if (pool.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % pool.length);
    }, rotateMs);
    return () => clearInterval(id);
  }, [pool.length, rotateMs]);

  const quote = pool[idx] ?? label;

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        align === "column"
          ? "flex flex-col items-center gap-3 py-3"
          : "flex items-center gap-3 py-2"
      }
    >
      <div className="loading-cat shrink-0">
        <Image
          src="/cat/lobbycat.png"
          alt=""
          width={size}
          height={size}
          className="block"
          priority={false}
        />
      </div>
      <div className={align === "column" ? "text-center" : ""}>
        <p className="mono text-[0.65rem] uppercase tracking-[0.12em] text-whisper">
          {label}
        </p>
        <p
          key={idx}
          className={`serif italic text-sm text-body leading-snug loading-cat-quote ${
            align === "column" ? "mt-1" : "mt-0.5"
          }`}
        >
          {quote}
        </p>
      </div>

      <style jsx>{`
        .loading-cat {
          animation: lc-sway 1.8s ease-in-out infinite;
          transform-origin: 50% 90%;
          filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.18));
        }
        .loading-cat :global(img) {
          animation: lc-blink 4s steps(1, end) infinite;
          image-rendering: pixelated;
        }
        .loading-cat-quote {
          animation: lc-fade 0.4s ease-out;
        }
        @keyframes lc-sway {
          0%,
          100% {
            transform: rotate(-2deg) translateY(0);
          }
          50% {
            transform: rotate(2deg) translateY(-2px);
          }
        }
        @keyframes lc-blink {
          0%,
          92%,
          100% {
            filter: none;
          }
          93%,
          96% {
            filter: brightness(0.85) contrast(1.05);
          }
        }
        @keyframes lc-fade {
          from {
            opacity: 0;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-cat,
          .loading-cat :global(img),
          .loading-cat-quote {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
