"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  // Explicit-save button state: idle → saving → saved (2s) → idle
  const [buttonState, setButtonState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  async function persist() {
    await saveCompanyNotes({ companyId, notes });
    setSavedAt(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }

  function handleExplicitSave() {
    if (buttonState === "saving") return;
    setButtonState("saving");
    start(async () => {
      try {
        await persist();
        setButtonState("saved");
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setButtonState("idle"), 2000);
      } catch {
        setButtonState("idle");
      }
    });
  }

  const buttonLabel =
    buttonState === "saving"
      ? "saving…"
      : buttonState === "saved"
        ? "saved ✓"
        : "Save note";

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
        onBlur={() => start(() => persist())}
        rows={8}
        placeholder="What did the conversation reveal? What's missing? What still nags at you?"
        className="serif text-base text-body w-full px-4 py-3 bg-surface border border-rule rounded-sm placeholder:text-whisper focus:outline-none focus:border-accent leading-relaxed min-h-[14rem]"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={handleExplicitSave}
          disabled={buttonState === "saving"}
          aria-live="polite"
          className="mono text-[10px] uppercase tracking-[0.14em] px-3 py-2 bg-action text-canvas rounded-sm hover:bg-action-hover transition disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
