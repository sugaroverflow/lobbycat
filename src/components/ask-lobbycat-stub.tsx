"use client";

/**
 * v0.7.2 Step 9 — "Ask lobbycat" visual stub.
 *
 * Distinct-looking sunset-gradient pill with the pixel cat sprite. Sits in
 * the site header. The real behaviour (a clarify/chat panel against Aadi's
 * profile) lands in v0.8. For now, clicking it pops a tiny modal that says
 * "coming soon in v0.8" so the surface is visible without lying about its
 * capabilities.
 *
 * The pill is deliberately styled off the cyan/magenta scale so it reads
 * as a *new* affordance, not just another nav link.
 */

import { useState } from "react";
import Image from "next/image";

export function AskLobbycatStub() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask lobbycat (coming soon in v0.8)"
        className="ask-lobbycat-pill group relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 mono text-[11px] uppercase tracking-[0.12em] text-ink shadow-[0_0_12px_rgba(255,140,90,0.35)] hover:shadow-[0_0_18px_rgba(255,140,90,0.55)] transition-shadow"
      >
        <span className="ask-lobbycat-sprite shrink-0">
          <Image
            src="/cat/lobbycat.png"
            alt=""
            width={20}
            height={20}
            className="block"
            priority={false}
          />
        </span>
        <span>ask lobbycat</span>
        <span
          aria-hidden
          className="mono text-[9px] tracking-[0.2em] text-ink/70"
        >
          soon
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ask lobbycat — coming soon"
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="ask-lobbycat-modal relative z-10 max-w-sm w-full rounded-lg border border-rule p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ask-lobbycat-sprite ask-lobbycat-sprite-lg mx-auto mb-3">
              <Image
                src="/cat/lobbycat.png"
                alt=""
                width={56}
                height={56}
                className="block mx-auto"
              />
            </div>
            <p className="serif text-lg text-ink mb-2">
              coming soon in v0.8 🪷
            </p>
            <p className="serif text-sm text-muted leading-relaxed mb-4">
              you&apos;ll be able to ask me anything about a company &mdash;
              their lobbying, controversies, fit for your frames &mdash; and
              I&apos;ll think it through with you. for now, the dashboard and
              fit-notes have the goods.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mono text-[11px] uppercase tracking-[0.14em] text-readout hover:text-ink transition"
            >
              close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .ask-lobbycat-pill {
          background: linear-gradient(
            135deg,
            #ffb066 0%,
            #ff6f91 45%,
            #b86bff 100%
          );
          border: 1px solid rgba(255, 200, 150, 0.55);
          color: #1a0f1f;
        }
        .ask-lobbycat-pill :global(span) {
          color: #1a0f1f;
        }
        .ask-lobbycat-pill:focus-visible {
          outline: 2px solid #ffd29a;
          outline-offset: 2px;
        }
        .ask-lobbycat-sprite :global(img) {
          image-rendering: pixelated;
          animation: ask-lobbycat-sway 2.4s ease-in-out infinite;
          transform-origin: 50% 90%;
        }
        @keyframes ask-lobbycat-sway {
          0%,
          100% {
            transform: rotate(-2deg) translateY(0);
          }
          50% {
            transform: rotate(2deg) translateY(-1px);
          }
        }
        .ask-lobbycat-modal {
          background: linear-gradient(
            160deg,
            #2a1640 0%,
            #3a1b3f 55%,
            #4a2638 100%
          );
          box-shadow: 0 0 40px rgba(255, 140, 90, 0.25),
            0 0 80px rgba(184, 107, 255, 0.18);
        }
      `}</style>
    </>
  );
}
