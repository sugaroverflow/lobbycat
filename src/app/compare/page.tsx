import { SiteShell } from "@/components/site-shell";
import { db } from "@/db";
import {
  companies,
  frames as framesTable,
  frameScores,
  userProfile,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { CompareSandbox } from "./compare-sandbox";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>;
}) {
  const { slugs: slugsParam } = await searchParams;
  const slugs = slugsParam ? slugsParam.split(",").filter(Boolean) : [];

  const [allCompanies, scaleFrames, profile] = await Promise.all([
    db.select().from(companies).orderBy(companies.name),
    db
      .select()
      .from(framesTable)
      .where(eq(framesTable.kind, "scale"))
      .orderBy(framesTable.sortIndex),
    db.select().from(userProfile).limit(1),
  ]);

  const selectedCompanies = slugs.length
    ? allCompanies.filter((c) => slugs.includes(c.slug))
    : [];

  const cellRows = selectedCompanies.length
    ? await db
        .select({
          companyId: frameScores.companyId,
          frameId: frameScores.frameId,
          score: frameScores.score,
          rationale: frameScores.rationale,
        })
        .from(frameScores)
        .where(
          inArray(
            frameScores.companyId,
            selectedCompanies.map((c) => c.id),
          ),
        )
    : [];

  const cells = cellRows.map((r) => ({
    companyId: r.companyId,
    frameId: r.frameId,
    score: r.score === null ? null : Number(r.score),
    rationale: r.rationale ?? null,
  }));

  const savedWeights =
    (profile[0]?.frameWeights as Record<string, FrameWeightLevel> | undefined) ??
    {};

  return (
    <SiteShell>
      <section className="max-w-[64rem] mx-auto px-6 pt-12 pb-4">
        <div className="eyebrow mb-3">Compare</div>
        <h1 className="serif text-4xl font-medium text-ink tracking-tight">
          Side-by-side, with a sandbox
        </h1>
        <p className="serif mt-4 text-muted max-w-2xl">
          Pick 2–5 companies. Push the L · M · H sliders around to see how the
          ranking changes if you cared about different things — your saved
          weights stay put.
        </p>
      </section>

      <CompareSandbox
        allCompanies={allCompanies.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
        }))}
        initialSelected={slugs}
        selectedCompanies={selectedCompanies.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
        }))}
        frames={scaleFrames.map((f) => ({
          id: f.id,
          name: f.name,
          scale: f.scale,
          lowLabel: f.lowLabel,
          highLabel: f.highLabel,
        }))}
        cells={cells}
        savedWeights={savedWeights}
      />
    </SiteShell>
  );
}
