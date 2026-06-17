import { SiteShell } from "@/components/site-shell";
import { getAllFrames } from "@/lib/queries";

export default async function FramesPage() {
  const frames = await getAllFrames();
  return (
    <SiteShell>
      <section className="max-w-[64rem] mx-auto px-6 pt-12 pb-24">
        <div className="eyebrow mb-3">Frames</div>
        <h1 className="serif text-4xl font-medium text-ink tracking-tight">
          The axes you think on.
        </h1>
        <p className="serif mt-4 text-muted max-w-2xl">
          A frame is a question you keep asking. The companies don&apos;t answer
          it; you do. Add more as your thinking changes.
        </p>
        <ul className="mt-10 divide-y divide-rule">
          {frames.map((f) => (
            <li key={f.id} className="py-6">
              <h3 className="serif text-xl text-ink font-medium">{f.name}</h3>
              {f.description && (
                <p className="serif text-base text-muted mt-2 max-w-2xl">
                  {f.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 mono text-xs uppercase tracking-[0.1em] text-whisper">
                <span>{f.lowLabel}</span>
                <span>→</span>
                <span>{f.highLabel}</span>
                <span className="text-whisper">· 1–{f.scale}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="serif text-sm text-whisper mt-12 max-w-2xl italic">
          (Frame editing UI coming. For now, frames are seeded in code.)
        </p>
      </section>
    </SiteShell>
  );
}
