export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { DashboardCards } from "@/components/dashboard-cards";
import { getRankedHomeData, getUserProfile } from "@/lib/queries";

/**
 * v0.8.1 Phase B item 13 (F3.5) part 3/N — /favorites page.
 *
 * Renders the same DashboardCards used on home, but filtered to the
 * companies the user has starred (`company_favorites` table). We reuse
 * `getRankedHomeData()` and slice its arrays in-place rather than write
 * a parallel `getFavoritedCompanies()` query — this keeps the data shape
 * identical to home (so DashboardCards keeps working unchanged) and
 * eliminates the drift risk of two queries that have to stay in lockstep.
 * The toolbar (sort + hiring/open-role/fit-note filters) is still useful
 * here because favorites can grow into a meaningful list and you'll want
 * to narrow to "hiring" or "fit-note ready" within your starred set.
 *
 * Empty states split into two:
 *   - Zero favorites total → standalone vaporwave alert frame, skip
 *     DashboardCards entirely. Copy nudges the user to click ★ on a card.
 *   - Some favorites but the toolbar filters hide them all → DashboardCards'
 *     existing "No companies match these filters · Clear filters" branch.
 *
 * Wizard gate mirrors `/` and `/profile`: unwizarded users get bounced to
 * the wizard. No welcome card here; the page is a single-purpose lens.
 */
export default async function FavoritesPage() {
  const [home, profile] = await Promise.all([
    getRankedHomeData(),
    getUserProfile(),
  ]);

  if (!profile?.wizardCompletedAt) redirect("/wizard");

  const favSet = new Set(home.favoritedCompanyIds);
  const favCompanies = home.companies.filter((c) => favSet.has(c.id));
  const favScores = home.scores.filter((s) => favSet.has(s.companyId));
  const favDetails = home.details.filter((d) => favSet.has(d.companyId));

  // Standalone empty state — no favorites at all. Same vaporwave alert
  // frame as the welcome-back card (F2.2/F2.3) so the page reads as part
  // of the same dashboard family, not an off-brand placeholder.
  if (favCompanies.length === 0) {
    return (
      <SiteShell>
        <div className="max-w-[64rem] mx-auto px-6 py-8">
          <h1 className="font-sans text-2xl text-ink tracking-tight">Favorites</h1>
          <div
            className="mt-4 px-5 py-4"
            style={{
              background: "var(--card-interior-bg)",
              color: "var(--card-interior-text)",
              borderTop: "1px solid var(--readout-cyan)",
              borderLeft: "1px solid var(--accent-action)",
              borderRight: "1px solid var(--rule)",
              borderBottom: "1px solid var(--rule)",
              borderRadius: "var(--radius-panel)",
            }}
            data-testid="favorites-empty"
            aria-label="no favorites yet"
          >
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-readout pb-1">
              Nothing starred yet
            </p>
            <p className="prose-face text-sm text-card-interior-muted">
              Click the ★ on any card on the dashboard to add it here. Your
              favorites stay pinned across re-scores.
            </p>
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="max-w-[64rem] mx-auto px-6 pt-8">
        <h1 className="font-sans text-2xl text-ink tracking-tight">Favorites</h1>
      </div>
      <DashboardCards
        companies={favCompanies}
        frames={home.frames}
        scores={favScores}
        details={favDetails}
        frameWeights={home.frameWeights}
        favoritedCompanyIds={home.favoritedCompanyIds}
      />
    </SiteShell>
  );
}
