"use client";

import { useRef, useState, useTransition } from "react";
import { generateFitNote, sendFitNoteMessage } from "@/app/actions";
import { CatMark } from "@/components/wordmark";
import { ClarifyLauncher } from "@/components/clarify-launcher";
import { LoadingCat } from "@/components/loading-cat";
import quotes from "@/db/lobbycat-quotes.json";

type QuotePools = { fitNoting?: string[] };

type FitNote = {
  headline: string | null;
  body: string;
  createdAt: Date;
} | null;

type ThreadMessage = {
  id: number;
  role: string; // 'user' | 'cat'
  content: string;
  createdAt: Date;
};

function parseFitNote(body: string): { bullets: string[]; caveat: string | null } {
  const bullets: string[] = [];
  let caveat: string | null = null;
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const caveatMatch = line.match(/^caveat\s*:\s*(.+)$/i);
    if (caveatMatch) {
      caveat = caveatMatch[1].trim();
      continue;
    }
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim());
      continue;
    }
    // Legacy paragraph-shaped fit-notes: keep the line as a single bullet
    // so old DB rows still render reasonably until they're regenerated.
    bullets.push(line);
  }
  return { bullets, caveat };
}

export function FitNotePanel({
  companyId,
  fitNote,
  thread,
}: {
  companyId: number;
  fitNote: FitNote;
  thread: ThreadMessage[];
}) {
  const [pending, start] = useTransition();
  const [sending, startSend] = useTransition();
  const [draft, setDraft] = useState("");
  // Optimistic copy of the just-sent user message so the thread updates
  // instantly. revalidatePath round-trips through an Anthropic call that
  // can take several seconds; without this the UI looks frozen and the
  // feature reads as "broken" (see F4.2).
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const parsed = fitNote ? parseFitNote(fitNote.body) : null;
  const fitNotingPool = (quotes as unknown as QuotePools).fitNoting ?? [];

  function submitDraft() {
    const content = draft.trim();
    if (!content || sending) return;
    setDraft("");
    setPendingUserMessage(content);
    startSend(async () => {
      try {
        await sendFitNoteMessage({ companyId, content });
      } catch (err) {
        // Restore the draft so the user doesn't lose what they typed.
        setDraft(content);
        console.error(err);
      } finally {
        // Once the server action returns, the persisted thread row will
        // appear via revalidatePath; clear the optimistic copy so we
        // don't double-render it.
        setPendingUserMessage(null);
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitDraft();
  }

  return (
    <aside className="border border-rule rounded-sm p-6 bg-surface">
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow flex items-center gap-2">
          <CatMark size={18} className="shrink-0" />
          <span>lobbycat says</span>
        </div>
        <button
          type="button"
          onClick={() => start(() => generateFitNote(companyId))}
          disabled={pending}
          className="mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink disabled:text-whisper transition"
        >
          {pending ? "thinking…" : fitNote ? "regenerate" : "generate"}
        </button>
      </div>
      {pending ? (
        <LoadingCat
          quotes={fitNotingPool}
          label={fitNote ? "re-reading" : "reading"}
          align="row"
        />
      ) : parsed ? (
        <>
          <ul className="serif text-base text-body leading-relaxed space-y-2 list-none pl-0">
            {parsed.bullets.map((b, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-[0.45em] inline-block size-1.5 rounded-full bg-moss shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {parsed.caveat && (
            <p className="mt-4 pt-3 border-t border-rule serif text-sm text-muted leading-relaxed">
              <span className="mono text-[10px] uppercase tracking-[0.12em] text-terracotta mr-2">caveat</span>
              {parsed.caveat}
            </p>
          )}
          {/* v0.8 step 6 — scoped clarify entry-point. Opens the chat
              panel seeded to this company so the cat opens "we're
              talking about <company>" instead of cold. */}
          <div className="mt-4 pt-3 border-t border-rule">
            <ClarifyLauncher
              variant="link"
              trigger="company-detail"
              seedCompanyId={companyId}
              label="clarify this fit →"
            />
          </div>
        </>
      ) : (
        <div className="flex items-start gap-3">
          <CatMark size={32} className="shrink-0 mt-0.5 opacity-80" />
          <p className="serif text-base text-muted leading-relaxed">
            No fit note yet. Click <span className="mono text-xs">generate</span> and the cat will think it over.
          </p>
        </div>
      )}

      {/* Conversation thread — only shows once there's a fit-note to ask about */}
      {fitNote && (
        <div className="mt-6 pt-5 border-t border-rule">
          <div className="eyebrow mb-3">follow up</div>
          {(thread.length > 0 || pendingUserMessage || sending) && (
            <ul className="space-y-3 mb-4 list-none pl-0">
              {thread.map((m) => {
                const isCat = m.role === "cat";
                return (
                  <li key={m.id} className="flex flex-col gap-1">
                    <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      {isCat ? "lobbycat" : "you"}
                    </span>
                    <p
                      className={
                        isCat
                          ? "serif text-sm text-body leading-relaxed"
                          : "serif text-sm text-ink leading-relaxed pl-3 border-l-2 border-sage-soft"
                      }
                    >
                      {m.content}
                    </p>
                  </li>
                );
              })}
              {pendingUserMessage && (
                <li key="pending-user" className="flex flex-col gap-1">
                  <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    you
                  </span>
                  <p className="serif text-sm text-ink leading-relaxed pl-3 border-l-2 border-sage-soft opacity-80">
                    {pendingUserMessage}
                  </p>
                </li>
              )}
              {sending && (
                <li className="flex flex-col gap-1">
                  <span className="mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    lobbycat
                  </span>
                  <LoadingCat
                    quotes={fitNotingPool}
                    label="following up"
                    size={32}
                    align="row"
                  />
                </li>
              )}
            </ul>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Plain Enter sends; Shift+Enter inserts a newline. ⌘/Ctrl+Enter
                // still works for muscle-memory parity with the old behaviour.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submitDraft();
                }
              }}
              placeholder="Ask the cat a follow-up… (Enter to send, Shift+Enter for newline)"
              rows={2}
              disabled={sending}
              className="w-full resize-none rounded-sm border border-rule bg-bg p-2 serif text-sm text-ink placeholder:text-whisper focus:outline-none focus:border-moss disabled:opacity-60"
              maxLength={2000}
            />
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send message to lobbycat"
                className="mono text-[10px] uppercase tracking-[0.14em] px-3 py-2 bg-action text-canvas rounded-sm hover:bg-action-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? "sending…" : "send"}
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}
