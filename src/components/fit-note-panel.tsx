"use client";

import { useTransition } from "react";
import { generateFitNote } from "@/app/actions";

type FitNote = {
  headline: string | null;
  body: string;
  createdAt: Date;
} | null;

export function FitNotePanel({
  companyId,
  fitNote,
}: {
  companyId: number;
  fitNote: FitNote;
}) {
  const [pending, start] = useTransition();
  return (
    <aside className="border border-rule rounded-sm p-6 bg-surface">
      <div className="flex items-baseline justify-between mb-3">
        <div className="eyebrow flex items-center gap-2">
          <span>lobbycat says</span>
          <span style={{ color: "#B85048" }}>❤</span>
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
      {fitNote ? (
        <p className="serif text-base text-body leading-relaxed whitespace-pre-wrap">
          {fitNote.body}
        </p>
      ) : (
        <p className="serif text-base text-muted leading-relaxed">
          No fit note yet. Click <span className="mono text-xs">generate</span> and the cat will think it over.
        </p>
      )}
    </aside>
  );
}
