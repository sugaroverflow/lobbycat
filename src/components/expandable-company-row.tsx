"use client";

import Link from "next/link";
import { useState } from "react";
import { TagChip } from "@/components/tag-chip";

type RowCompany = {
  id: number;
  slug: string;
  name: string;
  hq: string | null;
  description: string | null;
  tier: number;
  openRoles: number;
  tagList: Array<{ label: string; color: string | null }>;
  openRolesList: Array<{
    id: number;
    title: string;
    url: string;
    department: string | null;
    location: string | null;
  }>;
  recentPublications: Array<{
    id: number;
    title: string;
    url: string;
    type: string;
    publishedAt: Date | string | null;
  }>;
  scores: Array<{
    frameId: number;
    frameName: string;
    lowLabel: string | null;
    highLabel: string | null;
    score: number | null;
  }>;
};

export function ExpandableCompanyList({ companies }: { companies: RowCompany[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <ul className="divide-y divide-rule">
      {companies.map((c) => (
        <CompanyRow
          key={c.id}
          company={c}
          isOpen={openId === c.id}
          onToggle={() => setOpenId(openId === c.id ? null : c.id)}
        />
      ))}
    </ul>
  );
}

function CompanyRow({
  company: c,
  isOpen,
  onToggle,
}: {
  company: RowCompany;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group block w-full text-left py-5 hover:bg-surface-sunk -mx-3 px-3 rounded transition"
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
          <div className="text-right shrink-0 mono text-xs uppercase tracking-[0.12em] text-whisper flex flex-col items-end gap-1">
            {c.openRoles > 0 ? (
              <span className="text-warm">
                {c.openRoles} open role{c.openRoles === 1 ? "" : "s"}
              </span>
            ) : (
              <span>no roles tracked</span>
            )}
            <span className="text-whisper" aria-hidden>
              {isOpen ? "− collapse" : "+ expand"}
            </span>
          </div>
        </div>
      </button>

      {isOpen && <ExpandedDetail company={c} />}
    </li>
  );
}

function ExpandedDetail({ company: c }: { company: RowCompany }) {
  const scored = c.scores.filter((s) => s.score !== null);
  return (
    <div className="-mx-3 px-3 pb-6 pt-1">
      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6 border-t border-rule pt-5">
        <Section title="Open roles">
          {c.openRolesList.length === 0 ? (
            <p className="serif text-sm text-whisper">No open roles tracked.</p>
          ) : (
            <ul className="space-y-2">
              {c.openRolesList.map((r) => (
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
          {c.recentPublications.length === 0 ? (
            <p className="serif text-sm text-whisper">
              No publications tracked yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {c.recentPublications.map((p) => (
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
                <div key={s.frameId} className="flex items-baseline justify-between gap-3">
                  <dt className="serif text-muted truncate" title={s.frameName}>
                    {s.frameName}
                  </dt>
                  <dd className="mono text-ink shrink-0">{s.score}/5</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}
      </div>

      <div className="mt-5">
        <Link
          href={`/companies/${c.slug}`}
          className="mono text-[0.65rem] uppercase tracking-[0.12em] text-accent hover:underline"
        >
          Open full view →
        </Link>
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
