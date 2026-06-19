import { SiteShell } from "@/components/site-shell";
import { ExpandableCompanyList } from "@/components/expandable-company-row";
import {
  getCompaniesWithExpandableDetails,
  getUserProfile,
} from "@/lib/queries";

const TIER_LABEL: Record<number, string> = {
  1: "Top focus",
  2: "Serious",
  3: "On radar",
};

export default async function CompaniesPage() {
  const [cos, profile] = await Promise.all([
    getCompaniesWithExpandableDetails(),
    getUserProfile(),
  ]);
  const firstName = profile?.displayName?.split(" ")[0] || null;
  const byTier = new Map<number, typeof cos>();
  for (const c of cos) {
    const list = byTier.get(c.tier) || [];
    list.push(c);
    byTier.set(c.tier, list);
  }
  const tiers = [1, 2, 3].filter((t) => byTier.has(t));

  return (
    <SiteShell>
      <section className="max-w-[64rem] mx-auto px-6 pt-16 pb-12">
        <div className="eyebrow mb-6">
          {firstName ? `${firstName} · Companies` : "Companies"}
        </div>
        <h1 className="serif text-4xl sm:text-5xl font-medium leading-[1.05] tracking-tight text-ink">
          The full tier list.
        </h1>
        <p className="serif mt-6 max-w-2xl text-lg text-muted leading-relaxed">
          {cos.length} companies, sorted by tier and name. Click a row to
          expand it inline — roles, recent publications, and frame scores
          without leaving the page. The map on the home page is the same
          set seen through your frames.
        </p>
      </section>

      <section className="max-w-[64rem] mx-auto px-6 pb-24">
        {tiers.map((tier) => (
          <div key={tier} className="mb-14">
            <div className="flex items-baseline justify-between border-b border-rule pb-2 mb-4">
              <h2 className="eyebrow">
                Tier {tier} &middot; {TIER_LABEL[tier]}
              </h2>
              <span className="mono text-xs text-whisper">
                {byTier.get(tier)?.length}
              </span>
            </div>
            <ExpandableCompanyList companies={byTier.get(tier) || []} />
          </div>
        ))}
      </section>
    </SiteShell>
  );
}
