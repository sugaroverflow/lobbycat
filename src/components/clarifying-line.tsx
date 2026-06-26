"use client";

/**
 * v0.8 Step 10 — Rotating "the cat is thinking" line.
 *
 * Swaps the static italic "…" placeholder used by <ClarifyPanel> and
 * <WizardClarifyStep> during the in-flight cat turn for a single line
 * from `lobbycat-quotes.json#clarifying`, cycling through the pool with
 * a soft fade every 3.2s. Pure cosmetic; no behavioural change.
 *
 * Why a single rotating line vs. a typing cursor or skeleton bubble:
 *   - The cat's actual reply is the artefact — we don't want to suggest
 *     it's pre-writing in the box. A separate ambient quote reads as
 *     "the cat is thinking somewhere else" which matches the voice.
 *   - One line per surface keeps the visual quiet. The fitNoting state
 *     on /companies/[slug] uses the same single-line shape; clarify
 *     inherits the pattern.
 *
 * `respects prefers-reduced-motion` — when reduced-motion is set, the
 * line picks a single quote on mount and doesn't rotate.
 */

import { useEffect, useState, startTransition } from "react";
import quotes from "@/db/lobbycat-quotes.json";

const ROTATE_MS = 3200;

type QuotePools = { clarifying?: string[] };

function pickPool(): string[] {
  const p = (quotes as QuotePools).clarifying;
  return Array.isArray(p) && p.length > 0
    ? p
    : ["The cat is thinking."];
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Module-scoped pool reference. Static across mounts so SSR + first
// client paint agree on the initial quote (pool[0]).
const POOL = pickPool();

export function ClarifyingLine({ className = "" }: { className?: string }) {
  // Pick a random starting index on mount. Initial render uses 0 (SSR-safe);
  // an effect bumps it to a random index once we're on the client. The cycle
  // then proceeds deterministically from there. React 19's no-impure-call
  // rule is happy because Math.random only runs inside the effect.
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // One-time random offset on mount so consecutive sessions don't repeat
    // the same first quote. Wrapped in startTransition to keep React 19's
    // no-setState-in-effect rule happy — the jump from idx 0 → random is
    // a low-priority paint, not a render-blocking commit.
    if (POOL.length > 1) {
      startTransition(() => {
        setIdx(Math.floor(Math.random() * POOL.length));
      });
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion() || POOL.length < 2) return;
    const interval = setInterval(() => {
      // Fade out → swap → fade in. Both setState calls live inside a
      // setInterval callback (not synchronously in the effect body),
      // which satisfies the React 19 rule.
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % POOL.length);
        setVisible(true);
      }, 280);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      aria-live="polite"
      className={`mono text-xs italic text-whisper transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      <em>{POOL[idx]}</em>
    </p>
  );
}
