import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-body">
      <header className="border-b border-rule">
        <div className="max-w-[64rem] mx-auto px-6 py-4 flex items-baseline justify-between">
          <Link href="/" className="serif text-xl text-ink tracking-tight">
            <Wordmark size={26} />
          </Link>
          <nav className="flex items-center gap-6 mono text-xs uppercase tracking-[0.14em] text-muted">
            <Link href="/" className="hover:text-ink transition">Index</Link>
            <Link href="/compare" className="hover:text-ink transition">Compare</Link>
            <Link href="/frames" className="hover:text-ink transition">Frames</Link>
            <Link href="/about" className="hover:text-ink transition">About</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-rule">
        <div className="max-w-[64rem] mx-auto px-6 py-6 mono text-xs uppercase tracking-[0.14em] text-whisper flex items-center justify-between">
          <span>lobbycat · est. 2026</span>
          <span>v0 · napping</span>
        </div>
      </footer>
    </div>
  );
}
