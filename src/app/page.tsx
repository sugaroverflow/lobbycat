export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf7f3] text-[#3a2a2a] font-sans px-6">
      <div className="text-7xl mb-4" aria-hidden>🐱</div>
      <h1 className="text-4xl font-semibold tracking-tight">lobbycat</h1>
      <p className="mt-4 max-w-md text-center text-[#7a5a5a] leading-relaxed">
        A quiet dashboard for loud decisions. Coming soon.
      </p>
      <p className="mt-12 text-xs uppercase tracking-[0.2em] text-[#b89898]">
        v0 · napping
      </p>
    </div>
  );
}
