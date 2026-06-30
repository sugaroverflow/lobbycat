"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  useLiveAggregates,
  type FrameScoreSnapshot,
} from "@/lib/scoring/useLiveAggregates";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";
import { FavoriteStar } from "@/components/favorite-star";

/* ---------- shapes ----------------------------------------------------- */

type Company = {
  id: number;
  slug: string;
  name: string;
  hq: string | null;
  description: string | null;
  tier: number;
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

type NewsItem = {
  id: string;
  title: string;
  url: string;
  publishedAt: string | null;
};

type ControversyItem = {
  id: string;
  title: string;
  // v0.8.1 §F8.2 → Glyphie's controversies migration 0013 makes url
  // NOT NULL (a controversy without a source URL isn't actionable as
  // a signal). My v0.8.1 Phase C item 14 type was overcautious; relaxed
  // here to match the DB shape.
  url: string;
  surfacedAt: string | null;
};

type Detail = {
  companyId: number;
  recentPublications: Pub[];
  openRoles: Role[];
  openRoleCount: number;
  isHiring: boolean | null;
  hasFitNote: boolean;
  recentNews: NewsItem[];
  recentControversies: ControversyItem[];
  latestEvent: LatestEvent;
};

type Props = {
  companies: Company[];
  frames: Frame[];
  scores: FrameScoreSnapshot[];
  details: Detail[];
  frameWeights: Record<string, FrameWeightLevel>;
  // v0.8.1 Phase B item 13 (F3.5) — ids of starred companies. Presence in
  // this list == favorited. The set is built once on mount and the card's
  // own optimistic toggle takes over from there.
  favoritedCompanyIds: number[];
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
  // v0.8.3: removed the [M]/[S]/[C] weight glyph inline on each frame
  // label. It was opaque to users ("what is C?") and the dealbreaker/
  // important/nice-to-have vocab lives on /frames now. Weight still
  // influences the overall aggregate, just not surfaced per-bar.
  const weightLabel =
    weight === "high"
      ? "dealbreaker"
      : weight === "medium"
      ? "important"
      : "nice to have";
  return (
    <div
      className="flex items-center gap-1.5 min-w-0"
      title={`${frame.name} — ${weightLabel}`}
    >
      <span
        className="text-xs text-readout truncate"
        style={{ flex: "1 1 0" }}
      >
        {frame.name}
      </span>
      <span
        className="relative inline-block h-[6px] rounded-sm overflow-hidden"
        style={{
          width: "72px",
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
      <span className="text-xs px-2 py-[3px] text-card-interior-muted">
        Not hiring
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-[3px] text-card-interior-muted">
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
  initialFavorited,
}: {
  company: Company;
  frames: Frame[];
  scoreLookup: Map<string, number | null>;
  weights: Record<string, FrameWeightLevel>;
  detail: Detail | undefined;
  overall: number | null;
  initialFavorited: boolean;
}) {
  const [open, setOpen] = useState(false);

  const latest = detail?.latestEvent ?? null;
  const isHiring = detail?.isHiring ?? null;
  const hasOpenRoles = (detail?.openRoles.length ?? 0) > 0;

  return (
    // v0.7.2 §3.4: the FRAME keeps the cyan-top / magenta-left vaporwave
    // edges. The body BG retargets to --card-interior-bg so 70 stacked
    // cards are readable. No glow inside.
    <article
      className="dashboard-card relative"
      style={{
        background: "var(--card-interior-bg)",
        color: "var(--card-interior-text)",
        borderTop: "1px solid var(--readout-cyan)",
        borderLeft: "1px solid var(--accent-action)",
        borderRight: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        borderRadius: "var(--radius-panel)",
      }}
      data-testid="dashboard-card"
      data-slug={c.slug}
    >
      {/* v0.8.1 F3.1/F3.2/F3.3: header row is ONE line
          ({name} — {hq} — {overall}) with the hiring badge as row
          trailer. Blurb sits directly under in calmer (muted) body
          text. Spacing between header/blurb and the score-strip is
          tightened so the strip reads as the immediate body of the
          card. */}
      <header className="px-5 pt-4 pb-2 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* v0.8.3 F1.1 (take 2): Orbitron ONLY on the company name.
             Everything else inside the card body (hq, overall, blurb,
             frame labels, fit-note text, role/pub titles) inherits mono
             from globals.css — mono is the more readable face at small
             sizes, per Fatima's company-detail-page reaction. */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              href={`/companies/${c.slug}`}
              className="font-sans text-xl tracking-tight text-ink hover:text-readout transition-colors"
              style={{ fontWeight: 500 }}
            >
              {c.name}
            </Link>
            {c.hq && (
              <>
                <span
                  aria-hidden
                  className="text-card-interior-whisper text-base"
                >
                  —
                </span>
                <span className="text-sm text-card-interior-muted">
                  {c.hq}
                </span>
              </>
            )}
            <span
              aria-hidden
              className="text-card-interior-whisper text-base"
            >
              —
            </span>
            <span
              className="text-sm text-card-interior-muted"
              title="Weighted aggregate across frames"
            >
              <span className="text-card-interior-muted">Overall </span>
              <span className="text-readout text-base tabular-nums">
                {fmtOverall(overall)}
              </span>
            </span>
          </div>
          {c.description && (
            <p className="text-sm text-card-interior-text leading-relaxed mt-1 max-w-2xl">
              {c.description}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {/* v0.8.1 Phase B item 13 (F3.5): star toggle. Shared
              <FavoriteStar> so the company detail page header renders
              the same control. Defaults match the previous inline
              implementation (size 18, card-interior whisper as the
              outline tone). */}
          <FavoriteStar
            companyId={c.id}
            companyName={c.name}
            initialFavorited={initialFavorited}
          />
          <HiringBadge isHiring={isHiring} />
        </div>
      </header>

      {/* scores — 6 frame bars, 2 columns */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 px-5 pt-2 pb-3"
        style={{
          borderTop: "1px solid var(--card-interior-rule)",
          borderBottom: "1px solid var(--card-interior-rule)",
          background: "var(--card-interior-bg-sunk)",
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
            <p className="text-sm text-card-interior-text truncate">
              <span className="text-card-interior-muted mr-2">
                latest
              </span>
              <span aria-hidden className="mr-1">
                {latest.kind === "publication" ? pubIcon(null) : "🛠"}
              </span>
              <a
                href={latest.url}
                target="_blank"
                rel="noreferrer"
                className="text-card-interior-text hover:text-readout underline decoration-dotted underline-offset-4"
              >
                {latest.title}
              </a>
              <span className="ml-2 text-card-interior-whisper">{fmtAgo(latest.at)}</span>
            </p>
          ) : (
            <p className="prose-face text-sm text-card-interior-muted italic">
              No recent policy signal tracked.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="font-sans text-xs px-2 py-1 rounded-sm transition-colors shrink-0"
          style={{
            color: open ? "var(--readout-cyan)" : "var(--card-interior-text)",
            border: "1px solid var(--rule)",
          }}
        >
          {open ? "show less ↑" : "show more ↓"}
        </button>
      </div>

      {/* expanded reveal */}
      {open && detail && (
        <div
          className="px-5 pb-5 pt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"
          style={{ borderTop: "1px solid var(--card-interior-rule)" }}
        >
          <section className={hasOpenRoles ? undefined : "md:col-span-2"}>
            <h4 className="font-sans text-sm text-readout mb-2">
              Recent publications
              <span className="text-card-interior-whisper ml-2 text-xs">(last 12mo)</span>
            </h4>
            {detail.recentPublications.length === 0 ? (
              <p className="text-sm text-card-interior-muted italic">
                None tracked in the last 12 months.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {detail.recentPublications.map((p) => (
                  <li
                    key={p.id}
                    className="text-sm text-card-interior-text leading-relaxed"
                  >
                    <span aria-hidden className="mr-1">
                      {pubIcon(p.type)}
                    </span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-card-interior-text hover:text-readout underline decoration-dotted underline-offset-4"
                    >
                      {p.title}
                    </a>
                    <span className="ml-2 text-card-interior-whisper text-xs">
                      {fmtAgo(p.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {hasOpenRoles ? (
            <section>
              <h4 className="font-sans text-sm text-readout mb-2">
                Open roles
                <span className="text-card-interior-whisper ml-2 text-xs">
                  ({detail.openRoleCount})
                </span>
              </h4>
              <ul className="space-y-1.5">
                {detail.openRoles.map((r) => (
                  <li
                    key={r.id}
                    className="text-sm text-card-interior-text leading-relaxed"
                  >
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-card-interior-text hover:text-readout underline decoration-dotted underline-offset-4"
                    >
                      {r.title}
                    </a>
                    {(r.department || r.location) && (
                      <span className="ml-2 text-card-interior-whisper text-xs">
                        {[r.department, r.location].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="md:col-span-2">
            <h4 className="font-sans text-sm text-readout mb-2">
              Recent news
              <span className="text-card-interior-whisper ml-2 text-xs">
                (last 12mo)
              </span>
            </h4>
            {detail.recentNews.length === 0 ? (
              <p className="text-sm text-card-interior-muted italic">
                No recent news in the last 12 months.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {detail.recentNews.map((n) => (
                  <li
                    key={n.id}
                    className="text-sm text-card-interior-text leading-relaxed"
                  >
                    <span aria-hidden className="mr-1">
                      📰
                    </span>
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-card-interior-text hover:text-readout underline decoration-dotted underline-offset-4"
                    >
                      {n.title}
                    </a>
                    <span className="ml-2 text-card-interior-whisper text-xs">
                      {fmtAgo(n.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="md:col-span-2">
            <h4 className="font-sans text-sm text-readout mb-2">
              Recent controversy
              <span className="text-card-interior-whisper ml-2 text-xs">
                (last 12mo)
              </span>
            </h4>
            {detail.recentControversies.length === 0 ? (
              <p className="text-sm text-card-interior-muted italic">
                No recent controversy surfaced.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {detail.recentControversies.map((x) => (
                  <li
                    key={x.id}
                    className="text-sm text-card-interior-text leading-relaxed"
                  >
                    <span aria-hidden className="mr-1">
                      ⚠️
                    </span>
                    {x.url ? (
                      <a
                        href={x.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-card-interior-text hover:text-readout underline decoration-dotted underline-offset-4"
                      >
                        {x.title}
                      </a>
                    ) : (
                      <span className="text-card-interior-text">
                        {x.title}
                      </span>
                    )}
                    <span className="ml-2 text-card-interior-whisper text-xs">
                      {fmtAgo(x.surfacedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="md:col-span-2 flex items-center gap-4 pt-1 flex-wrap">
            <Link
              href={`/companies/${c.slug}`}
              className="font-sans text-sm px-3 py-1.5 rounded-sm"
              style={{
                color: "var(--readout-cyan)",
                border: "1px solid var(--readout-cyan)",
                background: "rgb(0 255 255 / 0.04)",
              }}
            >
              Explore in detail →
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
  favoritedCompanyIds,
}: Props) {
  const favoritedSet = useMemo(
    () => new Set(favoritedCompanyIds),
    [favoritedCompanyIds],
  );
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

  const detailMapForSort = detailMap;

  // ---- Toolbar state (v0.8.5 filter overhaul) ---------------------
  // Sort key: "overall" | "recent" | "alpha" | `frame:<id>`.
  // v0.8.5: replaced the v0.7-era chip set (Hiring + Open role +
  // Recent pub + Fit-note) per Fatima 2026-06-27 12:54Z. Hiring and
  // Open role were the same condition under different copy; Recent pub
  // was a single-table check; Fit-note was a saved-state filter most
  // users won't reach. New set: Hiring, High score (>=4), Has
  // controversy, Recent activity (any pub/role/news in last 30d),
  // Favorited.
  const [sortKey, setSortKey] = useState<string>("overall");
  const [filterHiring, setFilterHiring] = useState(false);
  const [filterHighScore, setFilterHighScore] = useState(false);
  const [filterControversy, setFilterControversy] = useState(false);
  const [filterRecentActivity, setFilterRecentActivity] = useState(false);
  const [filterFavorited, setFilterFavorited] = useState(false);
  // Kept for state-shape backward compat — hidden in the toolbar UI
  // since v0.8.3 (tier is an internal coverage signal, not a user lens).
  const [tierSet, setTierSet] = useState<Set<number>>(new Set());
  const [hq, setHq] = useState<string>("");

  const allHqs = useMemo(() => {
    const s = new Set<string>();
    for (const c of companies) if (c.hq) s.add(c.hq);
    return Array.from(s).sort();
  }, [companies]);

  // v0.8.5: 30-day window for the "Recent activity" chip. ORs across
  // publications + roles + news so any signal counts as "active".
  const [thirtyDaysAgo] = useState(
    () => Date.now() - 30 * 24 * 60 * 60 * 1000,
  );
  const isRecentISO = useCallback(
    (iso?: string | null) => !!iso && Date.parse(iso) >= thirtyDaysAgo,
    [thirtyDaysAgo],
  );

  const visible = useMemo(() => {
    const filtered = companies.filter((c) => {
      const d = detailMapForSort.get(c.id);
      if (filterHiring && d?.isHiring !== true) return false;
      if (filterHighScore) {
        const overall = aggMap.get(c.id)?.overall ?? null;
        if (overall === null || overall < 4) return false;
      }
      if (filterControversy && (d?.recentControversies.length ?? 0) <= 0)
        return false;
      if (filterRecentActivity) {
        const anyPub = (d?.recentPublications ?? []).some((p) =>
          isRecentISO(p.publishedAt),
        );
        const anyRole = (d?.openRoles ?? []).some((r) => isRecentISO(r.seenAt));
        const anyNews = (d?.recentNews ?? []).some((n) =>
          isRecentISO(n.publishedAt),
        );
        if (!anyPub && !anyRole && !anyNews) return false;
      }
      if (filterFavorited && !favoritedSet.has(c.id)) return false;
      if (tierSet.size > 0 && !tierSet.has(c.tier)) return false;
      if (hq && c.hq !== hq) return false;
      return true;
    });

    const arr = [...filtered];
    const cmpOverallDesc = (a: Company, b: Company) => {
      const oa = aggMap.get(a.id)?.overall ?? null;
      const ob = aggMap.get(b.id)?.overall ?? null;
      if (oa === ob) return a.name.localeCompare(b.name);
      if (oa === null) return 1;
      if (ob === null) return -1;
      return ob - oa;
    };

    if (sortKey === "alpha") {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === "recent") {
      const t = (c: Company) => {
        const at = detailMapForSort.get(c.id)?.latestEvent?.at;
        return at ? Date.parse(at) : 0;
      };
      arr.sort((a, b) => {
        const d = t(b) - t(a);
        return d !== 0 ? d : a.name.localeCompare(b.name);
      });
    } else if (sortKey.startsWith("frame:")) {
      const fid = Number(sortKey.slice("frame:".length));
      const s = (c: Company) => scoreLookup.get(`${c.id}:${fid}`) ?? null;
      arr.sort((a, b) => {
        const sa = s(a);
        const sb = s(b);
        if (sa === sb) return cmpOverallDesc(a, b);
        if (sa === null) return 1;
        if (sb === null) return -1;
        return sb - sa;
      });
    } else {
      arr.sort(cmpOverallDesc);
    }
    return arr;
  }, [
    companies,
    detailMapForSort,
    aggMap,
    scoreLookup,
    sortKey,
    filterHiring,
    filterHighScore,
    filterControversy,
    filterRecentActivity,
    filterFavorited,
    favoritedSet,
    isRecentISO,
    tierSet,
    hq,
  ]);

  const anyFilterActive =
    filterHiring ||
    filterHighScore ||
    filterControversy ||
    filterRecentActivity ||
    filterFavorited ||
    tierSet.size > 0 ||
    hq !== "";

  const toggleTier = (t: number) =>
    setTierSet((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const clearFilters = () => {
    setFilterHiring(false);
    setFilterHighScore(false);
    setFilterControversy(false);
    setFilterRecentActivity(false);
    setFilterFavorited(false);
    setTierSet(new Set());
    setHq("");
  };

  return (
    <section
      className="max-w-[72rem] mx-auto px-6 pb-20 space-y-4"
      data-testid="dashboard-cards"
    >
      <DashboardToolbar
        frames={frames}
        allHqs={allHqs}
        sortKey={sortKey}
        onSortKey={setSortKey}
        filterHiring={filterHiring}
        onFilterHiring={() => setFilterHiring((v) => !v)}
        filterHighScore={filterHighScore}
        onFilterHighScore={() => setFilterHighScore((v) => !v)}
        filterControversy={filterControversy}
        onFilterControversy={() => setFilterControversy((v) => !v)}
        filterRecentActivity={filterRecentActivity}
        onFilterRecentActivity={() => setFilterRecentActivity((v) => !v)}
        filterFavorited={filterFavorited}
        onFilterFavorited={() => setFilterFavorited((v) => !v)}
        tierSet={tierSet}
        onToggleTier={toggleTier}
        hq={hq}
        onHq={setHq}
        anyFilterActive={anyFilterActive}
        onClear={clearFilters}
        visibleCount={visible.length}
        totalCount={companies.length}
      />
      {visible.length === 0 && (
        <p
          className="mono text-xs text-whisper text-center py-12"
          style={{ border: "1px dashed var(--rule)", borderRadius: "var(--radius-panel)" }}
        >
          No companies match these filters.{" "}
          <button
            type="button"
            onClick={clearFilters}
            className="text-readout underline decoration-dotted underline-offset-4"
          >
            Clear filters
          </button>
        </p>
      )}
      {visible.map((c) => (
        <CompanyCard
          key={c.id}
          company={c}
          frames={frames}
          scoreLookup={scoreLookup}
          weights={frameWeights}
          detail={detailMap.get(c.id)}
          overall={aggMap.get(c.id)?.overall ?? null}
          initialFavorited={favoritedSet.has(c.id)}
        />
      ))}
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-whisper pt-3">
        {visible.length === companies.length
          ? `${companies.length} companies`
          : `${visible.length} of ${companies.length} companies`}{" "}
        · weights live on{" "}
        <Link href="/frames" className="text-readout underline">
          Frames
        </Link>
      </p>
    </section>
  );
}

/* ---------- toolbar ---------------------------------------------------- */

function DashboardToolbar({
  frames,
  allHqs,
  sortKey,
  onSortKey,
  filterHiring,
  onFilterHiring,
  filterHighScore,
  onFilterHighScore,
  filterControversy,
  onFilterControversy,
  filterRecentActivity,
  onFilterRecentActivity,
  filterFavorited,
  onFilterFavorited,
  hq,
  onHq,
  anyFilterActive,
  onClear,
  visibleCount,
  totalCount,
}: {
  frames: Frame[];
  allHqs: string[];
  sortKey: string;
  onSortKey: (v: string) => void;
  filterHiring: boolean;
  onFilterHiring: () => void;
  filterHighScore: boolean;
  onFilterHighScore: () => void;
  filterControversy: boolean;
  onFilterControversy: () => void;
  filterRecentActivity: boolean;
  onFilterRecentActivity: () => void;
  filterFavorited: boolean;
  onFilterFavorited: () => void;
  tierSet: Set<number>;
  onToggleTier: (t: number) => void;
  hq: string;
  onHq: (v: string) => void;
  anyFilterActive: boolean;
  onClear: () => void;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <div
      className="sticky top-0 z-10 -mx-2 px-2 py-3 mb-1"
      style={{
        background: "var(--bg-page)",
        borderBottom: "1px solid var(--rule)",
      }}
      data-testid="dashboard-toolbar"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Sort */}
        <label className="mono text-[10px] uppercase tracking-[0.16em] text-readout flex items-center gap-2">
          Sort
          <select
            value={sortKey}
            onChange={(e) => onSortKey(e.target.value)}
            className="mono text-xs px-2 py-1 rounded-sm bg-transparent"
            style={{
              border: "1px solid var(--rule)",
              color: "var(--ink)",
            }}
          >
            <option value="overall">Overall ↓</option>
            <option value="recent">Recent activity</option>
            <option value="alpha">Alphabetical</option>
            {frames.map((f) => (
              <option key={f.id} value={`frame:${f.id}`}>
                {f.name} ↓
              </option>
            ))}
          </select>
        </label>

        {/* HQ */}
        {allHqs.length > 0 && (
          <label className="mono text-[10px] uppercase tracking-[0.16em] text-readout flex items-center gap-2">
            HQ
            <select
              value={hq}
              onChange={(e) => onHq(e.target.value)}
              className="mono text-xs px-2 py-1 rounded-sm bg-transparent"
              style={{ border: "1px solid var(--rule)", color: "var(--ink)" }}
            >
              <option value="">All</option>
              {allHqs.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Tier filter intentionally hidden in v0.8.3 (Fatima feedback
         * 2026-06-27 09:35Z): tier is an internal coverage-completeness
         * signal, not a user lens. The state hook + props stay wired so
         * we can bring it back later without a refactor. */}

        {/* v0.8.5: Boolean filter chips. Set defined with Fatima
         * 2026-06-27 12:54Z. "Hiring" replaces both old hiring + open-
         * role chips (they were the same condition). High score → quick
         * top-of-list lens. Has controversy → counter-signal. Recent
         * activity → 30-day OR across pub/role/news. Favorited → the
         * star set. */}
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarChip active={filterHiring} onClick={onFilterHiring}>
            ● Hiring
          </ToolbarChip>
          <ToolbarChip active={filterHighScore} onClick={onFilterHighScore}>
            High score
          </ToolbarChip>
          <ToolbarChip active={filterControversy} onClick={onFilterControversy}>
            Has controversy
          </ToolbarChip>
          <ToolbarChip
            active={filterRecentActivity}
            onClick={onFilterRecentActivity}
          >
            Recent activity
          </ToolbarChip>
          <ToolbarChip active={filterFavorited} onClick={onFilterFavorited}>
            ★ Favorited
          </ToolbarChip>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="mono text-[10px] uppercase tracking-[0.16em] text-readout-dim">
            {visibleCount}/{totalCount}
          </span>
          {anyFilterActive && (
            <button
              type="button"
              onClick={onClear}
              className="mono text-[10px] uppercase tracking-[0.16em] text-readout underline decoration-dotted underline-offset-4"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  // v0.8.3 F1.2: filter-chip contrast bump. Inactive chips were
  // `--readout-cyan` text on transparent with a 65%-alpha border ("gray
  // on black, hard to see"). Now: full-alpha cyan border + cyan text
  // with a thin wash background; active stays magenta with the glow.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="mono text-xs uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm transition-colors"
      style={{
        border: active
          ? "1px solid var(--accent-action)"
          : "1px solid var(--readout-cyan)",
        color: active ? "var(--accent-action)" : "var(--readout-cyan)",
        background: active
          ? "rgb(255 0 255 / 0.12)"
          : "rgb(0 255 255 / 0.04)",
        boxShadow: active ? "var(--vw-glow-magenta)" : "none",
      }}
    >
      {children}
    </button>
  );
}
