export const dynamic = "force-dynamic";

import { SiteShell } from "@/components/site-shell";
import { FramesEditor, type EditableFrame } from "@/components/frames-editor";
import { FrameWeightsPanel } from "@/components/frame-weights-panel";
import { getAllFrames, getUserProfile } from "@/lib/queries";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";

export default async function FramesPage() {
  const [frames, profile] = await Promise.all([
    getAllFrames(),
    getUserProfile(),
  ]);
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

  const scaleFrames = editable
    .filter((f) => f.kind === "scale")
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((f) => ({
      id: f.id,
      name: f.name,
      lowLabel: f.lowLabel,
      highLabel: f.highLabel,
    }));

  const initialWeights = (profile?.frameWeights ?? {}) as Record<
    string,
    FrameWeightLevel
  >;

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

        {/* Definitions — quick reference for the three frame kinds. */}
        <section
          aria-label="Frame definitions"
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div className="border border-rule rounded-sm bg-panel-raised/40 p-4">
            <div className="mono text-[10px] uppercase tracking-[0.14em] text-whisper mb-1">
              scale
            </div>
            <div className="serif text-ink text-base">A 1–N axis</div>
            <p className="serif text-sm text-muted mt-1">
              Low label → high label. Used by the dashboard ranking and the
              comparator. Most frames are scales.
            </p>
          </div>
          <div className="border border-rule rounded-sm bg-panel-raised/40 p-4">
            <div className="mono text-[10px] uppercase tracking-[0.14em] text-whisper mb-1">
              tag
            </div>
            <div className="serif text-ink text-base">A binary lens</div>
            <p className="serif text-sm text-muted mt-1">
              Either a company is tagged or it isn&apos;t. Good for cohorts
              you want to filter on (e.g. <em>frontier lab</em>).
            </p>
          </div>
          <div className="border border-rule rounded-sm bg-panel-raised/40 p-4">
            <div className="mono text-[10px] uppercase tracking-[0.14em] text-whisper mb-1">
              question
            </div>
            <div className="serif text-ink text-base">A free-text prompt</div>
            <p className="serif text-sm text-muted mt-1">
              Each company gets a written answer. Lives in the drawer,
              doesn&apos;t affect the ranking.
            </p>
          </div>
        </section>

        <div className="mt-10">
          <FrameWeightsPanel frames={scaleFrames} initial={initialWeights} />
        </div>
        <FramesEditor frames={editable} />
      </section>
    </SiteShell>
  );
}
