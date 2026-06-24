"use client";

/**
 * Shared error-boundary UI for the Next App Router error.tsx files
 * (reliability/error-boundaries — v0.7.1 Track B).
 *
 * Used by:
 *   - src/app/error.tsx               (fallback for /)
 *   - src/app/<route>/error.tsx       (per-route fallbacks)
 *   - src/app/global-error.tsx wraps a slim variant inline (it needs
 *     <html><body> per Next docs and must not import root layout/css
 *     conditionally, but we keep the look as close as we can).
 *
 * The component intentionally has no app-data dependencies (no DB, no
 * queries, no shared layout chrome): if a server render throws upstream,
 * we want this to render no matter what.
 *
 * Voice: calm-cousin Vaporwave. Quote lines are hardcoded here on purpose
 * (separate change to add a "shrugged" category to lobbycat-quotes.json).
 */

import { useEffect } from "react";
import Image from "next/image";

const CAT_SHRUGGED_LINES = [
  "The cat is mortified. One moment.",
  "The cat is re-reading the manual.",
  "The cat shrugged. The cat would like another go at this.",
  "The cat blinked. The page blinked back.",
  "The cat has dropped a thread. The cat is finding it.",
] as const;

function pickLine(seed: string | undefined): string {
  if (!seed) {
    return CAT_SHRUGGED_LINES[
      Math.floor(Math.random() * CAT_SHRUGGED_LINES.length)
    ];
  }
  // Stable line per digest so repeated refreshes feel coherent.
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % CAT_SHRUGGED_LINES.length;
  return CAT_SHRUGGED_LINES[idx];
}

export type ErrorShellProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Optional override for the headline (per-route flavour). */
  headline?: string;
};

export function ErrorShell({ error, reset, headline }: ErrorShellProps) {
  // Surface to the browser console so dev tools still get something useful
  // even though we hide the stack from the user.
  useEffect(() => {
    console.error("[lobbycat] route error boundary caught:", error);
  }, [error]);

  const subline = pickLine(error.digest);

  return (
    <main
      role="alert"
      aria-live="polite"
      className="min-h-[80vh] flex items-center justify-center px-6 py-16"
      style={{ backgroundColor: "var(--bg-canvas, #090014)" }}
    >
      <div
        className="w-full max-w-md text-center"
        style={{
          backgroundColor: "var(--bg-panel, #1a103c)",
          border: "1px solid var(--accent-action, #FF00FF)",
          boxShadow: "0 0 24px rgba(255, 0, 255, 0.18)",
          padding: "2rem 1.75rem",
        }}
      >
        <div className="flex justify-center mb-5">
          <Image
            src="/cat/lobbycat.png"
            alt="lobbycat — pixel cat sprite, shrugging"
            width={96}
            height={96}
            priority
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        <h1
          className="text-2xl font-sans tracking-wide mb-3"
          style={{ color: "var(--readout-cyan, #00FFFF)" }}
        >
          {headline ?? "The cat shrugged."}
        </h1>

        <p
          className="font-mono text-sm mb-6"
          style={{ color: "var(--fg-prose-soft, rgba(224,224,224,0.8))" }}
        >
          ~ {subline} ~
          <br />
          <span style={{ color: "var(--fg-prose-muted, rgba(224,224,224,0.6))" }}>
            Refresh the page, or come back in a minute.
          </span>
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="inline-block font-mono uppercase tracking-widest text-sm cursor-pointer"
          style={{
            backgroundColor: "var(--accent-action, #FF00FF)",
            color: "var(--bg-canvas, #090014)",
            border: "1px solid var(--accent-action, #FF00FF)",
            padding: "0.6rem 1.4rem",
          }}
        >
          try again
        </button>

        {error.digest ? (
          <p
            className="mt-6 font-mono text-xs"
            style={{ color: "var(--fg-prose-muted, rgba(224,224,224,0.5))" }}
          >
            error code:{" "}
            <code
              style={{
                backgroundColor: "var(--bg-panel-sunk, #120932)",
                padding: "0.1rem 0.4rem",
                userSelect: "all",
              }}
            >
              {error.digest}
            </code>
          </p>
        ) : null}
      </div>
    </main>
  );
}
