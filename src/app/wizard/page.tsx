export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Wizard, type WizardInitial } from "@/components/wizard";
import { getAllFrames, getUserProfile } from "@/lib/queries";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { sql } from "drizzle-orm";
import quotes from "@/db/lobbycat-quotes.json";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";

type Quotes = { firstScoring: string[] };

export default async function WizardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const force = sp.replay === "1";

  const [profile, frames, companyCountRows] = await Promise.all([
    getUserProfile(),
    getAllFrames(),
    db.select({ n: sql<number>`count(*)::int` }).from(companies),
  ]);

  // If already done and not in replay, go home.
  if (profile?.wizardCompletedAt && !force) redirect("/");

  const scaleFrames = frames
    .filter((f) => (f.kind ?? "scale") === "scale")
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    .map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description ?? null,
      lowLabel: f.lowLabel ?? null,
      highLabel: f.highLabel ?? null,
    }));

  const weights = (profile?.frameWeights ?? {}) as Record<
    string,
    FrameWeightLevel
  >;

  const initial: WizardInitial = {
    displayName: profile?.displayName ?? "",
    currentRoleOneLiner: profile?.currentRoleOneLiner ?? "",
    exploringText: profile?.exploringText ?? "",
    locationPreferences: profile?.locationPreferences ?? {},
    openTextAnswers: profile?.openTextAnswers ?? [],
    frames: scaleFrames,
    weights,
    companyCount: Number(companyCountRows[0]?.n ?? 0),
    firstScoringQuotes: (quotes as unknown as Quotes).firstScoring ?? [],
    replay: force,
  };

  return (
    <SiteShell>
      <Wizard initial={initial} />
    </SiteShell>
  );
}
