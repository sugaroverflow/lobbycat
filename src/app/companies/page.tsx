import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { TagChip } from "@/components/tag-chip";
import { getCompaniesWithTags, getUserProfile } from "@/lib/queries";

const TIER_LABEL: Record<number, string> = {
  1: "Top focus",
  2: "Serious",
  3: "On radar",
};

export default async function CompaniesPage() {
  const [cos, profile] = await Promise.all([
    getCompaniesWithTags(),
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
          {cos.length} companies, sorted by tier and name. The map on the
          home page is the same set seen through your frames; this page is
          the long view.
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
            <ul className="divide-y divide-rule">
              {byTier.get(tier)?.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/companies/${c.slug}`}
                    className="group block py-5 hover:bg-surface-sunk -mx-3 px-3 rounded transition"
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <h3 className="serif text-2xl font-medium text-ink tracking-tight">
                            {c.name}
                          </h3>
                          {c.hq && (
                            <span className="mono text-xs text-whisper uppercase tracking-[0.1em]">
                              {c.hq}
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="serif text-base text-muted leading-relaxed mt-2 max-w-3xl">
                            {c.description}
                          </p>
                        )}
                        {c.tagList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {c.tagList.map((t) => (
                              <TagChip key={t.label} label={t.label} color={t.color} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 mono text-xs uppercase tracking-[0.12em] text-whisper">
                        {c.openRoles > 0 ? (
                          <span className="text-warm">
                            {c.openRoles} open role{c.openRoles === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span>no roles tracked</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </SiteShell>
  );
}
