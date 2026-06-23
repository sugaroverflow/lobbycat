"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import quotes from "@/db/lobbycat-quotes.json";
import { getSurpriseAction } from "@/app/actions-surprise";
import type { SurprisePick, SurpriseVariant } from "@/lib/surprise";

type Quotes = { surprisePreamble: string[] };

const MAX_PICKS_PER_SESSION = 3;

/**
 * Surprise modal — vaporwave-theatre reskin (§4.1, step 10 of REFACTOR-v0.7).
 *
 * The modal is a "moment" surface: void-purple backdrop, sunset-gradient
 * headline, scanlines, perspective grid hint at the bottom, neon-bordered
 * pick card with skew→un-skew hover, animated pixel cat during picking.
 *
 * Functionally identical to v0.6:
 * - Up to 3 picks per session (session = while modal is open).
 * - Each pick: surprisePreamble quote + server "why" + link to company.
 * - Variants cycle Adjacency → Recency → Underrated.
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

  useEffect(() => {
    if (open && !requestedRef.current) {
      requestedRef.current = true;
      drawNext();
    } else if (!open && requestedRef.current) {
      requestedRef.current = false;
    }
  }, [open, drawNext]);

  const handleClose = useCallback(() => {
    setPicks([]);
    setPreambles([]);
    setError(null);
    setExhausted(false);
    onClose();
  }, [onClose]);

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
  const showLoadingCat = pending;

  return (
    <div
      className="vw-theatre fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Surprise me"
      onClick={handleClose}
      style={{
        background:
          "radial-gradient(ellipse at center 30%, rgba(255,51,204,0.30), transparent 65%), linear-gradient(180deg, rgba(9,0,20,0.92) 0%, rgba(26,8,64,0.92) 60%, rgba(255,51,153,0.55) 100%)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {/* Scanlines overlay (theatre signature) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "multiply",
          opacity: 0.45,
        }}
      />

      {/* Perspective grid floor at the bottom edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 vw-grid-floor"
        style={{
          height: "40%",
          backgroundImage:
            "linear-gradient(0deg, rgba(0,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,255,0.55) 1px, transparent 1px)",
          backgroundSize: "60px 60px, 60px 60px",
          backgroundPosition: "center bottom",
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 55%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 55%, black 100%)",
          transform: "perspective(700px) rotateX(62deg)",
          transformOrigin: "center bottom",
          opacity: 0.7,
        }}
      />

      <div
        className="relative max-w-lg w-full p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(9,0,20,0.78)",
          border: "1px solid rgba(255,0,255,0.55)",
          borderTopColor: "rgba(0,255,255,0.7)",
          boxShadow:
            "0 0 24px rgba(0,255,255,0.18), inset 0 0 18px rgba(255,0,255,0.12)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="font-sans uppercase tracking-[0.18em] text-xl sm:text-2xl"
            style={{
              background: "var(--vw-sunset-gradient)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 0 12px rgba(255,0,255,0.45))",
            }}
          >
            ▸ Surprise
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="mono text-[10px] uppercase tracking-[0.18em] transition"
            style={{ color: "rgba(0,255,255,0.85)" }}
            aria-label="Close surprise"
          >
            [ esc ]
          </button>
        </div>

        {showLoadingCat ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="vw-cat">
              <Image
                src="/cat/lobbycat.png"
                alt=""
                width={96}
                height={96}
                className="block"
                priority
              />
            </div>
            <p
              className="mt-4 serif italic text-base"
              style={{
                color: "#FFEEFF",
                textShadow: "0 0 8px rgba(255,0,255,0.45)",
              }}
            >
              {picks.length === 0 ? "the cat is pawing through…" : "another pick coming…"}
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            className="serif italic mb-4"
            style={{ color: "#FF9900", textShadow: "0 0 6px rgba(255,153,0,0.35)" }}
          >
            {error}
          </p>
        ) : null}

        {latest && !showLoadingCat ? (
          <div>
            {preamble ? (
              <p
                className="serif italic mb-5 text-base sm:text-lg"
                style={{
                  color: "#FFEEFF",
                  textShadow: "0 0 8px rgba(255,0,255,0.35)",
                }}
              >
                “{preamble}”
              </p>
            ) : null}
            <Link
              href={`/companies/${latest.company.slug}`}
              onClick={handleClose}
              className="vw-pick block p-4 transition"
              style={{
                background: "rgba(9,0,20,0.55)",
                border: "1px solid rgba(0,255,255,0.45)",
              }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span
                  className="font-sans uppercase tracking-[0.1em] text-lg"
                  style={{
                    color: "#FFEEFF",
                    textShadow: "0 0 8px rgba(255,0,255,0.45)",
                  }}
                >
                  {latest.company.name}
                </span>
                <span
                  className="mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "#FF9900", textShadow: "0 0 6px rgba(255,153,0,0.35)" }}
                >
                  {latest.variant}
                </span>
              </div>
              {latest.company.hq ? (
                <div
                  className="mono text-[11px] uppercase tracking-[0.12em] mb-2"
                  style={{ color: "rgba(0,255,255,0.85)" }}
                >
                  {latest.company.hq}
                </div>
              ) : null}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255,238,255,0.92)" }}
              >
                {latest.line}
              </p>
              {latest.frame ? (
                <div
                  className="mono text-[10px] uppercase tracking-[0.18em] mt-3"
                  style={{ color: "rgba(255,0,255,0.75)" }}
                >
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
          <span
            className="mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "rgba(0,255,255,0.7)" }}
          >
            {picks.length}/{MAX_PICKS_PER_SESSION} picks
          </span>
          {canShowAnother && latest && !showLoadingCat ? (
            <button
              type="button"
              onClick={drawNext}
              disabled={pending}
              className="mono text-xs uppercase tracking-[0.18em] px-4 py-2 transition disabled:opacity-50"
              style={{
                color: "#FFEEFF",
                background: "rgba(255,0,255,0.12)",
                border: "1px solid rgba(255,0,255,0.65)",
                textShadow: "0 0 6px rgba(255,0,255,0.55)",
                boxShadow: "0 0 12px rgba(255,0,255,0.25)",
              }}
            >
              {pending ? "Pawing…" : "▸ Show me another"}
            </button>
          ) : !canShowAnother && latest ? (
            <span
              className="mono text-[10px] uppercase tracking-[0.18em] italic"
              style={{ color: "rgba(255,153,0,0.85)" }}
            >
              the cat is tired.
            </span>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .vw-cat {
          animation: vw-cat-float 2.4s ease-in-out infinite;
          filter: drop-shadow(0 0 18px rgba(255, 0, 255, 0.55))
            drop-shadow(0 0 6px rgba(0, 255, 255, 0.35));
        }
        .vw-cat :global(img) {
          image-rendering: pixelated;
        }
        .vw-grid-floor {
          animation: vw-grid-scroll 5s linear infinite;
        }
        .vw-pick {
          transform: skewX(-2deg);
          transition: transform 200ms ease, box-shadow 200ms ease,
            border-color 200ms ease, background 200ms ease;
        }
        .vw-pick:hover,
        .vw-pick:focus-visible {
          transform: skewX(0deg) translateY(-1px);
          border-color: rgba(0, 255, 255, 0.9);
          box-shadow: 0 0 18px rgba(0, 255, 255, 0.35),
            0 0 32px rgba(255, 0, 255, 0.25);
          background: rgba(20, 5, 45, 0.7);
        }
        @keyframes vw-cat-float {
          0%,
          100% {
            transform: translateY(0) rotate(-1.5deg);
          }
          50% {
            transform: translateY(-8px) rotate(1.5deg);
          }
        }
        @keyframes vw-grid-scroll {
          0% {
            background-position: 0 0, 0 0;
          }
          100% {
            background-position: 0 60px, 0 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vw-cat,
          .vw-grid-floor {
            animation: none;
          }
          .vw-pick {
            transform: none;
          }
        }
      `}</style>
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
