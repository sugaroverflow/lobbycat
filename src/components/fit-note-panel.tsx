"use client";

import { useTransition } from "react";
import { generateFitNote } from "@/app/actions";

type FitNote = {
  headline: string | null;
  body: string;
  createdAt: Date;
} | null;

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
}) {
  const [pending, start] = useTransition();
  const parsed = fitNote ? parseFitNote(fitNote.body) : null;
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
      {parsed ? (
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
        </>
      ) : (
        <p className="serif text-base text-muted leading-relaxed">
          No fit note yet. Click <span className="mono text-xs">generate</span> and the cat will think it over.
        </p>
      )}
    </aside>
  );
}
