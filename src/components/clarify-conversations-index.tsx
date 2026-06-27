"use client";

/**
 * v0.8 Step 9 — /about Conversations section.
 *
 * Per REFACTOR-v0.8 §6: list every clarify session in reverse-chrono
 * order; click a row to expand its full transcript inline; per-row
 * delete affordance with confirm, hard-deleting the session +
 * messages (cascade via FK).
 *
 * Surface notes:
 *   - Embedded as a vertical section under the existing Notes index
 *     (A9.1) — the scope doc says "third tab" but /about ships
 *     untabbed today; matching the existing pattern is the lighter
 *     touch and saves a tab-UI refactor for a future v0.8.x.
 *   - Transcripts expand inline rather than push to a new route; one
 *     click to read, one click to collapse.
 *   - Accept/reject buttons surface here when the session row carries
 *     a pending proposal — same accept handler shape as
 *     <ClarifyPanel>. (A9.3.)
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteClarifySession } from "@/app/actions";
import type {
  ClarifySessionListRow,
  ClarifySessionWithMessages,
} from "@/lib/queries";

const TRIGGER_LABEL: Record<string, string> = {
  manual: "dashboard button",
  wizard: "wizard step 5",
  "welcome-back": "welcome-back card",
  "company-detail": "company page",
};

function fmtWhen(d: Date): string {
  const now = Date.now();
  const ms = now - d.getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ClarifyConversationsIndex({
  sessions,
}: {
  sessions: ClarifySessionListRow[];
}) {
  return (
    <section className="max-w-[42rem] mx-auto px-6 pb-24 pt-12">
      <div className="eyebrow mb-2">Conversations</div>
      <h2 className="font-sans text-2xl font-medium text-ink tracking-tight">
        Your clarify sessions
      </h2>
      <p className="serif text-sm text-muted mt-2 max-w-2xl">
        every time lobbycat sat down with you. yours to read or delete.
      </p>

      <ul className="mt-6 space-y-3">
        {sessions.length === 0 && (
          <li
            className="rounded border border-dashed border-rule px-4 py-6 text-center"
          >
            <p className="serif text-sm text-whisper italic">
              no sessions yet. say hi to lobbycat from the dashboard.
            </p>
          </li>
        )}
        {sessions.map((s) => (
          <ConversationRow key={s.id} session={s} />
        ))}
      </ul>
    </section>
  );
}

function ConversationRow({ session }: { session: ClarifySessionListRow }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<ClarifySessionWithMessages | null>(
    null,
  );
  const [loading, startLoading] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (deleted) return;
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (detail) return;
    startLoading(async () => {
      setError(null);
      try {
        const result = await fetchSessionTranscript(session.id);
        setDetail(result);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "couldn't fetch the transcript. try again?",
        );
      }
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "delete this conversation? the transcript is gone forever. any proposal you accepted stays.",
      )
    )
      return;
    startDeleting(async () => {
      setError(null);
      try {
        await deleteClarifySession(session.id);
        setDeleted(true);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "delete didn't go through. try again?",
        );
      }
    });
  }

  if (deleted) {
    return (
      <li className="rounded border border-dashed border-rule px-4 py-3">
        <p className="mono text-xs italic text-whisper">
          conversation deleted.
        </p>
      </li>
    );
  }

  return (
    <li
      className="rounded-md border border-rule overflow-hidden"
      style={{ background: "var(--card-interior-bg)" }}
    >
      <header
        className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-panel-raised/30 transition-colors"
        onClick={toggle}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="mono text-[11px] uppercase tracking-[0.14em] text-readout">
              {TRIGGER_LABEL[session.trigger] ?? session.trigger}
            </span>
            {session.seedCompanySlug && session.seedCompanyName && (
              <Link
                href={`/companies/${session.seedCompanySlug}`}
                className="mono text-[11px] uppercase tracking-[0.14em] text-ink hover:text-readout underline decoration-dotted underline-offset-4"
                onClick={(e) => e.stopPropagation()}
              >
                {session.seedCompanyName}
              </Link>
            )}
            <span className="mono text-[11px] text-whisper">
              {fmtWhen(session.startedAt)}
            </span>
          </div>
          {session.seedNote && (
            <p className="serif text-sm text-muted mt-2 line-clamp-2 max-w-2xl">
              {session.seedNote}
            </p>
          )}
          <div className="mono text-[10px] uppercase tracking-[0.14em] text-whisper mt-2 flex items-center gap-3 flex-wrap">
            <span>{session.messageCount} turns</span>
            {session.endState && <span>· {session.endState}</span>}
            {session.proposalKind && (
              <span
                className={
                  session.proposalAccepted === true
                    ? "text-readout"
                    : session.proposalAccepted === false
                      ? "text-muted"
                      : "text-coral"
                }
              >
                ·{" "}
                {session.proposalAccepted === true
                  ? "✓ accepted"
                  : session.proposalAccepted === false
                    ? "✗ left for now"
                    : "○ pending proposal"}
              </span>
            )}
          </div>
        </div>
        <span className="mono text-xs text-whisper shrink-0 select-none">
          {expanded ? "▴" : "▾"}
        </span>
      </header>

      {expanded && (
        <div
          className="px-4 py-4"
          style={{ borderTop: "1px solid var(--card-interior-rule)" }}
        >
          {loading && (
            <p className="mono text-xs italic text-whisper">
              <em>fetching transcript…</em>
            </p>
          )}
          {error && <p className="font-sans text-sm text-coral">{error}</p>}
          {detail && (
            <Transcript detail={detail} />
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="mono text-[10px] uppercase tracking-[0.14em] text-coral hover:underline disabled:opacity-50"
            >
              {deleting ? "deleting…" : "delete conversation"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Transcript({ detail }: { detail: ClarifySessionWithMessages }) {
  return (
    <div className="space-y-4">
      {detail.messages.map((m) =>
        m.role === "cat" ? (
          <p
            key={m.id}
            className="font-sans text-base text-ink leading-relaxed whitespace-pre-wrap"
          >
            {m.body}
          </p>
        ) : (
          <div key={m.id} className="flex justify-end">
            <div
              className="mono text-sm leading-relaxed whitespace-pre-wrap max-w-[34ch] px-3 py-2 rounded-sm"
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
      {detail.proposalKind && detail.proposalData && (
        <div
          className="mt-4 rounded-sm p-3"
          style={{
            background: "var(--card-interior-bg-sunk)",
            border: "1px solid var(--card-interior-rule)",
          }}
        >
          <div className="mono text-[10px] uppercase tracking-[0.16em] text-readout mb-1">
            proposal — {detail.proposalKind}
          </div>
          <p className="font-sans text-sm text-ink">
            {typeof detail.proposalData.summary === "string"
              ? detail.proposalData.summary
              : "(no summary recorded)"}
          </p>
          <p className="mono text-[10px] text-whisper mt-2">
            {detail.proposalAccepted === true
              ? "you accepted this"
              : detail.proposalAccepted === false
                ? "you left it for now"
                : "still pending — accept it from the dashboard cat button"}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Browser-side fetch wrapping the server query. We can't call query
 * functions directly from a Client Component, so /api/clarify/sessions/[id]
 * stays a small RSC-route forwarder. (See A9.2 in ASSUMPTIONS-v0.8.md
 * for the route shape.)
 */
async function fetchSessionTranscript(
  sessionId: number,
): Promise<ClarifySessionWithMessages> {
  const res = await fetch(`/api/clarify/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`transcript fetch failed: ${res.status}`);
  const json = (await res.json()) as ClarifySessionWithMessages;
  // Re-hydrate Date strings.
  return {
    ...json,
    startedAt: new Date(json.startedAt),
    endedAt: json.endedAt ? new Date(json.endedAt) : null,
    messages: json.messages.map((m) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    })),
  };
}
