"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useLiveAggregates,
  type FrameScoreSnapshot,
} from "@/lib/scoring/useLiveAggregates";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";

type RankedCompany = {
  id: number;
  slug: string;
  name: string;
  hq: string | null;
  description: string | null;
};

type RankedFrame = {
  id: number;
  name: string;
  sortIndex: number;
  lowLabel: string | null;
  highLabel: string | null;
};

type ActivityBucket = { pub: number; role: number };
type ActivityRow = { companyId: number; buckets: ActivityBucket[] };

type Props = {
  companies: RankedCompany[];
  frames: RankedFrame[];
  scores: FrameScoreSnapshot[];
  activity: ActivityRow[];
  frameWeights: Record<string, FrameWeightLevel>;
};

type SortKey = "overall" | "name" | number; // frame id for frame columns
type SortDir = "asc" | "desc";

const WEIGHT_GLYPH: Record<FrameWeightLevel, string> = {
  low: "L",
  medium: "M",
  high: "H",
};

function formatOverall(n: number | null): string {
  return n === null ? "—" : n.toFixed(1);
}

function formatFrame(n: number | null | undefined): string {
  return n === null || n === undefined ? "·" : n.toFixed(1);
}

export function RankedTable({
  companies,
  frames,
  scores,
  activity,
  frameWeights,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const aggregates = useLiveAggregates(scores, frameWeights);
  const aggMap = useMemo(() => {
    const m = new Map<number, (typeof aggregates)[number]>();
    for (const a of aggregates) m.set(a.companyId, a);
    return m;
  }, [aggregates]);

  const scoreLookup = useMemo(() => {
    const m = new Map<string, number | null>();
    for (const s of scores) m.set(`${s.companyId}:${s.frameId}`, s.score);
    return m;
  }, [scores]);

  const activityMap = useMemo(() => {
    const m = new Map<number, ActivityBucket[]>();
    for (const a of activity) m.set(a.companyId, a.buckets);
    return m;
  }, [activity]);

  const sorted = useMemo(() => {
    const arr = [...companies];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortKey === "overall") {
        const oa = aggMap.get(a.id)?.overall ?? null;
        const ob = aggMap.get(b.id)?.overall ?? null;
        if (oa === ob) cmp = 0;
        else if (oa === null) cmp = 1;
        else if (ob === null) cmp = -1;
        else cmp = oa - ob;
      } else {
        const sa = scoreLookup.get(`${a.id}:${sortKey}`) ?? null;
        const sb = scoreLookup.get(`${b.id}:${sortKey}`) ?? null;
        if (sa === sb) cmp = 0;
        else if (sa === null) cmp = 1;
        else if (sb === null) cmp = -1;
        else cmp = sa - sb;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [companies, sortKey, sortDir, aggMap, scoreLookup]);

  const clickHeader = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  };

  const sortIndicator = (k: SortKey) => {
    if (k !== sortKey) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <section className="max-w-[72rem] mx-auto px-6 pb-20">
      <div className="overflow-x-auto border border-rule rounded-sm">
        <table className="w-full text-sm" data-testid="ranked-table">
          <thead className="bg-panel-raised">
            <tr className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <th
                scope="col"
                className="text-left px-3 py-2 cursor-pointer select-none"
                onClick={() => clickHeader("name")}
              >
                Company{sortIndicator("name")}
              </th>
              <th
                scope="col"
                className="text-right px-3 py-2 cursor-pointer select-none"
                onClick={() => clickHeader("overall")}
                title="Weighted aggregate across frames"
              >
                Overall{sortIndicator("overall")}
              </th>
              {frames.map((f) => {
                const w =
                  frameWeights[String(f.id)] ?? ("medium" as FrameWeightLevel);
                return (
                  <th
                    key={f.id}
                    scope="col"
                    className="text-right px-2 py-2 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => clickHeader(f.id)}
                    title={`${f.name} — weight ${w}`}
                  >
                    <span>{f.name}</span>
                    <span className="ml-1 text-whisper">
                      [{WEIGHT_GLYPH[w]}]
                    </span>
                    {sortIndicator(f.id)}
                  </th>
                );
              })}
              <th
                scope="col"
                className="text-left px-3 py-2"
                title="Publications + roles in the last 90 days"
              >
                Recent
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const agg = aggMap.get(c.id);
              const buckets = activityMap.get(c.id) ?? [];
              return (
                <tr
                  key={c.id}
                  className="border-t border-rule hover:bg-panel-raised/40 transition-colors"
                >
                  <td className="px-3 py-2 align-middle">
                    <Link
                      href={`/companies/${c.slug}`}
                      className="serif text-ink hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.hq ? (
                      <span className="ml-2 mono text-[10px] uppercase tracking-[0.14em] text-whisper">
                        {c.hq}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span
                      className="serif text-ink"
                      title={
                        agg
                          ? `Coverage: ${agg.coverage} / ${frames.length} frames scored`
                          : undefined
                      }
                    >
                      {formatOverall(agg?.overall ?? null)}
                    </span>
                  </td>
                  {frames.map((f) => {
                    const s = scoreLookup.get(`${c.id}:${f.id}`);
                    return (
                      <td
                        key={f.id}
                        className="px-2 py-2 text-right tabular-nums text-muted"
                      >
                        {formatFrame(s)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    <ActivityDots buckets={buckets} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mono text-[10px] uppercase tracking-[0.14em] text-whisper pt-3">
        {companies.length} companies · weights live on{" "}
        <Link href="/frames" className="underline hover:text-ink">
          Frames
        </Link>
      </p>
    </section>
  );
}

function ActivityDots({ buckets }: { buckets: ActivityBucket[] }) {
  if (buckets.length === 0) {
    return <span className="text-whisper">·</span>;
  }
  return (
    <div
      className="flex items-center gap-[2px]"
      aria-label="Recent activity (last 90 days)"
    >
      {buckets.map((b, i) => {
        const total = b.pub + b.role;
        if (total === 0) {
          return (
            <span
              key={i}
              className="block w-[6px] h-[6px] rounded-full bg-[var(--rule)]"
            />
          );
        }
        if (b.pub > 0 && b.role > 0) {
          return (
            <span
              key={i}
              className="block w-[6px] h-[6px] rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, var(--readout-cyan) 50%, var(--signal-coral) 50%)",
              }}
            />
          );
        }
        return (
          <span
            key={i}
            className="block w-[6px] h-[6px] rounded-full"
            style={{
              background:
                b.pub > 0 ? "var(--readout-cyan)" : "var(--signal-coral)",
            }}
          />
        );
      })}
    </div>
  );
}
