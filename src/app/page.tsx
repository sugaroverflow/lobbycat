export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { WelcomeCard } from "@/components/welcome-card";
import { DashboardCards } from "@/components/dashboard-cards";
import {
  getRankedHomeData,
  getUserProfile,
  recordHomeVisit,
} from "@/lib/queries";
import { buildWelcomeBack } from "@/lib/welcome-back";
import { buildWelcomeBackOffer } from "@/lib/clarify/welcome-back-offer";
import quotes from "@/db/lobbycat-quotes.json";

type Quotes = { welcomeBack: string[] };

/**
 * v0.6 home — welcome card + ranked table (§3.2 of REFACTOR-v0.6).
 *
 * The Map is gone. The home is the engine:
 *   - WelcomeCard rotates a `welcomeBack` quote (picked here on the server
 *     to keep the client render pure) and exposes a Re-score button when
 *     the oldest score is > 7d stale.
 *   - DashboardCards (v0.7 step 6) renders one stacked card per company:
 *     name + blurb + hiring badge, 6 frame score bars, the single newest
 *     event (“Latest:”), and a “show more” reveal for all recent pubs +
 *     open roles. Step 7 will add the filters/sorting toolbar above it.
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

  // v0.7 step 8 — welcome-back diff. We bump last_seen_at *after* reading
  // its previous value so the window start is the user's previous visit.
  const { previousLastSeen } = await recordHomeVisit();
  const welcomeBack = await buildWelcomeBack({
    prevLastSeen: previousLastSeen,
    companies: home.companies.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
    })),
    scores: home.scores,
    frameWeights: home.frameWeights,
    frames: home.frames,
  });

  // v0.8 step 8 — "is there drift worth a clarify?" Reads the welcome-back
  // diff + recent clarify_sessions to decide whether to offer a session.
  // Capped to once a week. Degrades to no-offer on any signal miss.
  const clarifyOffer = await buildWelcomeBackOffer({
    welcomeBack,
    companies: home.companies.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
    })),
    scores: home.scores,
    frameWeights: home.frameWeights,
    frames: home.frames,
  });

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
      <WelcomeCard
        welcomeLine={welcomeLine}
        oldestScoreAt={home.oldestScoreAt}
        ageDays={ageDays}
        companyIds={home.companies.map((c) => c.id)}
        firstName={firstName}
        welcomeBack={welcomeBack}
        clarifyOffer={clarifyOffer}
      />
      <DashboardCards
        companies={home.companies}
        frames={home.frames}
        scores={home.scores}
        details={home.details}
        frameWeights={home.frameWeights}
      />
    </SiteShell>
  );
}
