export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { WelcomeCard } from "@/components/welcome-card";
import { RankedTable } from "@/components/ranked-table";
import { CoachmarkOnboarding } from "@/components/coachmark-onboarding";
import { getRankedHomeData, getUserProfile } from "@/lib/queries";
import quotes from "@/db/lobbycat-quotes.json";

type Quotes = { welcomeBack: string[] };

/**
 * v0.6 home — welcome card + ranked table (§3.2 of REFACTOR-v0.6).
 *
 * The Map is gone. The home is the engine:
 *   - WelcomeCard rotates a `welcomeBack` quote (picked here on the server
 *     to keep the client render pure) and exposes a Re-score button when
 *     the oldest score is > 7d stale.
 *   - RankedTable shows every company, ranked by weighted aggregate.
 *     Click a frame header to sort by that frame.
 *
 * Weights are read-only here; editing happens on /frames. The aggregate
 * recomputes client-side from the snapshot via useLiveAggregates.
 */
export default async function HomePage() {
  const [home, profile] = await Promise.all([
    getRankedHomeData(),
    getUserProfile(),
  ]);

  // v0.7 step 4 — wizard is the front door. If it hasn't been completed,
  // bounce there. The /wizard route handles its own "already done" redirect
  // back home in the replay=1 case so this stays one-directional in normal
  // flow.
  if (!profile?.wizardCompletedAt) redirect("/wizard");

  const firstName = profile?.displayName?.split(" ")[0] || null;

  const pool = (quotes as unknown as Quotes).welcomeBack ?? [];
  const welcomeLine =
    pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : "";

  const ageDays =
    home.oldestScoreAt === null
      ? null
      : Math.floor(
          (Date.now() - new Date(home.oldestScoreAt).getTime()) /
            (24 * 60 * 60 * 1000),
        );

  return (
    <SiteShell>
      <CoachmarkOnboarding
        onboardedAt={
          profile?.onboardedAt ? profile.onboardedAt.toISOString() : null
        }
        firstName={firstName}
      />
      <WelcomeCard
        welcomeLine={welcomeLine}
        oldestScoreAt={home.oldestScoreAt}
        ageDays={ageDays}
        companyIds={home.companies.map((c) => c.id)}
      />
      <RankedTable
        companies={home.companies}
        frames={home.frames}
        scores={home.scores}
        activity={home.activity}
        frameWeights={home.frameWeights}
      />
    </SiteShell>
  );
}
