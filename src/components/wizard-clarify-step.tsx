"use client";

/**
 * v0.8 Step 7 — Wizard step 5 → seeded clarify session.
 *
 * Replaces the v0.7 open-text textarea ("what's making this decision
 * hard?") with an inline 3-question session with the cat. The server
 * action's `wizard` trigger already biases the system prompt to a
 * 3-question seeded opener (see src/lib/clarify/run-session.ts L529).
 *
 * Differs from <ClarifyPanel>:
 *   - Embedded inline inside the wizard's StepCard, not a side panel.
 *   - Smaller, calmer footprint (the wizard already owns the chrome).
 *   - No "close" affordance — the wizard's Back / Next buttons own
 *     navigation.
 *   - Proposal card is **suppressed** during wizard sessions (A7.4):
 *     the user hasn't scored anyone yet, so the cat's "bump this
 *     frame" / "add a note" proposals would be premature. The
 *     transcript still saves; the proposal payload (if any) lives on
 *     the session row but isn't applied.
 *   - Always offers a "skip & score it →" affordance so the user can
 *     bypass the chat without breaking the onboarding flow.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import {
  endClarifySessionAsClosed,
  sendClarifyMessage,
  startClarifySession,
} from "@/app/actions";
import { CatMark } from "@/components/wordmark";

type Message = {
  role: "user" | "cat";
  body: string;
};

export function WizardClarifyStep({
  displayName,
}: {
  /** First-name used for a one-off in-step greeting before the cat takes
   *  over. The cat herself never uses the name (per voice.md). */
  displayName: string | null | undefined;
}) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ended, setEnded] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [thinking, startThinking] = useTransition();
  const [opening, startOpening] = useTransition();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const startedOnce = useRef(false);

  // Open the session once on mount. The wizard step lives until the
  // user clicks Next or Back; we never re-open inside this lifecycle.
  useEffect(() => {
    if (startedOnce.current) return;
    startedOnce.current = true;
    startOpening(async () => {
      setError(null);
      try {
        const result = await startClarifySession({ trigger: "wizard" });
        setSessionId(result.sessionId);
        setMessages([{ role: "cat", body: result.opening.body }]);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "the cat couldn't open the session. skip ahead and come back to her later?",
        );
      }
    });
  }, []);

  // Autoscroll when the stream grows or thinking flips on.
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
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "the cat hit a snag. try again, or skip ahead?",
        );
        // Roll back the optimistic user turn so the input can be re-sent.
        setMessages((prev) =>
          prev.length > 0 && prev[prev.length - 1].role === "user"
            ? prev.slice(0, -1)
            : prev,
        );
        setInput(content);
      }
    });
  }

  /**
   * Called by the wizard's Next button (via the exposed
   * `closeSessionBeforeAdvance` ref). If the cat hasn't ended the
   * session, we close it server-side so it doesn't dangle. The
   * transcript is preserved on the row either way.
   *
   * Returns a promise so the wizard can `await` before it advances.
   */
  async function closeBeforeAdvance(): Promise<void> {
    if (sessionId === null || ended) return;
    try {
      await endClarifySessionAsClosed(sessionId);
    } catch {
      // Best-effort close. Don't block the user from advancing on a
      // network blip — the row will get reaped by the next session
      // scan (Step 8 candidate; not blocking v0.8 here).
    }
  }

  // Expose the close handler upward via a window event so the wizard's
  // existing Next-button shape doesn't need a prop refactor. The
  // wizard listens for `wizard-clarify-close` (A7.2) before advancing.
  useEffect(() => {
    function onCloseRequest(e: Event) {
      const detail = (e as CustomEvent<{ resolve: () => void }>).detail;
      void closeBeforeAdvance().finally(() => detail.resolve());
    }
    window.addEventListener("wizard-clarify-close", onCloseRequest);
    return () =>
      window.removeEventListener("wizard-clarify-close", onCloseRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, ended]);

  return (
    <div
      className="rounded-md mt-2"
      style={{
        background: "var(--card-interior-bg)",
        color: "var(--card-interior-text)",
        border: "1px solid var(--card-interior-rule)",
        borderTop: "1px solid var(--readout-cyan)",
      }}
    >
      <header
        className="px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--card-interior-rule)" }}
      >
        <CatMark size={22} className="shrink-0" />
        <div className="min-w-0">
          <div className="mono text-[10px] uppercase tracking-[0.16em] text-whisper">
            clarify · seeded
          </div>
          <div className="font-sans text-sm text-ink leading-tight">
            {displayName ? (
              <>
                hi {displayName.split(/\s+/)[0]} — lobbycat wants one short
                exchange before we score.
              </>
            ) : (
              <>lobbycat wants one short exchange before we score.</>
            )}
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="px-4 py-4 space-y-4 max-h-[26rem] overflow-y-auto"
      >
        {opening && messages.length === 0 && (
          <p className="mono text-xs text-whisper italic">
            <em>the cat is reading your answers…</em>
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "cat" ? (
            <p
              key={i}
              className="font-sans text-base text-ink leading-relaxed whitespace-pre-wrap"
            >
              {m.body}
            </p>
          ) : (
            <div key={i} className="flex justify-end">
              <div
                className="mono text-sm leading-relaxed whitespace-pre-wrap max-w-[28ch] px-3 py-2 rounded-sm"
                style={{
                  background: "var(--card-interior-bg-sunk)",
                  color: "var(--card-interior-text)",
                  border: "1px solid var(--card-interior-rule)",
                }}
              >
                {m.body}
              </div>
            </div>
          ),
        )}
        {thinking && (
          <p className="mono text-xs text-whisper italic">
            <em>…</em>
          </p>
        )}
        {ended && (
          <p className="font-sans text-sm text-muted italic">
            <em>thread closed. ready when you are.</em>
          </p>
        )}
        {error && (
          <p className="font-sans text-sm text-coral">{error}</p>
        )}
      </div>

      <footer
        className="px-4 py-3"
        style={{ borderTop: "1px solid var(--card-interior-rule)" }}
      >
        {ended ? (
          <p className="mono text-xs uppercase tracking-[0.14em] text-whisper text-center">
            click <em>score it →</em> below when you&rsquo;re ready
          </p>
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
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
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

/**
 * Tiny helper the wizard's Next handler calls before advancing.
 * Returns a promise that resolves once the embedded session has been
 * cleanly closed (or immediately if there's no embedded session).
 */
export function closeWizardClarifySession(): Promise<void> {
  return new Promise<void>((resolve) => {
    const ev = new CustomEvent("wizard-clarify-close", {
      detail: { resolve },
    });
    window.dispatchEvent(ev);
    // Safety net: if no listener is mounted (e.g. user is on a step
    // that doesn't render the embedded session), resolve after a tick.
    setTimeout(resolve, 50);
  });
}
