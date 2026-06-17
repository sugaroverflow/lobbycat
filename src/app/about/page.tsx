import { SiteShell } from "@/components/site-shell";
import { getUserProfile } from "@/lib/queries";

export default async function AboutPage() {
  const profile = await getUserProfile();
  if (!profile) {
    return (
      <SiteShell>
        <section className="max-w-[42rem] mx-auto px-6 pt-12 pb-24">
          <p className="serif text-muted">No profile yet.</p>
        </section>
      </SiteShell>
    );
  }

  const concerns = (profile.concerns as string[]) || [];
  const weights = (profile.weights as Record<string, string>) || {};
  const sources = (profile.sources as string[]) || [];

  return (
    <SiteShell>
      <article className="max-w-[42rem] mx-auto px-6 pt-12 pb-24">
        <div className="mb-8">
          <a href="/" className="mono text-xs uppercase tracking-[0.14em] text-whisper hover:text-ink">
            ← Index
          </a>
        </div>
        <div className="eyebrow mb-4">The user</div>
        <h1 className="serif text-5xl font-medium text-ink tracking-tight leading-[1.05]">
          {profile.displayName}
        </h1>
        {profile.headline && (
          <p className="serif mt-5 text-xl text-muted leading-relaxed">
            {profile.headline}
          </p>
        )}

        {profile.bio && (
          <section className="mt-12">
            <h2 className="eyebrow mb-3 pb-2 border-b border-rule">Bio</h2>
            <p className="serif text-base text-body leading-relaxed">
              {profile.bio}
            </p>
          </section>
        )}

        {concerns.length > 0 && (
          <section className="mt-12">
            <h2 className="eyebrow mb-3 pb-2 border-b border-rule">
              Concerns while deciding
            </h2>
            <ul className="space-y-3">
              {concerns.map((c, i) => (
                <li
                  key={i}
                  className="serif text-base text-body leading-relaxed pl-4 border-l-2 border-rule-strong"
                >
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        {Object.keys(weights).length > 0 && (
          <section className="mt-12">
            <h2 className="eyebrow mb-3 pb-2 border-b border-rule">
              How he weights things
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {Object.entries(weights).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-rule pb-2">
                  <dt className="serif text-sm text-body">
                    {k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </dt>
                  <dd className="mono text-xs uppercase tracking-[0.12em] text-muted">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {sources.length > 0 && (
          <section className="mt-12">
            <h2 className="eyebrow mb-3 pb-2 border-b border-rule">Sources</h2>
            <ul className="mono text-xs text-whisper space-y-1">
              {sources.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="serif text-sm text-whisper mt-12 italic">
          Used by the lobbycat agent to ground every fit-note. Read it
          critically; tell the cat where it's wrong.
        </p>
      </article>
    </SiteShell>
  );
}
