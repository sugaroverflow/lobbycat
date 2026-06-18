"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TagChip } from "@/components/tag-chip";
import { FilterChip, FilterRowLabel } from "@/components/filter-chip";

export type MapCompany = {
  id: number;
  slug: string;
  name: string;
  tier: number;
  hq: string | null;
  description: string | null;
  tagList: Array<{ label: string; color: string | null }>;
  scores: Record<number, number>;
  fitNotePreview: string | null;
};

export type MapFrame = {
  id: number;
  name: string;
  scale: number;
  lowLabel: string | null;
  highLabel: string | null;
};

const TIER_FILL: Record<number, string> = {
  1: "var(--color-terracotta)",
  2: "var(--color-ochre)",
  3: "var(--color-mushroom)",
};

const TIER_LABEL: Record<number, string> = {
  1: "Top focus",
  2: "Serious",
  3: "On radar",
};

export function MapView({
  companies,
  frames,
}: {
  companies: MapCompany[];
  frames: MapFrame[];
}) {
  const defaultX = frames[0]?.id ?? null;
  const defaultY = frames[1]?.id ?? frames[0]?.id ?? null;
  const [xId, setXId] = useState<number | null>(defaultX);
  const [yId, setYId] = useState<number | null>(defaultY);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [tierFilter, setTierFilter] = useState<Set<number>>(new Set());
  const [hqFilter, setHqFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());

  const xFrame = frames.find((f) => f.id === xId) || null;
  const yFrame = frames.find((f) => f.id === yId) || null;

  // Distinct filter options derived from the full company set so chips stay
  // stable as filters narrow the visible dots (otherwise un-clicking the last
  // chip in a category would also remove the chip itself).
  const hqOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of companies) if (c.hq) set.add(c.hq);
    return Array.from(set).sort();
  }, [companies]);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of companies)
      for (const t of c.tagList)
        counts.set(t.label, (counts.get(t.label) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([label]) => label);
  }, [companies]);

  const passesFilters = (c: MapCompany) => {
    if (tierFilter.size > 0 && !tierFilter.has(c.tier)) return false;
    if (hqFilter.size > 0 && (!c.hq || !hqFilter.has(c.hq))) return false;
    if (tagFilter.size > 0) {
      const labels = new Set(c.tagList.map((t) => t.label));
      let any = false;
      for (const t of tagFilter) if (labels.has(t)) { any = true; break; }
      if (!any) return false;
    }
    return true;
  };

  const filteredCompanies = useMemo(
    () => companies.filter(passesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companies, tierFilter, hqFilter, tagFilter],
  );

  const filtersActive =
    tierFilter.size > 0 || hqFilter.size > 0 || tagFilter.size > 0;

  const plotted = useMemo(() => {
    if (!xFrame || !yFrame) return [];
    return filteredCompanies
      .map((c) => {
        const x = c.scores[xFrame.id];
        const y = c.scores[yFrame.id];
        if (typeof x !== "number" || typeof y !== "number") return null;
        return { c, x, y };
      })
      .filter((p): p is { c: MapCompany; x: number; y: number } => p !== null);
  }, [filteredCompanies, xFrame, yFrame]);

  const unscored = useMemo(() => {
    if (!xFrame || !yFrame) return [];
    return filteredCompanies.filter(
      (c) =>
        typeof c.scores[xFrame.id] !== "number" ||
        typeof c.scores[yFrame.id] !== "number",
    );
  }, [filteredCompanies, xFrame, yFrame]);

  const swapAxes = () => {
    setXId(yId);
    setYId(xId);
  };

  const toggle = <T,>(set: Set<T>, val: T): Set<T> => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    return next;
  };

  const clearFilters = () => {
    setTierFilter(new Set());
    setHqFilter(new Set());
    setTagFilter(new Set());
  };

  if (frames.length < 2) {
    return (
      <div className="border border-rule rounded-md p-8 bg-surface">
        <p className="serif text-muted">
          The map needs at least two scale-kind frames to draw axes.{" "}
          <Link href="/frames" className="text-accent underline">
            Add one
          </Link>{" "}
          and come back.
        </p>
      </div>
    );
  }

  // SVG viewport: 0..xMax on x, 0..yMax on y, with padding for axes.
  const W = 720;
  const H = 480;
  const PAD_L = 64;
  const PAD_R = 24;
  const PAD_T = 24;
  const PAD_B = 56;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const xMax = xFrame?.scale ?? 5;
  const yMax = yFrame?.scale ?? 5;

  const sx = (v: number) => PAD_L + ((v - 1) / Math.max(1, xMax - 1)) * plotW;
  const sy = (v: number) =>
    PAD_T + plotH - ((v - 1) / Math.max(1, yMax - 1)) * plotH;

  // Cluster duplicate (x,y) by jittering deterministically.
  const positioned = useMemo(() => {
    const buckets = new Map<string, number>();
    return plotted.map((p) => {
      const key = `${p.x}:${p.y}`;
      const i = buckets.get(key) ?? 0;
      buckets.set(key, i + 1);
      // golden-angle spiral jitter, small radius
      const angle = i * 2.39996;
      const r = i === 0 ? 0 : 6 + i * 1.5;
      return {
        ...p,
        cx: sx(p.x) + r * Math.cos(angle),
        cy: sy(p.y) + r * Math.sin(angle),
      };
    });
  }, [plotted, xFrame, yFrame]);

  // Pinned wins over hover so a click-to-pin sticks even as the cursor moves.
  // Filters can hide the pinned company; in that case treat as not-pinned so
  // we don't render a card for a dot that isn't on screen.
  const visibleIds = useMemo(
    () => new Set(plotted.map((p) => p.c.id)),
    [plotted],
  );
  const effectivePinned =
    pinned != null && visibleIds.has(pinned) ? pinned : null;
  const effectiveHovered =
    hovered != null && visibleIds.has(hovered) ? hovered : null;
  const activeId = effectivePinned ?? effectiveHovered;
  const activeCo =
    activeId != null ? companies.find((c) => c.id === activeId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-4">
        <AxisPicker
          label="X axis"
          frames={frames}
          value={xId}
          onChange={setXId}
        />
        <button
          type="button"
          onClick={swapAxes}
          className="mono text-[0.7rem] uppercase tracking-[0.12em] text-muted hover:text-ink border border-rule rounded px-2.5 py-1.5 self-end sm:self-end shrink-0"
          aria-label="Swap X and Y axes"
          title="Swap axes"
        >
          ⇄ swap
        </button>
        <AxisPicker
          label="Y axis"
          frames={frames}
          value={yId}
          onChange={setYId}
        />
        <div className="mono text-xs text-whisper uppercase tracking-[0.12em] sm:ml-auto">
          {plotted.length} plotted · {unscored.length} unscored
        </div>
      </div>

      <FilterRow
        tierFilter={tierFilter}
        hqFilter={hqFilter}
        tagFilter={tagFilter}
        hqOptions={hqOptions}
        tagOptions={tagOptions}
        onTier={(t) => setTierFilter((s) => toggle(s, t))}
        onHq={(h) => setHqFilter((s) => toggle(s, h))}
        onTag={(t) => setTagFilter((s) => toggle(s, t))}
        active={filtersActive}
        onClear={clearFilters}
      />

      <div className="border border-rule rounded-md bg-surface relative overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block"
          role="img"
          aria-label={`Scatter of ${plotted.length} companies on ${xFrame?.name} vs ${yFrame?.name}`}
        >
          {/* grid */}
          {Array.from({ length: xMax }, (_, i) => i + 1).map((v) => (
            <line
              key={`gx-${v}`}
              x1={sx(v)}
              x2={sx(v)}
              y1={PAD_T}
              y2={PAD_T + plotH}
              stroke="var(--color-rule)"
              strokeDasharray={v === 1 || v === xMax ? "" : "2 4"}
              strokeWidth={v === 1 || v === xMax ? 1 : 0.5}
            />
          ))}
          {Array.from({ length: yMax }, (_, i) => i + 1).map((v) => (
            <line
              key={`gy-${v}`}
              x1={PAD_L}
              x2={PAD_L + plotW}
              y1={sy(v)}
              y2={sy(v)}
              stroke="var(--color-rule)"
              strokeDasharray={v === 1 || v === yMax ? "" : "2 4"}
              strokeWidth={v === 1 || v === yMax ? 1 : 0.5}
            />
          ))}

          {/* axis labels */}
          <text
            x={PAD_L}
            y={PAD_T + plotH + 20}
            className="mono"
            fontSize="10"
            fill="var(--color-whisper)"
            textAnchor="start"
          >
            {xFrame?.lowLabel ?? "1"}
          </text>
          <text
            x={PAD_L + plotW}
            y={PAD_T + plotH + 20}
            className="mono"
            fontSize="10"
            fill="var(--color-whisper)"
            textAnchor="end"
          >
            {xFrame?.highLabel ?? String(xMax)}
          </text>
          <text
            x={PAD_L + plotW / 2}
            y={PAD_T + plotH + 42}
            className="mono"
            fontSize="11"
            fill="var(--color-muted)"
            textAnchor="middle"
          >
            {xFrame?.name}
          </text>

          <text
            x={PAD_L - 14}
            y={PAD_T + 8}
            className="mono"
            fontSize="10"
            fill="var(--color-whisper)"
            textAnchor="end"
          >
            {yFrame?.highLabel ?? String(yMax)}
          </text>
          <text
            x={PAD_L - 14}
            y={PAD_T + plotH}
            className="mono"
            fontSize="10"
            fill="var(--color-whisper)"
            textAnchor="end"
          >
            {yFrame?.lowLabel ?? "1"}
          </text>
          <text
            x={20}
            y={PAD_T + plotH / 2}
            className="mono"
            fontSize="11"
            fill="var(--color-muted)"
            textAnchor="middle"
            transform={`rotate(-90 20 ${PAD_T + plotH / 2})`}
          >
            {yFrame?.name}
          </text>

          {/* points */}
          {positioned.map((p) => {
            const isHover = hovered === p.c.id;
            const isPinned = pinned === p.c.id;
            const active = isHover || isPinned;
            return (
              <g
                key={p.c.id}
                onMouseEnter={() => setHovered(p.c.id)}
                onMouseLeave={() => setHovered((h) => (h === p.c.id ? null : h))}
                onClick={(e) => {
                  e.stopPropagation();
                  setPinned((cur) => (cur === p.c.id ? null : p.c.id));
                }}
                className="cursor-pointer"
              >
                {isPinned && (
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r={11}
                    fill="none"
                    stroke={TIER_FILL[p.c.tier] ?? "var(--color-mushroom)"}
                    strokeOpacity={0.45}
                    strokeWidth={1.25}
                  />
                )}
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={active ? 8 : 6}
                  fill={TIER_FILL[p.c.tier] ?? "var(--color-mushroom)"}
                  fillOpacity={active ? 0.95 : 0.78}
                  stroke="var(--color-ink)"
                  strokeOpacity={active ? 0.6 : 0}
                  strokeWidth={1}
                />
              </g>
            );
          })}
          {/* click-anywhere-on-blank-space to unpin */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={plotW}
            height={plotH}
            fill="transparent"
            onClick={() => setPinned(null)}
            style={{ pointerEvents: pinned ? "all" : "none" }}
          />
        </svg>

        {activeCo && (
          <HoverCard
            company={activeCo}
            xFrameName={xFrame?.name ?? ""}
            yFrameName={yFrame?.name ?? ""}
            xScore={xFrame ? activeCo.scores[xFrame.id] : undefined}
            yScore={yFrame ? activeCo.scores[yFrame.id] : undefined}
            pinned={pinned === activeCo.id}
            onClose={() => setPinned(null)}
          />
        )}
      </div>

      <Legend tierCounts={countByTier(plotted.map((p) => p.c))} />

      {unscored.length > 0 && (
        <details className="text-sm">
          <summary className="mono text-xs uppercase tracking-[0.12em] text-whisper cursor-pointer">
            {unscored.length} companies unscored on this pair
          </summary>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 serif text-muted">
            {unscored.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/companies/${c.slug}`}
                  className="hover:text-ink underline decoration-rule"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function AxisPicker({
  label,
  frames,
  value,
  onChange,
}: {
  label: string;
  frames: MapFrame[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="serif text-base text-ink bg-surface border border-rule rounded px-3 py-1.5 min-w-[14rem]"
      >
        {frames.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function HoverCard({
  company,
  xFrameName,
  yFrameName,
  xScore,
  yScore,
  pinned,
  onClose,
}: {
  company: MapCompany;
  xFrameName: string;
  yFrameName: string;
  xScore: number | undefined;
  yScore: number | undefined;
  pinned: boolean;
  onClose: () => void;
}) {
  // When pinned, the card accepts pointer events (close button, link clicks);
  // when hover-only, stay pointer-events-none so the cursor can keep moving
  // between points without flicker.
  const topTags = company.tagList.slice(0, 4);
  return (
    <div
      className={`absolute top-3 right-3 w-72 bg-surface border rounded-md shadow-sm p-4 ${
        pinned
          ? "border-moss/40 ring-1 ring-moss/20 pointer-events-auto"
          : "border-rule pointer-events-none"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="eyebrow text-[0.6rem] mb-1">
            Tier {company.tier} · {TIER_LABEL[company.tier]}
          </div>
          <Link
            href={`/companies/${company.slug}`}
            className="serif text-lg text-ink font-medium leading-tight pointer-events-auto hover:underline block"
          >
            {company.name}
          </Link>
          {company.hq && (
            <div className="mono text-[0.65rem] uppercase tracking-[0.1em] text-whisper mt-0.5">
              {company.hq}
            </div>
          )}
        </div>
        {pinned && (
          <button
            type="button"
            onClick={onClose}
            className="mono text-[0.65rem] uppercase tracking-[0.12em] text-whisper hover:text-ink -mt-1 -mr-1 p-1 leading-none"
            aria-label="Unpin"
          >
            ×
          </button>
        )}
      </div>

      {topTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topTags.map((t) => (
            <TagChip key={t.label} label={t.label} color={t.color} />
          ))}
        </div>
      )}

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted truncate">{xFrameName}</dt>
          <dd className="text-ink mono shrink-0">{xScore ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted truncate">{yFrameName}</dt>
          <dd className="text-ink mono shrink-0">{yScore ?? "—"}</dd>
        </div>
      </dl>

      {company.fitNotePreview && (
        <div className="mt-3 pt-3 border-t border-rule">
          <div className="eyebrow text-[0.55rem] mb-1">From the fit-note</div>
          <p className="serif text-sm text-muted leading-snug line-clamp-3">
            {company.fitNotePreview}
          </p>
        </div>
      )}

      {pinned && (
        <Link
          href={`/companies/${company.slug}`}
          className="mt-3 inline-block mono text-[0.65rem] uppercase tracking-[0.12em] text-accent hover:underline pointer-events-auto"
        >
          Open profile →
        </Link>
      )}
    </div>
  );
}

function FilterRow({
  tierFilter,
  hqFilter,
  tagFilter,
  hqOptions,
  tagOptions,
  onTier,
  onHq,
  onTag,
  active,
  onClear,
}: {
  tierFilter: Set<number>;
  hqFilter: Set<string>;
  tagFilter: Set<string>;
  hqOptions: string[];
  tagOptions: string[];
  onTier: (t: number) => void;
  onHq: (h: string) => void;
  onTag: (t: string) => void;
  active: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FilterRowLabel>Tier</FilterRowLabel>
        {[1, 2, 3].map((t) => (
          <FilterChip
            key={t}
            label={`${t} · ${TIER_LABEL[t]}`}
            active={tierFilter.has(t)}
            onClick={() => onTier(t)}
            dotColor={TIER_FILL[t]}
          />
        ))}
        {hqOptions.length > 0 && (
          <span className="mono text-[0.6rem] uppercase tracking-[0.14em] text-whisper ml-3 mr-1">
            HQ
          </span>
        )}
        {hqOptions.map((h) => (
          <FilterChip
            key={h}
            label={h}
            active={hqFilter.has(h)}
            onClick={() => onHq(h)}
          />
        ))}
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto mono text-[0.65rem] uppercase tracking-[0.12em] text-whisper hover:text-ink underline decoration-rule"
          >
            clear
          </button>
        )}
      </div>
      {tagOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterRowLabel>Tag</FilterRowLabel>
          {tagOptions.map((t) => (
            <FilterChip
              key={t}
              label={t}
              active={tagFilter.has(t)}
              onClick={() => onTag(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function countByTier(cos: MapCompany[]) {
  const m: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const c of cos) m[c.tier] = (m[c.tier] ?? 0) + 1;
  return m;
}

function Legend({ tierCounts }: { tierCounts: Record<number, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mono text-[0.7rem] uppercase tracking-[0.12em] text-muted">
      {[1, 2, 3].map((tier) => (
        <span key={tier} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: TIER_FILL[tier] }}
            aria-hidden
          />
          Tier {tier} · {TIER_LABEL[tier]}{" "}
          <span className="text-whisper">({tierCounts[tier] ?? 0})</span>
        </span>
      ))}
    </div>
  );
}
