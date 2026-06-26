"use client";

/**
 * v0.8 step 6 — "talk to lobbycat" launcher.
 *
 * Two surfaces share this one component:
 *
 *   1. **Global pill** (default, no seed): persistent bottom-right
 *      sunset-gradient pixel-cat pill, visible on every page via
 *      `SiteShell`. Replaces the v0.7.2 `AskLobbycatStub` header pill —
 *      the stub graduates to a real button, per REFACTOR-v0.8.md §10 / 6.
 *
 *   2. **Scoped link** (`variant="link"`, with a seed company): the small
 *      "clarify this company →" affordance the fit-note panel renders
 *      under each company's fit-note. Opens the same panel pre-scoped.
 *
 * Both variants own the `<ClarifyPanel/>` mount + open state. They wire
 * the panel's `onProposalAccepted` / `onProposalRejected` callbacks to
 * the Step 6 server actions (`applyClarifyProposal` /
 * `rejectClarifyProposal`) and `router.refresh()` so the user's data
 * surface picks up the change immediately.
 *
 * Mobile: the global pill stays visible and remains tappable; the panel
 * itself goes full-screen when open (handled inside `ClarifyPanel`).
 */

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { ClarifyPanel } from "@/components/clarify-panel";
import {
  applyClarifyProposal,
  rejectClarifyProposal,
} from "@/app/actions";
import type {
  ClarifyProposal,
  ClarifyTrigger,
} from "@/lib/clarify/run-session";

export type ClarifyLauncherProps = {
  /** Visual variant. `pill` is the persistent bottom-right global
   *  affordance; `link` is the small inline affordance the fit-note
   *  panel renders. Defaults to `pill`. */
  variant?: "pill" | "link";
  /** Trigger to record on the session row. Defaults to `manual`. */
  trigger?: ClarifyTrigger;
  /** Optional company id to seed the session against. */
  seedCompanyId?: number | null;
  /** Optional frame id (rare; only when the cat opens on a frame). */
  seedFrameId?: number | null;
  /** Optional "we're talking about X" subtitle for the panel header. */
  seedLine?: string | null;
  /** Custom label override. */
  label?: string;
};

export function ClarifyLauncher({
  variant = "pill",
  trigger = "manual",
  seedCompanyId = null,
  seedFrameId = null,
  seedLine = null,
  label,
}: ClarifyLauncherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [, startApply] = useTransition();

  function handleAccepted(sessionId: number, proposal: ClarifyProposal) {
    startApply(async () => {
      try {
        await applyClarifyProposal({ sessionId, proposal });
        router.refresh();
      } catch (err) {
        // The panel already shows the optimistic "accepted" state. If
        // the write fails we still refresh so any partial change is
        // visible; the user can re-open and retry. Inline error
        // surfacing is a future polish — logged as ASSUMPTIONS A6.2.
        console.error("applyClarifyProposal failed", err);
        router.refresh();
      }
    });
  }

  function handleRejected(sessionId: number) {
    startApply(async () => {
      try {
        await rejectClarifyProposal(sessionId);
      } catch (err) {
        console.error("rejectClarifyProposal failed", err);
      }
    });
  }

  return (
    <>
      {variant === "pill" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Talk to lobbycat"
          className="clarify-launcher-pill fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full px-3.5 py-2 mono text-[11px] uppercase tracking-[0.12em] text-ink shadow-[0_0_14px_rgba(255,140,90,0.4)] hover:shadow-[0_0_20px_rgba(255,140,90,0.6)] transition-shadow"
        >
          <span className="clarify-launcher-sprite shrink-0">
            <Image
              src="/cat/lobbycat.png"
              alt=""
              width={22}
              height={22}
              className="block"
              priority={false}
            />
          </span>
          <span>{label ?? "talk to lobbycat"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink transition inline-flex items-center gap-1"
        >
          <span aria-hidden>🐱</span>
          <span>{label ?? "clarify this company →"}</span>
        </button>
      )}

      <ClarifyPanel
        open={open}
        trigger={trigger}
        seedCompanyId={seedCompanyId}
        seedFrameId={seedFrameId}
        seedLine={seedLine}
        onClose={() => setOpen(false)}
        onProposalAccepted={handleAccepted}
        onProposalRejected={handleRejected}
      />

      <style jsx>{`
        .clarify-launcher-pill {
          background: linear-gradient(
            135deg,
            #ffb066 0%,
            #ff6f91 45%,
            #b86bff 100%
          );
          border: 1px solid rgba(255, 200, 150, 0.55);
          color: #1a0f1f;
        }
        .clarify-launcher-pill :global(span) {
          color: #1a0f1f;
        }
        .clarify-launcher-pill:focus-visible {
          outline: 2px solid #ffd29a;
          outline-offset: 2px;
        }
        .clarify-launcher-sprite :global(img) {
          image-rendering: pixelated;
          animation: clarify-launcher-sway 2.4s ease-in-out infinite;
          transform-origin: 50% 90%;
        }
        @keyframes clarify-launcher-sway {
          0%,
          100% {
            transform: rotate(-2deg) translateY(0);
          }
          50% {
            transform: rotate(2deg) translateY(-1px);
          }
        }
      `}</style>
    </>
  );
}
