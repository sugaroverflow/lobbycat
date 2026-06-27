export const dynamic = "force-dynamic";

import { SiteShell } from "@/components/site-shell";
import { FramesEditor, type EditableFrame } from "@/components/frames-editor";
import { ExplainerBox } from "@/components/explainer-box";
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

  const initialWeights = (profile?.frameWeights ?? {}) as Record<
    string,
    FrameWeightLevel
  >;

  return (
    <SiteShell>
      <section className="max-w-[64rem] mx-auto px-6 pt-12 pb-24">
        <div className="eyebrow mb-3">Frames</div>
        <h1 className="font-sans text-4xl font-medium text-ink tracking-tight">
          The axes you think on.
        </h1>

        <ExplainerBox
          id="frames"
          className="mt-6"
          body="here you can adjust the frames that you care about! come back to add more or adjust them as your thinking changes."
        />

        <FramesEditor frames={editable} weights={initialWeights} />
      </section>
    </SiteShell>
  );
}
