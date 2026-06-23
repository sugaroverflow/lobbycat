"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useLiveAggregates,
  type FrameScoreSnapshot,
} from "@/lib/scoring/useLiveAggregates";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";

/* ---------- shapes ----------------------------------------------------- */

type Company = {
  id: number;
  slug: string;
  name: string;
  hq: string | null;
  description: string | null;
};

type Frame = {
  id: number;
  name: string;
  sortIndex: number;
  lowLabel: string | null;
  highLabel: string | null;
};

type Pub = {
  id: number;
  title: string;
  url: string;
  type: string | null;
  publishedAt: string | null;
};

type Role = {
  id: number;
  title: string;
  url: string;
  department: string | null;
  location: string | null;
  seenAt: string | null;
};

type LatestEvent =
  | {
      kind: "publication" | "role";
      title: string;
      url: string;
      at: string | null;
    }
  | null;

type Detail = {
  companyId: number;
  recentPublications: Pub[];
  openRoles: Role[];
  openRoleCount: number;
  isHiring: boolean | null;
  hasFitNote: boolean;
  latestEvent: LatestEvent;
};

type Props = {
  companies: Company[];
  frames: Frame[];
  scores: FrameScoreSnapshot[];
  details: Detail[];
  frameWeights: Record<string, FrameWeightLevel>;
};

/* ---------- helpers ---------------------------------------------------- */

function fmtOverall(n: number | null): string {
  return n === null ? "—" : n.toFixed(1);
}

function fmtAgo(iso: string | null): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const days = Math.max(0, Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000)));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1mo ago" : `${months}mo ago`;
}

function pubIcon(type: string | null): string {
  switch (type) {
    case "press":
    case "news":
      return "📰";
    case "research":
    case "paper":
      return "📄";
    case "blog":
      return "✍️";
    case "podcast":
      return "🎙";
    default:
      return "📄";
  }
}

/* ---------- score bar -------------------------------------------------- */

function ScoreBar({
  frame,
  score,
  weight,
}: {
  frame: Frame;
  score: number | null | undefined;
  weight: FrameWeightLevel;
}) {
  const pct = score === null || score === undefined ? 0 : (score / 5) * 100;
  const dim = score === null || score === undefined;
  const weightGlyph =
    weight === "high" ? "M" : weight === "medium" ? "S" : "C";
  return (
    <div
      className="flex items-center gap-2 min-w-0"
      title={`${frame.name} — weight ${weightGlyph === "M" ? "Must" : weightGlyph === "S" ? "Should" : "Could"}`}
    >
      <span
        className="mono text-[10px] uppercase tracking-[0.12em] text-readout truncate"
        style={{ flex: "1 1 0" }}
      >
        {frame.name}
        <span className="ml-1 text-whisper">[{weightGlyph}]</span>
      </span>
      <span
        className="relative inline-block h-[6px] rounded-sm overflow-hidden"
        style={{
          width: "80px",
          background: "var(--bg-panel-sunk)",
          boxShadow: "inset 0 0 0 1px var(--rule)",
        }}
        aria-hidden
      >
        <span
          className="absolute inset-y-0 left-0 transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: dim
              ? "var(--rule)"
              : "var(--vw-accent-bar)",
          }}
        />
      </span>
      <span className="mono text-xs tabular-nums text-ink w-7 text-right">
        {dim ? "·" : score!.toFixed(1)}
      </span>
    </div>
  );
}

/* ---------- hiring badge ---------------------------------------------- */

function HiringBadge({ isHiring }: { isHiring: boolean | null }) {
  if (isHiring === true) {
    return (
      <span
        className="mono text-[10px] uppercase tracking-[0.16em] px-2 py-[3px] rounded-sm"
        style={{
          color: "var(--accent-action)",
          border: "1px solid var(--accent-action)",
          background: "rgb(255 0 255 / 0.06)",
          boxShadow: "var(--vw-glow-magenta)",
        }}
      >
        ● Hiring
      </span>
    );
  }
  if (isHiring === false) {
    return (
      <span className="mono text-[10px] uppercase tracking-[0.16em] px-2 py-[3px] text-whisper">
        Not hiring
      </span>
    );
  }
  return (
    <span className="mono text-[10px] uppercase tracking-[0.16em] px-2 py-[3px] text-whisper">
      Hiring · unknown
    </span>
  );
}

/* ---------- card ------------------------------------------------------- */

function CompanyCard({
  company: c,
  frames,
  scoreLookup,
  weights,
  detail,
  overall,
}: {
  company: Company;
  frames: Frame[];
  scoreLookup: Map<string, number | null>;
  weights: Record<string, FrameWeightLevel>;
  detail: Detail | undefined;
  overall: number | null;
}) {
  const [open, setOpen] = useState(false);

  const latest = detail?.latestEvent ?? null;
  const isHiring = detail?.isHiring ?? null;

  return (
    <article
      className="relative"
      style={{
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--readout-cyan)",
        borderLeft: "1px solid var(--accent-action)",
        borderRight: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        borderRadius: "var(--radius-panel)",
      }}
      data-testid="dashboard-card"
      data-slug={c.slug}
    >
      {/* top strip — name + blurb + hiring badge */}
      <header className="px-5 pt-4 pb-3 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <Link
              href={`/companies/${c.slug}`}
              className="font-sans text-xl tracking-tight text-ink hover:text-readout transition-colors"
              style={{ fontWeight: 500 }}
            >
              {c.name}
            </Link>
            {c.hq && (
              <span className="mono text-[10px] uppercase tracking-[0.16em] text-whisper">
                {c.hq}
              </span>
            )}
          </div>
          {c.description && (
            <p className="mono text-sm text-muted leading-relaxed mt-1.5 max-w-2xl">
              {c.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <HiringBadge isHiring={isHiring} />
          <span
            className="mono text-[10px] uppercase tracking-[0.14em] text-whisper"
            title="Weighted aggregate across frames"
          >
            Overall{" "}
            <span className="text-readout text-xs tabular-nums">
              {fmtOverall(overall)}
            </span>
          </span>
        </div>
      </header>

      {/* scores — 6 frame bars, 2 columns */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 px-5 py-3"
        style={{
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
          background: "var(--bg-panel-sunk)",
        }}
      >
        {frames.map((f) => (
          <ScoreBar
            key={f.id}
            frame={f}
            score={scoreLookup.get(`${c.id}:${f.id}`) ?? null}
            weight={(weights[String(f.id)] ?? "medium") as FrameWeightLevel}
          />
        ))}
      </div>

      {/* latest + show-more toggle */}
      <div className="px-5 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {latest ? (
            <p className="mono text-xs text-muted truncate">
              <span className="text-whisper uppercase tracking-[0.14em] mr-2">
                Latest
              </span>
              <span aria-hidden className="mr-1">
                {latest.kind === "publication" ? pubIcon(null) : "🛠"}
              </span>
              <a
                href={latest.url}
                target="_blank"
                rel="noreferrer"
                className="text-ink hover:text-readout underline decoration-dotted underline-offset-4"
              >
                {latest.title}
              </a>
              <span className="ml-2 text-whisper">{fmtAgo(latest.at)}</span>
            </p>
          ) : (
            <p className="mono text-xs text-whisper italic">
              No recent activity tracked.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mono text-[10px] uppercase tracking-[0.16em] px-2 py-1 rounded-sm transition-colors shrink-0"
          style={{
            color: open ? "var(--readout-cyan)" : "var(--fg-prose-muted)",
            border: "1px solid var(--rule)",
          }}
        >
          {open ? "Show less ↑" : "Show more ↓"}
        </button>
      </div>

      {/* expanded reveal */}
      {open && detail && (
        <div
          className="px-5 pb-5 pt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"
          style={{ borderTop: "1px solid var(--rule)" }}
        >
          <section>
            <h4 className="mono text-[10px] uppercase tracking-[0.18em] text-readout mb-2">
              Recent publications
              <span className="text-whisper ml-2">(last 6mo)</span>
            </h4>
            {detail.recentPublications.length === 0 ? (
              <p className="mono text-xs text-whisper italic">
                None tracked in the last 6 months.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {detail.recentPublications.map((p) => (
                  <li
                    key={p.id}
                    className="mono text-xs text-muted leading-relaxed"
                  >
                    <span aria-hidden className="mr-1">
                      {pubIcon(p.type)}
                    </span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink hover:text-readout underline decoration-dotted underline-offset-4"
                    >
                      {p.title}
                    </a>
                    <span className="ml-2 text-whisper">
                      {fmtAgo(p.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="mono text-[10px] uppercase tracking-[0.18em] text-readout mb-2">
              Open roles
              {detail.openRoleCount > 0 && (
                <span className="text-whisper ml-2">
                  ({detail.openRoleCount})
                </span>
              )}
            </h4>
            {detail.openRoles.length === 0 ? (
              <p className="mono text-xs text-whisper italic">
                No open roles tracked.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {detail.openRoles.map((r) => (
                  <li
                    key={r.id}
                    className="mono text-xs text-muted leading-relaxed"
                  >
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink hover:text-readout underline decoration-dotted underline-offset-4"
                    >
                      {r.title}
                    </a>
                    {(r.department || r.location) && (
                      <span className="ml-2 text-whisper">
                        {[r.department, r.location].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="md:col-span-2 flex items-center gap-4 pt-1 flex-wrap">
            <Link
              href={`/companies/${c.slug}`}
              className="mono text-xs uppercase tracking-[0.16em] px-3 py-1.5 rounded-sm"
              style={{
                color: "var(--readout-cyan)",
                border: "1px solid var(--readout-cyan)",
                background: "rgb(0 255 255 / 0.04)",
              }}
            >
              Fit-note + notes →
            </Link>
            {detail.hasFitNote && (
              <span className="mono text-[10px] uppercase tracking-[0.16em] text-readout">
                ✦ Fit-note ready
              </span>
            )}
            <Link
              href={`/companies/${c.slug}#notes`}
              className="mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-readout underline decoration-dotted underline-offset-4"
            >
              Leave a note
            </Link>
          </section>
        </div>
      )}
    </article>
  );
}

/* ---------- list ------------------------------------------------------- */

export function DashboardCards({
  companies,
  frames,
  scores,
  details,
  frameWeights,
}: Props) {
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

  const detailMap = useMemo(() => {
    const m = new Map<number, Detail>();
    for (const d of details) m.set(d.companyId, d);
    return m;
  }, [details]);

  // Default sort: overall desc, nulls last. Step 7 wires a real toolbar.
  const sorted = useMemo(() => {
    const arr = [...companies];
    arr.sort((a, b) => {
      const oa = aggMap.get(a.id)?.overall ?? null;
      const ob = aggMap.get(b.id)?.overall ?? null;
      if (oa === ob) return a.name.localeCompare(b.name);
      if (oa === null) return 1;
      if (ob === null) return -1;
      return ob - oa;
    });
    return arr;
  }, [companies, aggMap]);

  return (
    <section
      className="max-w-[72rem] mx-auto px-6 pb-20 space-y-4"
      data-testid="dashboard-cards"
    >
      {sorted.map((c) => (
        <CompanyCard
          key={c.id}
          company={c}
          frames={frames}
          scoreLookup={scoreLookup}
          weights={frameWeights}
          detail={detailMap.get(c.id)}
          overall={aggMap.get(c.id)?.overall ?? null}
        />
      ))}
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-whisper pt-3">
        {companies.length} companies · weights live on{" "}
        <Link href="/frames" className="text-readout underline">
          Frames
        </Link>
      </p>
    </section>
  );
}
