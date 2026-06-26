import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";
import { SurpriseButton } from "@/components/surprise-modal";
import { AskLobbycatStub } from "@/components/ask-lobbycat-stub";

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
            {/* v0.8.1 Phase B F3.5 part 3/N — Favorites lens. Sits between
                Frames and Surprise to keep the dashboard-adjacent items grouped
                on the left and the playful/utility items (surprise, profile,
                ask) on the right. No icon at nav level — uppercase mono only
                matches the codebase's no-icon-lib convention. */}
            <Link href="/favorites" className="hover:text-ink transition">Favorites</Link>
            <SurpriseButton />
            <Link href="/profile" className="hover:text-ink transition">Profile</Link>
            <AskLobbycatStub />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-rule">
        <div className="max-w-[64rem] mx-auto px-6 py-6 mono text-xs uppercase tracking-[0.14em] flex flex-col gap-2">
          <div className="text-whisper flex items-center justify-between">
            <span>lobbycat · est. 2026</span>
            <span>v0 · napping</span>
          </div>
          <div className="text-ink">made as a surprise &lt;3</div>
        </div>
      </footer>
    </div>
  );
}
