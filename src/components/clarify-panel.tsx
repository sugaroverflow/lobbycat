"use client";

/**
 * v0.8 Step 5 — Clarify chat panel.
 *
 * Right-side sliding panel on desktop, full-screen takeover on mobile.
 * The user types, the cat replies, and the session ends either when the
 * cat ships an end-of-session proposal (which renders as an accept/
 * reject card) or when the user closes the panel mid-flow (which
 * marks the session closed without a proposal — §4.3 of REFACTOR-v0.8).
 *
 * Wires to the three Step 4 server actions in src/app/actions.ts:
 *   - startClarifySession()
 *   - sendClarifyMessage()
 *   - endClarifySessionAsClosed()
 *
 * Step 10 will layer in the clarifying[] quote rotation during waits
 * longer than 2s. This component leaves the seam (showing a static "..."
 * marker while waiting) but doesn't depend on it.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import {
  endClarifySessionAsClosed,
  sendClarifyMessage,
  startClarifySession,
} from "@/app/actions";
import { CatMark } from "@/components/wordmark";
import { ClarifyingLine } from "@/components/clarifying-line";
import type {
  ClarifyProposal,
  ClarifyTrigger,
} from "@/lib/clarify/run-session";

type Message = {
  role: "user" | "cat";
  body: string;
};

export function ClarifyPanel({
  open,
  trigger,
  seedCompanyId = null,
  seedFrameId = null,
  seedLine = null,
  onClose,
  onProposalAccepted,
  onProposalRejected,
}: {
  open: boolean;
  trigger: ClarifyTrigger;
  seedCompanyId?: number | null;
  seedFrameId?: number | null;
  /** Optional human-readable "we're talking about X" header subtitle. */
  seedLine?: string | null;
  onClose: () => void;
  /** Called after the user accepts the cat's proposal so the parent can
   *  apply it (v0.8 step 6's onProposalAccepted handler does the DB
   *  write) and refresh whatever surface they're sitting on. Receives
   *  the session id so the apply call can target the right row. */
  onProposalAccepted?: (sessionId: number, proposal: ClarifyProposal) => void;
  /** Called after the user rejects the proposal so the parent can
   *  stamp the session row + close the surface. v0.8 step 6. */
  onProposalRejected?: (sessionId: number, proposal: ClarifyProposal) => void;
}) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposal, setProposal] = useState<ClarifyProposal | null>(null);
  const [ended, setEnded] = useState(false);
  const [proposalDecided, setProposalDecided] = useState<
    "accepted" | "rejected" | null
  >(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [thinking, startThinking] = useTransition();
  const [opening, startOpening] = useTransition();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Open the session as soon as the panel is shown. The trigger / seed
  // are baked in at mount time; if you need to scope to a different
  // company, close + reopen.
  useEffect(() => {
    if (!open) return;
    if (sessionId !== null) return;

    startOpening(async () => {
      // Clear any prior error inside the transition body so the React 19
      // `set-state-in-effect` rule stays happy.
      setError(null);
      try {
        const result = await startClarifySession({
          trigger,
          seedCompanyId,
          seedFrameId,
        });
        setSessionId(result.sessionId);
        setMessages([{ role: "cat", body: result.opening.body }]);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "the cat couldn't open the session. try again?",
        );
      }
    });
    // We deliberately don't depend on the seed fields — they're frozen
    // at the moment the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Autoscroll on new messages or when thinking starts.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, thinking]);

  function handleSend() {
    if (sessionId === null) return;
    const content = input.trim();
    if (!content || ended) return;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", body: content }]);
    startThinking(async () => {
      try {
        const result = await sendClarifyMessage({ sessionId, content });
        setMessages((prev) => [
          ...prev,
          { role: "cat", body: result.reply.body },
        ]);
        if (result.ended) {
          setEnded(true);
          setProposal(result.proposal);
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "the cat hit a snag. give it a sec and try again?",
        );
        // Roll back the optimistic user-turn add so they can edit + resend.
        setMessages((prev) =>
          prev.length > 0 && prev[prev.length - 1].role === "user"
            ? prev.slice(0, -1)
            : prev,
        );
        setInput(content);
      }
    });
  }

  function handleClose() {
    // If the session is still open and we have a row, mark it closed
    // server-side so the next entry-point click starts a fresh one
    // (§4.3 — no save-as-draft).
    if (sessionId !== null && !ended) {
      void endClarifySessionAsClosed(sessionId);
    }
    // Reset local state so a re-open starts clean.
    setSessionId(null);
    setMessages([]);
    setProposal(null);
    setEnded(false);
    setProposalDecided(null);
    setInput("");
    setError(null);
    onClose();
  }

  function acceptProposal() {
    if (!proposal || sessionId === null) return;
    setProposalDecided("accepted");
    onProposalAccepted?.(sessionId, proposal);
    // The Step 4 server action already persisted the proposal payload
    // on the session row. The *application* of that payload to the
    // user's frames/companies is handled by the parent's
    // `onProposalAccepted` (v0.8 step 6's clarify-launcher calls
    // `applyClarifyProposal` here). The panel stays focused on the
    // surface; the data write is the launcher's responsibility.
  }

  function rejectProposal() {
    if (!proposal || sessionId === null) return;
    setProposalDecided("rejected");
    onProposalRejected?.(sessionId, proposal);
  }

  if (!open) return null;

  return (
    <>
      {/* backdrop — desktop only; mobile uses full-screen panel */}
      <div
        className="fixed inset-0 z-40 bg-black/40 hidden md:block"
        onClick={handleClose}
        aria-hidden
      />

      {/* panel */}
      <aside
        role="dialog"
        aria-label="Clarify session with lobbycat"
        className="fixed z-50 right-0 top-0 h-full w-full md:w-[28rem] flex flex-col"
        style={{
          background: "var(--card-interior-bg)",
          color: "var(--card-interior-text)",
          borderLeft: "1px solid var(--readout-cyan)",
        }}
      >
        <header
          className="px-5 py-4 flex items-start justify-between gap-3 shrink-0"
          style={{ borderBottom: "1px solid var(--card-interior-rule)" }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <CatMark size={28} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="mono text-[10px] uppercase tracking-[0.16em] text-whisper">
                clarify
              </div>
              <div className="font-sans text-lg text-ink leading-tight mt-0.5">
                lobbycat is here
              </div>
              {seedLine && (
                <div className="mono text-xs text-muted mt-1.5">
                  {seedLine}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="mono text-xs uppercase tracking-[0.14em] text-whisper hover:text-ink shrink-0"
            aria-label="Close clarify panel"
          >
            close ✕
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {opening && messages.length === 0 && <ClarifyingLine />}
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} body={m.body} />
          ))}
          {thinking && <ClarifyingLine />}
          {error && (
            <p className="font-sans text-sm text-coral">{error}</p>
          )}
          {ended && proposal && (
            <ProposalCard
              proposal={proposal}
              decided={proposalDecided}
              onAccept={acceptProposal}
              onReject={rejectProposal}
            />
          )}
          {ended && !proposal && (
            <p className="font-sans text-sm text-muted italic mt-2">
              <em>thread left open.</em>
            </p>
          )}
        </div>

        <footer
          className="shrink-0 px-5 py-4"
          style={{ borderTop: "1px solid var(--card-interior-rule)" }}
        >
          {ended ? (
            <button
              type="button"
              onClick={handleClose}
              className="mono text-xs uppercase tracking-[0.14em] px-4 py-2 rounded-sm w-full"
              style={{
                color: "var(--readout-cyan)",
                border: "1px solid var(--readout-cyan)",
                background: "rgb(0 255 255 / 0.04)",
              }}
            >
              done
            </button>
          ) : (
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={
                thinking || opening || sessionId === null || ended
              }
            />
          )}
        </footer>
      </aside>
    </>
  );
}

function MessageBubble({ role, body }: { role: "user" | "cat"; body: string }) {
  if (role === "cat") {
    return (
      <div className="font-sans text-base text-ink leading-relaxed whitespace-pre-wrap max-w-[34ch] cat-message-fade-in">
        {body}
        <style jsx>{`
          .cat-message-fade-in {
            animation: cat-msg-fade 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @keyframes cat-msg-fade {
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
            .cat-message-fade-in {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div
        className="mono text-sm leading-relaxed whitespace-pre-wrap max-w-[28ch] px-3 py-2 rounded-sm"
        style={{
          background: "var(--card-interior-bg-sunk)",
          color: "var(--card-interior-text)",
          border: "1px solid var(--card-interior-rule)",
        }}
      >
        {body}
      </div>
    </div>
  );
}

function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Autosize the textarea up to a cap.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="say something to the cat…"
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-bg border border-rule rounded-sm px-3 py-2 font-sans text-base text-ink focus:outline-none focus:border-readout placeholder:text-whisper disabled:opacity-50"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || value.trim().length === 0}
        className="mono text-xs uppercase tracking-[0.14em] px-4 py-2 rounded-sm shrink-0"
        style={{
          color: "var(--readout-cyan)",
          border: "1px solid var(--readout-cyan)",
          background: "rgb(0 255 255 / 0.04)",
        }}
      >
        send
      </button>
    </div>
  );
}

function ProposalCard({
  proposal,
  decided,
  onAccept,
  onReject,
}: {
  proposal: ClarifyProposal;
  decided: "accepted" | "rejected" | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div
      className="mt-4 rounded-sm p-4"
      style={{
        background: "var(--card-interior-bg-sunk)",
        border: "1px solid var(--readout-cyan)",
      }}
    >
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-readout mb-2">
        the cat proposes — {labelForKind(proposal.kind)}
      </div>
      <p className="font-sans text-base text-ink leading-snug">
        {proposal.summary}
      </p>
      {decided === null ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 mono text-xs uppercase tracking-[0.14em] px-4 py-2 rounded-sm"
            style={{
              color: "var(--bg-canvas)",
              background: "var(--readout-cyan)",
            }}
          >
            do it
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex-1 mono text-xs uppercase tracking-[0.14em] px-4 py-2 rounded-sm"
            style={{
              color: "var(--card-interior-text)",
              border: "1px solid var(--card-interior-rule)",
            }}
          >
            not yet
          </button>
        </div>
      ) : (
        <p className="mt-3 mono text-xs text-whisper italic">
          <em>{decided === "accepted" ? "accepted" : "left for now"}</em>
        </p>
      )}
    </div>
  );
}

function labelForKind(kind: ClarifyProposal["kind"]): string {
  switch (kind) {
    case "frame-weight":
      return "frame weight";
    case "new-frame":
      return "new frame";
    case "company-note":
      return "company note";
    default:
      return "change";
  }
}
