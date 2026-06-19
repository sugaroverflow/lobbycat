"use client";

import Link from "next/link";

export type DrawerRole = {
  id: number;
  title: string;
  url: string;
  department?: string | null;
  location?: string | null;
};

export type DrawerPublication = {
  id: number;
  title: string;
  url: string;
  type: string;
  publishedAt: Date | string | null;
};

export type DrawerScore = {
  frameId: number;
  frameName: string;
  score: number | null;
};

export type CompanyDrawerProps = {
  slug: string;
  openRoles: DrawerRole[];
  recentPublications: DrawerPublication[];
  scores: DrawerScore[];
  onClose?: () => void;
};

/**
 * Shared "expanded company detail" drawer used by both the /companies list
 * (inline-expand below a row) and the Map (drawer below the plot when a dot
 * is pinned). Keeps the surfaces in lockstep so a single change to roles /
 * publications / frame-score layout flows everywhere.
 */
export function CompanyDrawer({
  slug,
  openRoles,
  recentPublications,
  scores,
  onClose,
}: CompanyDrawerProps) {
  const scored = scores.filter((s) => s.score !== null);
  return (
    <div className="pb-2 pt-1">
      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6 border-t border-rule pt-5">
        <Section title="Open roles">
          {openRoles.length === 0 ? (
            <p className="serif text-sm text-whisper">No open roles tracked.</p>
          ) : (
            <ul className="space-y-2">
              {openRoles.map((r) => (
                <li key={r.id} className="text-sm leading-snug">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="serif text-ink hover:underline decoration-rule"
                  >
                    {r.title}
                  </a>
                  {(r.department || r.location) && (
                    <div className="mono text-[0.65rem] uppercase tracking-[0.1em] text-whisper">
                      {[r.department, r.location].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent publications">
          {recentPublications.length === 0 ? (
            <p className="serif text-sm text-whisper">
              No publications tracked yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentPublications.map((p) => (
                <li key={p.id} className="text-sm leading-snug">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="serif text-ink hover:underline decoration-rule"
                  >
                    {p.title}
                  </a>
                  <div className="mono text-[0.65rem] uppercase tracking-[0.1em] text-whisper">
                    {p.type}
                    {p.publishedAt &&
                      ` · ${new Date(p.publishedAt).toISOString().slice(0, 10)}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {scored.length > 0 && (
          <Section title="Frame scores" wide>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {scored.map((s) => (
                <div
                  key={s.frameId}
                  className="flex items-baseline justify-between gap-3"
                >
                  <dt
                    className="serif text-muted truncate"
                    title={s.frameName}
                  >
                    {s.frameName}
                  </dt>
                  <dd className="mono text-ink shrink-0">{s.score}/5</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Link
          href={`/companies/${slug}`}
          className="mono text-[0.65rem] uppercase tracking-[0.12em] text-accent hover:underline"
        >
          Open full view →
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mono text-[0.65rem] uppercase tracking-[0.12em] text-whisper hover:text-ink"
          >
            close
          </button>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="eyebrow text-[0.6rem] mb-2">{title}</div>
      {children}
    </div>
  );
}
