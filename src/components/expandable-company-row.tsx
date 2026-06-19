"use client";

import { useState } from "react";
import { TagChip } from "@/components/tag-chip";
import { CompanyDrawer } from "@/components/company-drawer";

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

      {isOpen && (
        <div className="-mx-3 px-3 pb-6">
          <CompanyDrawer
            slug={c.slug}
            openRoles={c.openRolesList}
            recentPublications={c.recentPublications}
            scores={c.scores}
          />
        </div>
      )}
    </li>
  );
}
