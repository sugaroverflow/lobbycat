"use client";

import type { ReactNode } from "react";

export function FilterChip({
  label,
  active,
  onClick,
  dotColor,
}: {
  label: ReactNode;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 text-[0.7rem] rounded-full px-2.5 py-1 border transition-colors ${
        active
          ? "bg-moss text-surface border-moss"
          : "bg-surface text-muted border-rule hover:text-ink hover:border-mushroom"
      }`}
    >
      {dotColor && (
        <span
          aria-hidden
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: dotColor }}
        />
      )}
      {label}
    </button>
  );
}

export function FilterRowLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mono text-[0.6rem] uppercase tracking-[0.14em] text-whisper mr-1">
      {children}
    </span>
  );
}
