"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TagChip } from "@/components/tag-chip";

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

export function TrackerTable({ companies }: { companies: TrackerCompany[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("tier");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const copy = [...companies];
    copy.sort((a, b) => cmp(a, b, sortKey, sortDir));
    return copy;
  }, [companies, sortKey, sortDir]);

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "openRoles" || key === "latestPub" ? "desc" : "asc");
    }
  }

  return (
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
        <p className="serif text-base text-muted px-3 py-6">No companies.</p>
      )}
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
