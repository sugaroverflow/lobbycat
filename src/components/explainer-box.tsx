"use client";

/**
 * v0.7.2 Step 4 — reusable explainer panel.
 *
 * One-line cat-voice explanation of "what you can do here", with the pixel
 * cat sprite next to it. Dismissible per-page; the dismissal is remembered
 * via a cookie keyed by the `id` prop so the user only sees each explainer
 * once. Re-takes of the setup wipe these cookies (see §5 of REFACTOR-v0.7.2
 * and the existing re-take-setup flow on /about).
 *
 * Usage:
 *   <ExplainerBox
 *     id="frames"
 *     body="here you can adjust the frames that you care about! come back to add more or adjust them as your thinking changes."
 *   />
 *
 * Mount near the top of a page. The component renders nothing on first SSR
 * paint (cookie not readable server-side) so there's no flash for users who
 * have already dismissed.
 */

import { useSyncExternalStore } from "react";
import Image from "next/image";

const COOKIE_PREFIX = "lc_explainer_";
const COOKIE_MAX_AGE_DAYS = 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

// Tiny in-memory pub/sub so `useSyncExternalStore` can react to cookie
// writes made by sibling ExplainerBoxes (or by tests) without polling.
const cookieListeners = new Set<() => void>();
function subscribeToCookie(cb: () => void) {
  cookieListeners.add(cb);
  return () => {
    cookieListeners.delete(cb);
  };
}
function notifyCookieListeners() {
  for (const cb of cookieListeners) cb();
}

export function ExplainerBox({
  id,
  body,
  className = "",
}: {
  id: string;
  body: string;
  className?: string;
}) {
  // v0.7.2: read the dismissal cookie via `useSyncExternalStore` so the
  // first SSR paint hides the box (server can't read document.cookie) and
  // the first client paint flips to visible only if the cookie says so.
  // This sidesteps the React 19 "don't setState in effects" rule that
  // tripped onboarding-overlay.tsx.
  const dismissed = useSyncExternalStore(
    subscribeToCookie,
    () => readCookie(`${COOKIE_PREFIX}${id}`) === "1",
    // Server snapshot: hide the box on SSR; client decides on first paint.
    () => true,
  );

  if (dismissed) return null;

  return (
    <aside
      aria-label="Lobbycat explainer"
      className={`flex items-start gap-4 rounded-md border border-rule bg-sage-soft/30 px-4 py-3 ${className}`}
    >
      <div className="explainer-cat-sprite shrink-0">
        <Image
          src="/cat/lobbycat.png"
          alt=""
          width={40}
          height={40}
          className="block"
          priority={false}
        />
      </div>
      <p className="serif text-sm text-ink leading-relaxed flex-1 self-center max-w-2xl">
        {body}
      </p>
      <button
        type="button"
        onClick={() => {
          writeCookie(`${COOKIE_PREFIX}${id}`, "1");
          // Notify any other ExplainerBox subscribers; useSyncExternalStore
          // will re-snapshot and hide this one.
          notifyCookieListeners();
        }}
        className="shrink-0 self-start mono text-[10px] uppercase tracking-[0.12em] text-whisper hover:text-ink"
        aria-label="Dismiss explainer"
      >
        dismiss
      </button>

      <style jsx>{`
        .explainer-cat-sprite {
          animation: explainer-cat-sway 2.2s ease-in-out infinite;
          transform-origin: 50% 90%;
        }
        .explainer-cat-sprite :global(img) {
          animation: explainer-cat-blink 5s steps(1, end) infinite;
          image-rendering: pixelated;
        }
        @keyframes explainer-cat-sway {
          0%,
          100% {
            transform: rotate(-1.5deg) translateY(0);
          }
          50% {
            transform: rotate(1.5deg) translateY(-1px);
          }
        }
        @keyframes explainer-cat-blink {
          0%,
          93%,
          100% {
            filter: none;
          }
          94%,
          97% {
            filter: brightness(0.85) contrast(1.05);
          }
        }
      `}</style>
    </aside>
  );
}
