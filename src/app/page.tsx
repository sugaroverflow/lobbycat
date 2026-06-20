import { SiteShell } from "@/components/site-shell";
import { MapView } from "@/components/map-view";
import { CoachmarkOnboarding } from "@/components/coachmark-onboarding";
import { getMapData, getUserProfile } from "@/lib/queries";

/**
 * v0.5 home — the Map is home (§3.2 of CONCEPT-v0.5).
 *
 * Surface scope deliberately narrow:
 *   - a single-sentence product line (quiet, not hero)
 *   - the Map plot itself (axis picker + companies)
 *   - (Surprise button + comic onboarding + first-home Surprise auto-open
 *      land in the Step 4 rebuild; this v0.5 chunk ships the Map-as-home
 *      collapse without the Surprise modal yet — see ASSUMPTIONS-v0.5.md)
 *
 * What's gone vs v0.4:
 *   - The "See the full tier list →" link (the /companies list page dies,
 *     §7.1).
 *   - The Live tracker section (the list view dies, §7.1).
 *   - The hero-weight heading (home is quiet; the Map is the editorial
 *     statement, §3.2).
 */
export default async function HomePage() {
  const [{ companies, scaleFrames }, profile] = await Promise.all([
    getMapData(),
    getUserProfile(),
  ]);
  const firstName = profile?.displayName?.split(" ")[0] || null;

  return (
    <SiteShell>
      <CoachmarkOnboarding
        onboardedAt={
          profile?.onboardedAt ? profile.onboardedAt.toISOString() : null
        }
        firstName={firstName}
      />
      <section className="max-w-[72rem] mx-auto px-6 pt-10 pb-4">
        <p className="prose-face text-sm text-[var(--fg-prose-muted)] max-w-2xl leading-relaxed">
          A curated map of London&rsquo;s AI-policy companies, organised across
          six frames — to scout the field, calibrate where each company sits,
          and (sometimes) prep before a meeting.
        </p>
      </section>

      <section className="max-w-[72rem] mx-auto px-6 pb-20">
        <MapView companies={companies} frames={scaleFrames} />
      </section>
    </SiteShell>
  );
}
