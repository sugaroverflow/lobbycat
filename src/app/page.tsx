export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-bg text-ink">
      <div className="max-w-xl w-full">
        <div className="eyebrow mb-6">Index · v0</div>
        <h1 className="serif text-5xl sm:text-6xl font-medium leading-[1.05] tracking-tight">
          <span className="mr-3">🐱</span>lobbycat
        </h1>
        <p className="serif mt-6 text-xl text-muted leading-relaxed">
          A quiet dashboard for loud decisions. Tracks AI&nbsp;policy roles,
          teams, publications, and lobbying footprints across companies — so a
          career decision can be made with something better than tabs and vibes.
        </p>
        <div className="mt-12 flex items-center gap-4 mono text-xs uppercase tracking-[0.18em] text-whisper">
          <span>napping</span>
          <span className="h-px w-8 bg-rule" />
          <span>est. 2026</span>
        </div>
      </div>
    </main>
  );
}
