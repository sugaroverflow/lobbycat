"use client";

import { useState, useTransition } from "react";
import { saveCompanyNotes } from "@/app/actions";

export function NotesEditor({
  companyId,
  initial,
}: {
  companyId: number;
  initial: string | null;
}) {
  const [notes, setNotes] = useState(initial || "");
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="eyebrow">Your notes</h3>
        <span className="mono text-[10px] text-whisper">
          {pending ? "saving…" : savedAt ? `saved ${savedAt}` : ""}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() =>
          start(async () => {
            await saveCompanyNotes({ companyId, notes });
            setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
          })
        }
        rows={8}
        placeholder="What did the conversation reveal? What's missing? What still nags at you?"
        className="serif text-base text-body w-full px-4 py-3 bg-surface border border-rule rounded-sm placeholder:text-whisper focus:outline-none focus:border-accent leading-relaxed"
      />
    </div>
  );
}
