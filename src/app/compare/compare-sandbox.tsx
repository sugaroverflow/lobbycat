"use client";

/**
 * v0.6 step 7 — Compare with alt-weights sandbox.
 *
 * The sandbox holds a *local* copy of L/M/H weights, seeded from the
 * user's saved weights but never written back. The aggregate row at the
 * top re-computes instantly via `aggregateScore`, and a status pill tells
 * Aadi whether the sandbox matches what's saved on his profile.
 *
 * Rationales are collapsed by default; one click per cell expands them.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  aggregateScore,
  type FrameWeightLevel,
} from "@/lib/scoring/aggregate";

type CompanyOption = { id: number; slug: string; name: string };

type ScaleFrame = {
  id: number;
  name: string;
  scale: number;
  lowLabel: string | null;
  highLabel: string | null;
};

type Cell = {
  companyId: number;
  frameId: number;
  score: number | null;
  rationale: string | null;
};

type SelectedCompany = { id: number; slug: string; name: string };

const LEVELS: FrameWeightLevel[] = ["low", "medium", "high"];
const GLYPH: Record<FrameWeightLevel, string> = {
  low: "L",
  medium: "M",
  high: "H",
};

export function CompareSandbox({
  allCompanies,
  initialSelected,
  selectedCompanies,
  frames,
  cells,
  savedWeights,
}: {
  allCompanies: CompanyOption[];
  initialSelected: string[];
  selectedCompanies: SelectedCompany[];
  frames: ScaleFrame[];
  cells: Cell[];
  savedWeights: Record<string, FrameWeightLevel>;
}) {
  const router = useRouter();
  const [picker, setPicker] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected),
  );

  // Sandbox weights — seeded from saved, then mutated locally only.
  const seed = useMemo(() => {
    const out: Record<string, FrameWeightLevel> = {};
    for (const f of frames) {
      out[String(f.id)] = savedWeights[String(f.id)] ?? "medium";
    }
    return out;
  }, [frames, savedWeights]);

  const [weights, setWeights] = useState<Record<string, FrameWeightLevel>>(seed);

  const matchesSaved = useMemo(() => {
    for (const f of frames) {
      const k = String(f.id);
      if ((weights[k] ?? "medium") !== (savedWeights[k] ?? "medium")) {
        return false;
      }
    }
    return true;
  }, [weights, savedWeights, frames]);

  const aggregates = useMemo(() => {
    const out: Record<number, ReturnType<typeof aggregateScore>> = {};
    for (const c of selectedCompanies) {
      const perFrame = frames.map((f) => {
        const cell = cells.find(
          (x) => x.companyId === c.id && x.frameId === f.id,
        );
        return { frameId: f.id, score: cell?.score ?? null };
      });
      out[c.id] = aggregateScore(perFrame, weights);
    }
    return out;
  }, [selectedCompanies, frames, cells, weights]);

  const ranked = useMemo(() => {
    return [...selectedCompanies].sort((a, b) => {
      const ao = aggregates[a.id]?.overall;
      const bo = aggregates[b.id]?.overall;
      if (ao == null && bo == null) return 0;
      if (ao == null) return 1;
      if (bo == null) return -1;
      return bo - ao;
    });
  }, [selectedCompanies, aggregates]);

  const cellFor = (companyId: number, frameId: number) =>
    cells.find((c) => c.companyId === companyId && c.frameId === frameId);

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < 5) next.add(slug);
      return next;
    });

  const applySelection = () => {
    const slugs = Array.from(selected);
    setPicker(false);
    router.push("/compare" + (slugs.length ? `?slugs=${slugs.join(",")}` : ""));
  };

  const setOne = (frameId: number, level: FrameWeightLevel) => {
    setWeights((prev) => ({ ...prev, [String(frameId)]: level }));
  };

  const resetSandbox = () => setWeights(seed);

  return (
    <>
      {/* Picker bar */}
      <section className="max-w-[64rem] mx-auto px-6 mt-8 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {selectedCompanies.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 border border-rule-strong rounded-full px-3 py-1 mono text-[11px] text-ink bg-panel-raised/40"
            >
              {c.name}
              <button
                type="button"
                onClick={() => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    next.delete(c.slug);
                    return next;
                  });
                  const slugs = Array.from(initialSelected).filter(
                    (s) => s !== c.slug,
                  );
                  router.push(
                    "/compare" +
                      (slugs.length ? `?slugs=${slugs.join(",")}` : ""),
                  );
                }}
                className="text-whisper hover:text-ink"
                aria-label={`Remove ${c.name}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setPicker((v) => !v)}
            className="mono text-[11px] uppercase tracking-[0.14em] border border-rule-strong px-3 py-1 rounded-full hover:bg-panel"
          >
            {picker ? "cancel" : selectedCompanies.length ? "edit selection" : "pick companies"}
          </button>
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-whisper ml-auto">
            {selected.size}/5 selected
          </span>
        </div>

        {picker && (
          <div className="mt-4 border border-rule rounded-sm bg-panel-raised/40 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {allCompanies.map((c) => {
                const checked = selected.has(c.slug);
                const disabled = !checked && selected.size >= 5;
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 mono text-xs ${
                      disabled
                        ? "text-whisper cursor-not-allowed"
                        : "text-muted hover:text-ink cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(c.slug)}
                      className="accent-accent"
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={applySelection}
                disabled={selected.size < 2}
                className="mono text-xs uppercase tracking-[0.14em] px-4 py-2 bg-ink text-white rounded-sm hover:bg-accent disabled:opacity-50 transition"
              >
                Compare ↗
              </button>
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-whisper">
                pick 2–5
              </span>
            </div>
          </div>
        )}
      </section>

      {selectedCompanies.length >= 2 && (
        <>
          {/* Sandbox weight panel */}
          <section
            aria-label="Sandbox weights"
            className="max-w-[64rem] mx-auto px-6 mb-8"
          >
            <div className="border border-rule rounded-sm bg-panel-raised/40">
              <header className="flex items-center justify-between px-4 py-3 border-b border-rule gap-4 flex-wrap">
                <div>
                  <h2 className="serif text-lg text-ink font-medium">
                    Sandbox weights
                  </h2>
                  <p className="serif text-sm text-muted mt-0.5">
                    Try a different mix without touching your saved weights on{" "}
                    <Link href="/frames" className="underline hover:text-ink">
                      Frames
                    </Link>
                    .
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-sm border ${
                      matchesSaved
                        ? "border-rule text-muted"
                        : "border-accent text-accent"
                    }`}
                  >
                    {matchesSaved
                      ? "matches saved weights"
                      : "differs from saved weights"}
                  </span>
                  <button
                    type="button"
                    onClick={resetSandbox}
                    disabled={matchesSaved}
                    className="mono text-[10px] uppercase tracking-[0.14em] border border-rule-strong px-2 py-1 rounded-sm hover:bg-panel disabled:opacity-40"
                  >
                    reset to saved
                  </button>
                </div>
              </header>
              <ul className="divide-y divide-rule">
                {frames.map((f) => {
                  const cur = weights[String(f.id)] ?? "medium";
                  return (
                    <li
                      key={f.id}
                      className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="serif text-ink text-base">{f.name}</div>
                        {(f.lowLabel || f.highLabel) && (
                          <div className="mono text-[10px] uppercase tracking-[0.14em] text-whisper mt-0.5 truncate">
                            {f.lowLabel ?? "—"}{" "}
                            <span className="opacity-60">→</span>{" "}
                            {f.highLabel ?? "—"}
                          </div>
                        )}
                      </div>
                      <div
                        role="radiogroup"
                        aria-label={`Sandbox weight for ${f.name}`}
                        className="inline-flex border border-rule-strong rounded-sm overflow-hidden self-start md:self-auto"
                      >
                        {LEVELS.map((lvl) => {
                          const active = cur === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setOne(f.id, lvl)}
                              className={[
                                "px-3 py-1.5 mono text-[11px] uppercase tracking-[0.14em]",
                                "border-r border-rule-strong last:border-r-0",
                                active
                                  ? "bg-ink text-bg"
                                  : "bg-transparent text-muted hover:bg-panel",
                              ].join(" ")}
                            >
                              {GLYPH[lvl]}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Comparison table */}
          <section className="max-w-[64rem] mx-auto px-6 pb-24">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-rule">
                  <th className="text-left py-3 eyebrow w-56">Frame</th>
                  {ranked.map((c) => (
                    <th
                      key={c.id}
                      className="text-left py-3 px-2 serif text-base text-ink"
                    >
                      <Link
                        href={`/companies/${c.slug}`}
                        className="hover:text-accent"
                      >
                        {c.name}
                      </Link>
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-rule">
                  <td className="py-3 pr-4 mono text-[10px] uppercase tracking-[0.14em] text-whisper">
                    Overall (sandbox)
                  </td>
                  {ranked.map((c) => {
                    const a = aggregates[c.id];
                    return (
                      <td key={c.id} className="py-3 px-2">
                        <div className="mono text-lg text-ink">
                          {a?.overall == null ? (
                            <span className="text-whisper">—</span>
                          ) : (
                            a.overall.toFixed(2)
                          )}
                        </div>
                        <div className="mono text-[10px] text-whisper">
                          coverage {a?.coverage ?? 0}/{frames.length}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {frames.map((f) => (
                  <tr key={f.id} className="border-b border-rule align-top">
                    <td className="py-4 pr-4">
                      <div className="serif text-sm text-ink">{f.name}</div>
                      <div className="mono text-[10px] text-whisper uppercase tracking-[0.1em]">
                        {f.lowLabel} → {f.highLabel}
                      </div>
                      <div className="mono text-[10px] text-whisper mt-1">
                        weight:{" "}
                        <span className="text-muted">
                          {GLYPH[weights[String(f.id)] ?? "medium"]}
                        </span>
                      </div>
                    </td>
                    {ranked.map((c) => (
                      <CompareCell
                        key={c.id}
                        cell={cellFor(c.id, f.id)}
                        scale={f.scale}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {selectedCompanies.length === 1 && (
        <section className="max-w-[64rem] mx-auto px-6 pb-24">
          <p className="serif text-muted">Pick at least one more company to compare.</p>
        </section>
      )}
    </>
  );
}

function CompareCell({
  cell,
  scale,
}: {
  cell: Cell | undefined;
  scale: number;
}) {
  const [open, setOpen] = useState(false);
  if (!cell || cell.score == null) {
    return (
      <td className="py-4 px-2">
        <span className="mono text-xs text-whisper">—</span>
      </td>
    );
  }
  return (
    <td className="py-4 px-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-left"
        aria-expanded={open}
      >
        <div className="mono text-base text-ink hover:text-accent">
          {cell.score} <span className="text-whisper">/ {scale}</span>
        </div>
        {cell.rationale && (
          <div className="mono text-[10px] uppercase tracking-[0.14em] text-whisper mt-0.5">
            {open ? "hide rationale" : "show rationale"}
          </div>
        )}
      </button>
      {open && cell.rationale && (
        <div className="serif text-sm text-muted mt-2 leading-snug">
          {cell.rationale}
        </div>
      )}
    </td>
  );
}
