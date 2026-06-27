"use client";

import { useTransition } from "react";
import { generateFitNote } from "@/app/actions";
import { CatMark } from "@/components/wordmark";
import { ClarifyLauncher } from "@/components/clarify-launcher";
import { LoadingCat } from "@/components/loading-cat";
import quotes from "@/db/lobbycat-quotes.json";

type QuotePools = { fitNoting?: string[] };

// v0.8.4: follow-up Q&A on the fit-note has been removed. Fatima asked
// for the feature to be cut entirely (2026-06-27 12:00 UTC) — it kept
// being flaky and the clarify panel covers the same need more cleanly.
// The DB table (fit_note_messages) + the sendFitNoteMessage server
// action stay in tree for now in case we want to revive the feature
// later or surface conversation history in /profile; only the UI is
// gone. `thread` is still accepted as a prop so the upstream page
// component doesn't need a same-day type change — it's just unused.

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
}: {
  companyId: number;
  fitNote: FitNote;
  // `thread` was previously the in-panel chat history. Removed in v0.8.4
  // along with the follow-up form. Keep the prop in the upstream
  // component for now (zero-cost) and ignore it here.
  thread?: ThreadMessage[];
}) {
  const [pending, start] = useTransition();
  const parsed = fitNote ? parseFitNote(fitNote.body) : null;
  const fitNotingPool = (quotes as unknown as QuotePools).fitNoting ?? [];

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
            No fit note yet. Click <span className="mono text-xs">generate</span> and lobbycat will think it over.
          </p>
        </div>
      )}

      {/* v0.8.4: fit-note follow-up was removed per Fatima 2026-06-27
       * 12:00 UTC. The clarify panel (bottom-right pill) is the
       * supported way to take a conversation further with lobbycat. */}
    </aside>
  );
}
