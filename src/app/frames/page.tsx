import { SiteShell } from "@/components/site-shell";
import { FramesEditor, type EditableFrame } from "@/components/frames-editor";
import { getAllFrames } from "@/lib/queries";

export default async function FramesPage() {
  const frames = await getAllFrames();
  const editable: EditableFrame[] = frames.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description ?? null,
    kind: f.kind ?? "scale",
    scale: f.scale ?? 5,
    highLabel: f.highLabel ?? null,
    lowLabel: f.lowLabel ?? null,
    prompt: f.prompt ?? null,
    sortIndex: f.sortIndex ?? 0,
  }));

  return (
    <SiteShell>
      <section className="max-w-[64rem] mx-auto px-6 pt-12 pb-24">
        <div className="eyebrow mb-3">Frames</div>
        <h1 className="serif text-4xl font-medium text-ink tracking-tight">
          The axes you think on.
        </h1>
        <p className="serif mt-4 text-muted max-w-2xl">
          A frame is a question you keep asking. The companies don&apos;t answer
          it; you do. Add more as your thinking changes — scales for 1–N axes,
          tags for binary lenses, questions for free-text answers per company.
        </p>
        <FramesEditor frames={editable} />
      </section>
    </SiteShell>
  );
}
