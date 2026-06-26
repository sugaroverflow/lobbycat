import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";
import { SurpriseButton } from "@/components/surprise-modal";
import { ClarifyLauncher } from "@/components/clarify-launcher";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-body">
      <header className="border-b border-rule">
        <div className="max-w-[64rem] mx-auto px-6 py-4 flex items-baseline justify-between">
          <Link href="/" className="serif text-xl text-ink tracking-tight">
            <Wordmark size={26} />
          </Link>
          <nav className="flex items-center gap-6 mono text-xs uppercase tracking-[0.14em] text-muted">
            <Link href="/frames" className="hover:text-ink transition">Frames</Link>
            <SurpriseButton />
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
      {/*
        v0.8 step 6 — persistent bottom-right "talk to lobbycat" pill.
        Replaces the v0.7.2 header `AskLobbycatStub` (kept in-repo for
        the /about Conversations tab's screenshot history but no longer
        mounted on live pages).
      */}
      <ClarifyLauncher trigger="manual" />
    </div>
  );
}
