import { SiteShell } from "@/components/site-shell";
import { db } from "@/db";
import { companies, frames as framesTable, frameScores } from "@/db/schema";
import { inArray } from "drizzle-orm";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>;
}) {
  const { slugs: slugsParam } = await searchParams;
  const slugs = slugsParam ? slugsParam.split(",").filter(Boolean) : [];

  const allCompanies = await db
    .select()
    .from(companies)
    .orderBy(companies.tier, companies.name);

  const selectedCompanies = slugs.length
    ? allCompanies.filter((c) => slugs.includes(c.slug))
    : [];

  const allFrames = await db
    .select()
    .from(framesTable)
    .orderBy(framesTable.sortIndex);

  const allScores = selectedCompanies.length
    ? await db
        .select()
        .from(frameScores)
        .where(
          inArray(
            frameScores.companyId,
            selectedCompanies.map((c) => c.id),
          ),
        )
    : [];

  const scoreFor = (companyId: number, frameId: number) =>
    allScores.find((s) => s.companyId === companyId && s.frameId === frameId);

  return (
    <SiteShell>
      <section className="max-w-[64rem] mx-auto px-6 pt-12 pb-12">
        <div className="eyebrow mb-3">Compare</div>
        <h1 className="serif text-4xl font-medium text-ink tracking-tight">
          Side-by-side on your frames
        </h1>
        <p className="serif mt-4 text-muted max-w-2xl">
          Pick 2–4 companies. The frames are yours; the scores are yours; what looks
          obvious in isolation may not be in comparison.
        </p>

        <form className="mt-8">
          <div className="eyebrow mb-2">Select companies</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allCompanies.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 mono text-xs text-muted hover:text-ink cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="slugs"
                  value={c.slug}
                  defaultChecked={slugs.includes(c.slug)}
                  className="accent-accent"
                />
                {c.name}
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="mt-4 mono text-xs uppercase tracking-[0.14em] px-4 py-2 bg-ink text-white rounded-sm hover:bg-accent transition"
          >
            Compare ↗
          </button>
          <script
            dangerouslySetInnerHTML={{
              __html: `document.currentScript.previousElementSibling.previousElementSibling.parentElement.addEventListener('submit', function(e){
                e.preventDefault();
                const f = e.target;
                const vals = Array.from(f.querySelectorAll('input[name="slugs"]:checked')).map(i=>i.value).join(',');
                window.location.href = '/compare' + (vals ? '?slugs=' + vals : '');
              });`,
            }}
          />
        </form>
      </section>

      {selectedCompanies.length > 0 && (
        <section className="max-w-[64rem] mx-auto px-6 pb-24">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left py-3 eyebrow w-56">Frame</th>
                {selectedCompanies.map((c) => (
                  <th
                    key={c.id}
                    className="text-left py-3 px-2 serif text-base text-ink"
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFrames.map((f) => (
                <tr key={f.id} className="border-b border-rule align-top">
                  <td className="py-4 pr-4">
                    <div className="serif text-sm text-ink">{f.name}</div>
                    <div className="mono text-[10px] text-whisper uppercase tracking-[0.1em]">
                      {f.lowLabel} → {f.highLabel}
                    </div>
                  </td>
                  {selectedCompanies.map((c) => {
                    const s = scoreFor(c.id, f.id);
                    return (
                      <td key={c.id} className="py-4 px-2">
                        {s ? (
                          <div>
                            <div className="mono text-base text-ink">
                              {s.score} <span className="text-whisper">/ {f.scale}</span>
                            </div>
                            {s.rationale && (
                              <div className="serif text-sm text-muted mt-1 leading-snug">
                                {s.rationale}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="mono text-xs text-whisper">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </SiteShell>
  );
}
