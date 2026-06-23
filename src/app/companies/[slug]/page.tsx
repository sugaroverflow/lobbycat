import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { TagChip } from "@/components/tag-chip";
import { FrameScorer } from "@/components/frame-scorer";
import { NotesEditor } from "@/components/notes-editor";
import { FitNotePanel } from "@/components/fit-note-panel";
import { getCompanyBySlug } from "@/lib/queries";

const TIER_LABEL: Record<number, string> = {
  1: "Top focus",
  2: "Serious",
  3: "On radar",
};

export default async function CompanyDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCompanyBySlug(slug);
  if (!data) notFound();

  const { company, roles, people, publications, tags, frames, fitNote, fitNoteThread, note } = data;

  return (
    <SiteShell>
      <article className="max-w-[64rem] mx-auto px-6 pt-12 pb-24">
        <div className="mb-8">
          <Link href="/" className="mono text-xs uppercase tracking-[0.14em] text-whisper hover:text-ink">
            ← Index
          </Link>
        </div>

        <header className="mb-12">
          <div className="eyebrow mb-3">
            Tier {company.tier} · {TIER_LABEL[company.tier]}
            {company.hq && ` · ${company.hq}`}
          </div>
          <h1 className="serif text-5xl sm:text-6xl font-medium leading-[1] tracking-tight text-ink">
            {company.name}
          </h1>
          {company.description && (
            <p className="serif mt-6 max-w-3xl text-lg text-muted leading-relaxed">
              {company.description}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-5">
            {tags.map((t) => (
              <TagChip key={t.id} label={t.label} color={t.color} />
            ))}
          </div>
          <div className="flex items-center gap-5 mt-6 mono text-xs uppercase tracking-[0.12em]">
            {company.websiteUrl && (
              <a href={company.websiteUrl} target="_blank" rel="noopener" className="text-accent hover:underline">
                website ↗
              </a>
            )}
            {company.careersUrl && (
              <a href={company.careersUrl} target="_blank" rel="noopener" className="text-accent hover:underline">
                careers ↗
              </a>
            )}
            {company.policyPageUrl && (
              <a href={company.policyPageUrl} target="_blank" rel="noopener" className="text-accent hover:underline">
                policy ↗
              </a>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="eyebrow mb-4 pb-2 border-b border-rule">Open roles ({roles.filter((r) => r.isOpen).length})</h2>
              {roles.filter((r) => r.isOpen).length === 0 ? (
                <p className="serif text-base text-muted">No roles tracked yet.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  {roles
                    .filter((r) => r.isOpen)
                    .map((r) => (
                      <li key={r.id} className="py-4">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener"
                          className="serif text-lg text-ink hover:underline"
                        >
                          {r.title}
                        </a>
                        <div className="mono text-xs uppercase tracking-[0.1em] text-whisper mt-1">
                          {r.location || "location TBC"}
                          {r.source && ` · via ${r.source}`}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="eyebrow mb-4 pb-2 border-b border-rule">Frames</h2>
              <div className="divide-y divide-rule">
                {frames.map((f) => (
                  <FrameScorer key={f.id} companyId={company.id} frame={f} />
                ))}
              </div>
            </section>

            <section>
              <NotesEditor companyId={company.id} initial={note?.body ?? null} />
            </section>

            {people.length > 0 && (
              <section>
                <h2 className="eyebrow mb-4 pb-2 border-b border-rule">Policy team</h2>
                <ul className="divide-y divide-rule">
                  {people.map((p) => (
                    <li key={p.id} className="py-3">
                      <div className="serif text-base text-ink">{p.name}</div>
                      <div className="mono text-xs text-whisper">{p.role}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {publications.length > 0 && (
              <section>
                <h2 className="eyebrow mb-4 pb-2 border-b border-rule">Recent publications</h2>
                <ul className="divide-y divide-rule">
                  {publications.map((p) => (
                    <li key={p.id} className="py-3">
                      <a href={p.url} target="_blank" rel="noopener" className="serif text-base text-ink hover:underline">
                        {p.title}
                      </a>
                      <div className="mono text-xs text-whisper mt-1">
                        {p.type}
                        {p.publishedAt &&
                          ` · ${new Date(p.publishedAt).toLocaleDateString("en-GB")}`}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <FitNotePanel companyId={company.id} fitNote={fitNote} thread={fitNoteThread} />
          </aside>
        </div>
      </article>
    </SiteShell>
  );
}
