"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TagChip } from "@/components/tag-chip";
import { FilterChip, FilterRowLabel } from "@/components/filter-chip";

export type TrackerCompany = {
  id: number;
  slug: string;
  name: string;
  tier: number;
  hq: string | null;
  tagList: Array<{ label: string; color: string | null }>;
  openRoles: number;
  latestPub: {
    title: string;
    url: string;
    type: string;
    publishedAt: Date | string | null;
  } | null;
};

type SortKey = "name" | "tier" | "hq" | "openRoles" | "latestPub";
type SortDir = "asc" | "desc";

const TIER_LABEL: Record<number, string> = {
  1: "Top focus",
  2: "Serious",
  3: "On radar",
};

const TIER_TEXT: Record<number, string> = {
  1: "text-terracotta",
  2: "text-ochre",
  3: "text-mushroom",
};

const TIER_FILL: Record<number, string> = {
  1: "var(--color-terracotta)",
  2: "var(--color-ochre)",
  3: "var(--color-mushroom)",
};

type StatusKey = "hiring" | "quiet";

export function TrackerTable({ companies }: { companies: TrackerCompany[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("tier");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [tierFilter, setTierFilter] = useState<Set<number>>(new Set());
  const [hqFilter, setHqFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<StatusKey>>(new Set());

  const hqOptions = useMemo(() => {
    const s = new Set<string>();
    for (const c of companies) if (c.hq) s.add(c.hq);
    return [...s].sort();
  }, [companies]);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of companies) {
      for (const t of c.tagList) counts.set(t.label, (counts.get(t.label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([l]) => l);
  }, [companies]);

  const passesFilters = (c: TrackerCompany) => {
    if (tierFilter.size > 0 && !tierFilter.has(c.tier)) return false;
    if (hqFilter.size > 0 && (!c.hq || !hqFilter.has(c.hq))) return false;
    if (tagFilter.size > 0) {
      const labels = new Set(c.tagList.map((t) => t.label));
      let any = false;
      for (const t of tagFilter) if (labels.has(t)) { any = true; break; }
      if (!any) return false;
    }
    if (statusFilter.size > 0) {
      const isHiring = c.openRoles > 0;
      const matchesHiring = statusFilter.has("hiring") && isHiring;
      const matchesQuiet = statusFilter.has("quiet") && !isHiring;
      if (!matchesHiring && !matchesQuiet) return false;
    }
    return true;
  };

  const filtered = useMemo(
    () => companies.filter(passesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companies, tierFilter, hqFilter, tagFilter, statusFilter],
  );

  const anyFilter =
    tierFilter.size > 0 ||
    hqFilter.size > 0 ||
    tagFilter.size > 0 ||
    statusFilter.size > 0;

  const clearAll = () => {
    setTierFilter(new Set());
    setHqFilter(new Set());
    setTagFilter(new Set());
    setStatusFilter(new Set());
  };

  const toggleIn = <T,>(s: Set<T>, setS: (s: Set<T>) => void, v: T) => {
    const next = new Set(s);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setS(next);
  };

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => cmp(a, b, sortKey, sortDir));
    return copy;
  }, [filtered, sortKey, sortDir]);

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "openRoles" || key === "latestPub" ? "desc" : "asc");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterRowLabel>Tier</FilterRowLabel>
          {[1, 2, 3].map((t) => (
            <FilterChip
              key={t}
              label={`${t} · ${TIER_LABEL[t]}`}
              active={tierFilter.has(t)}
              onClick={() => toggleIn(tierFilter, setTierFilter, t)}
              dotColor={TIER_FILL[t]}
            />
          ))}
          <span className="mono text-[0.6rem] uppercase tracking-[0.14em] text-whisper ml-3 mr-1">
            Status
          </span>
          <FilterChip
            label="hiring"
            active={statusFilter.has("hiring")}
            onClick={() => toggleIn(statusFilter, setStatusFilter, "hiring")}
          />
          <FilterChip
            label="quiet"
            active={statusFilter.has("quiet")}
            onClick={() => toggleIn(statusFilter, setStatusFilter, "quiet")}
          />
          {anyFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto mono text-[0.65rem] uppercase tracking-[0.12em] text-whisper hover:text-ink underline decoration-rule"
            >
              clear
            </button>
          )}
        </div>
        {hqOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <FilterRowLabel>HQ</FilterRowLabel>
            {hqOptions.map((h) => (
              <FilterChip
                key={h}
                label={h}
                active={hqFilter.has(h)}
                onClick={() => toggleIn(hqFilter, setHqFilter, h)}
              />
            ))}
          </div>
        )}
        {tagOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <FilterRowLabel>Tag</FilterRowLabel>
            {tagOptions.map((t) => (
              <FilterChip
                key={t}
                label={t}
                active={tagFilter.has(t)}
                onClick={() => toggleIn(tagFilter, setTagFilter, t)}
              />
            ))}
          </div>
        )}
        <div className="mono text-[0.65rem] uppercase tracking-[0.12em] text-whisper">
          Showing {sorted.length} of {companies.length}
        </div>
      </div>
      <div className="overflow-x-auto -mx-3">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-rule">
            <Th onClick={() => onSort("name")} active={sortKey === "name"} dir={sortDir}>
              Company
            </Th>
            <Th onClick={() => onSort("tier")} active={sortKey === "tier"} dir={sortDir}>
              Tier
            </Th>
            <Th onClick={() => onSort("hq")} active={sortKey === "hq"} dir={sortDir}>
              HQ
            </Th>
            <Th
              onClick={() => onSort("openRoles")}
              active={sortKey === "openRoles"}
              dir={sortDir}
              align="right"
            >
              Open roles
            </Th>
            <Th
              onClick={() => onSort("latestPub")}
              active={sortKey === "latestPub"}
              dir={sortDir}
            >
              Latest publication
            </Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => (
            <tr
              key={c.id}
              className={`border-b border-rule/60 ${
                i % 2 === 1 ? "bg-cream-dark/30" : ""
              } hover:bg-surface-sunk transition`}
            >
              <td className="px-3 py-3 align-top">
                <Link
                  href={`/companies/${c.slug}`}
                  className="serif text-base text-ink hover:underline decoration-rule"
                >
                  {c.name}
                </Link>
                {c.tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.tagList.slice(0, 4).map((t) => (
                      <TagChip key={t.label} label={t.label} color={t.color} />
                    ))}
                  </div>
                )}
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap">
                <span
                  className={`mono text-[0.7rem] uppercase tracking-[0.1em] ${
                    TIER_TEXT[c.tier] ?? "text-muted"
                  }`}
                >
                  {c.tier} · {TIER_LABEL[c.tier] ?? ""}
                </span>
              </td>
              <td className="px-3 py-3 align-top mono text-xs uppercase tracking-[0.1em] text-muted">
                {c.hq ?? "—"}
              </td>
              <td className="px-3 py-3 align-top text-right whitespace-nowrap">
                {c.openRoles > 0 ? (
                  <span className="mono text-xs uppercase tracking-[0.1em] text-warm">
                    {c.openRoles} open
                  </span>
                ) : (
                  <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
                    —
                  </span>
                )}
              </td>
              <td className="px-3 py-3 align-top">
                {c.latestPub ? (
                  <a
                    href={c.latestPub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group max-w-md"
                  >
                    <span className="serif text-sm text-ink group-hover:underline decoration-rule line-clamp-2">
                      {c.latestPub.title}
                    </span>
                    <span className="mono text-[0.65rem] uppercase tracking-[0.12em] text-whisper mt-0.5 inline-block">
                      {c.latestPub.type}
                      {c.latestPub.publishedAt
                        ? ` · ${formatDate(c.latestPub.publishedAt)}`
                        : ""}
                    </span>
                  </a>
                ) : (
                  <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
                    none tracked
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="serif text-base text-muted px-3 py-6">No companies match these filters.</p>
      )}
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
  align = "left",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-3 py-2 mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper font-normal ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-ink transition ${
          active ? "text-ink" : ""
        }`}
      >
        {children}
        <span aria-hidden className="inline-block w-2">
          {active ? (dir === "asc" ? "↑" : "↓") : ""}
        </span>
      </button>
    </th>
  );
}

function cmp(
  a: TrackerCompany,
  b: TrackerCompany,
  key: SortKey,
  dir: SortDir,
): number {
  const m = dir === "asc" ? 1 : -1;
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name) * m;
    case "tier": {
      if (a.tier !== b.tier) return (a.tier - b.tier) * m;
      return a.name.localeCompare(b.name);
    }
    case "hq": {
      const av = a.hq ?? "";
      const bv = b.hq ?? "";
      if (av === bv) return a.name.localeCompare(b.name);
      // empties always last
      if (!av) return 1;
      if (!bv) return -1;
      return av.localeCompare(bv) * m;
    }
    case "openRoles": {
      if (a.openRoles !== b.openRoles) return (a.openRoles - b.openRoles) * m;
      return a.name.localeCompare(b.name);
    }
    case "latestPub": {
      const at = pubTs(a.latestPub?.publishedAt ?? null);
      const bt = pubTs(b.latestPub?.publishedAt ?? null);
      if (at === bt) return a.name.localeCompare(b.name);
      // empties always last
      if (at === null) return 1;
      if (bt === null) return -1;
      return (at - bt) * m;
    }
  }
}

function pubTs(d: Date | string | null): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : null;
}

function formatDate(d: Date | string): string {
  const date = new Date(d);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
