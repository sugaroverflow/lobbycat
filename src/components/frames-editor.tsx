"use client";

/**
 * v0.7.2 Step 3 — combined frames page.
 *
 * One card per frame. Each card surfaces:
 *   - editable title
 *   - friendly description (replaces the v0.7 low/high label pair as the
 *     primary explainer; low/high labels still exist for the scoring engine
 *     and edit underneath in an "advanced" disclosure)
 *   - Must / Should / Could weight (inline)
 *   - delete affordance
 *
 * The page below this only renders `kind === 'scale'` frames. The DB may
 * still hold zombie `'tag'` / `'question'` rows from v0.6/v0.7; the page
 * filters them out (see A3.2 in ASSUMPTIONS-v0.7.2.md). Server actions
 * accept the same shape as before — we just stop sending non-scale kinds
 * from the UI.
 */

import { useState, useTransition } from "react";
import {
  createFrame,
  updateFrame,
  deleteFrame,
  setFrameWeights,
  suggestFrames,
  type SuggestedFrame,
} from "@/app/actions";
import { CatMark } from "@/components/wordmark";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";

export type EditableFrame = {
  id: number;
  name: string;
  description: string | null;
  kind: string;
  scale: number;
  highLabel: string | null;
  lowLabel: string | null;
  prompt: string | null;
  sortIndex: number;
};

const WEIGHT_LEVELS: FrameWeightLevel[] = ["high", "medium", "low"];
const WEIGHT_LABEL: Record<FrameWeightLevel, string> = {
  high: "Must",
  medium: "Should",
  low: "Could",
};
const WEIGHT_HELP: Record<FrameWeightLevel, string> = {
  high: "deal-breaker — score this heavily",
  medium: "matters — default weighting",
  low: "nice-to-have — gentle nudge only",
};

export function FramesEditor({
  frames,
  weights: initialWeights,
}: {
  frames: EditableFrame[];
  weights: Record<string, FrameWeightLevel>;
}) {
  // Only scale frames render. Zombie 'tag'/'question' rows are filtered out
  // and will be cleaned up in a later v0.8 schema pass (see A3.2).
  const scaleFrames = frames
    .filter((f) => f.kind === "scale")
    .sort((a, b) => a.sortIndex - b.sortIndex);

  const [weights, setWeights] = useState<Record<string, FrameWeightLevel>>(
    () => {
      const seed: Record<string, FrameWeightLevel> = {};
      for (const f of scaleFrames) {
        seed[String(f.id)] = initialWeights[String(f.id)] ?? "medium";
      }
      return seed;
    },
  );

  function handleWeightChange(frameId: number, level: FrameWeightLevel) {
    const key = String(frameId);
    if (weights[key] === level) return;
    setWeights((prev) => ({ ...prev, [key]: level }));
    // Fire-and-forget; the page revalidates after the action returns.
    void setFrameWeights({ [key]: level });
  }

  return (
    <div className="mt-10 space-y-8">
      <CatSuggestions />

      <ul className="space-y-4">
        {scaleFrames.map((f) => (
          <li key={f.id}>
            <FrameCard
              frame={f}
              weight={weights[String(f.id)] ?? "medium"}
              onWeightChange={(level) => handleWeightChange(f.id, level)}
            />
          </li>
        ))}
        {scaleFrames.length === 0 && (
          <li className="serif text-sm text-whisper italic px-4 py-6 border border-dashed border-rule rounded">
            No frames yet. Add one below.
          </li>
        )}
      </ul>

      <NewFrameForm />
    </div>
  );
}

function FrameCard({
  frame,
  weight,
  onWeightChange,
}: {
  frame: EditableFrame;
  weight: FrameWeightLevel;
  onWeightChange: (level: FrameWeightLevel) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <div className="border border-rule rounded-md p-5 bg-surface">
        <FrameForm
          initial={frame}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            start(async () => {
              await updateFrame({ id: frame.id, ...values });
              setEditing(false);
            })
          }
          pending={pending}
        />
      </div>
    );
  }

  return (
    <article
      className="border border-rule rounded-md bg-surface px-5 py-5 hover:border-rule-strong transition-colors"
      aria-label={`Frame: ${frame.name}`}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="serif text-lg text-ink font-medium">{frame.name}</h3>
          {frame.description ? (
            <p className="serif text-sm text-muted mt-2 max-w-2xl leading-relaxed">
              {frame.description}
            </p>
          ) : (
            <p className="serif text-sm text-whisper mt-2 italic">
              no description yet — click edit to add one
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-3 mono text-xs uppercase tracking-[0.1em]">
          <button
            onClick={() => setEditing(true)}
            className="text-moss hover:underline"
            aria-label={`Edit frame ${frame.name}`}
          >
            edit
          </button>
          <button
            onClick={() => {
              if (
                !confirm(
                  `Delete frame "${frame.name}"? Existing scores will cascade.`,
                )
              )
                return;
              start(async () => {
                await deleteFrame(frame.id);
              });
            }}
            disabled={pending}
            className="text-terracotta hover:underline disabled:opacity-50"
            aria-label={`Delete frame ${frame.name}`}
          >
            {pending ? "…" : "delete"}
          </button>
        </div>
      </header>

      <footer className="mt-4 pt-4 border-t border-rule/60 flex flex-wrap items-center gap-3">
        <span className="mono text-[10px] uppercase tracking-[0.14em] text-whisper">
          weight
        </span>
        <div
          role="radiogroup"
          aria-label={`Weight for ${frame.name}`}
          className="inline-flex border border-rule rounded-sm overflow-hidden"
        >
          {WEIGHT_LEVELS.map((level) => {
            const active = weight === level;
            return (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={active}
                title={WEIGHT_HELP[level]}
                onClick={() => onWeightChange(level)}
                className={`mono text-xs uppercase tracking-[0.1em] px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-moss text-white"
                    : "bg-bg text-muted hover:text-ink hover:bg-panel-raised/60"
                }`}
              >
                {WEIGHT_LABEL[level]}
              </button>
            );
          })}
        </div>
        <span className="mono text-[10px] text-whisper ml-auto">
          {frame.lowLabel || "—"} → {frame.highLabel || "—"} · 1–{frame.scale}
        </span>
      </footer>
    </article>
  );
}

function NewFrameForm() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mono text-xs uppercase tracking-[0.1em] text-moss hover:underline"
      >
        + add a new frame
      </button>
    );
  }

  return (
    <div className="border border-rule rounded-md p-5 bg-surface">
      <FrameForm
        initial={{
          id: 0,
          name: "",
          description: null,
          kind: "scale",
          scale: 5,
          highLabel: null,
          lowLabel: null,
          prompt: null,
          sortIndex: 0,
        }}
        submitLabel="Add frame"
        onCancel={() => setOpen(false)}
        onSubmit={(values) =>
          start(async () => {
            await createFrame(values);
            setOpen(false);
          })
        }
        pending={pending}
      />
    </div>
  );
}

function FrameForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  pending,
}: {
  initial: EditableFrame;
  submitLabel: string;
  onSubmit: (values: {
    name: string;
    description: string | null;
    kind: "scale";
    scale: number | null;
    highLabel: string | null;
    lowLabel: string | null;
    prompt: null;
  }) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [scale, setScale] = useState<number>(initial.scale ?? 5);
  const [highLabel, setHighLabel] = useState(initial.highLabel ?? "");
  const [lowLabel, setLowLabel] = useState(initial.lowLabel ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        try {
          onSubmit({
            name,
            description: description || null,
            kind: "scale",
            scale,
            highLabel: highLabel || null,
            lowLabel: lowLabel || null,
            prompt: null,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
          Name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full bg-bg border border-rule rounded px-3 py-2 serif text-base text-ink focus:outline-none focus:border-moss"
          placeholder="e.g. UK-friendliness"
        />
      </label>

      <label className="block">
        <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
          What does this mean in your work?
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full bg-bg border border-rule rounded px-3 py-2 serif text-base text-ink focus:outline-none focus:border-moss leading-relaxed"
          placeholder="One friendly paragraph — when does this matter, what would a strong vs weak company look like?"
        />
      </label>

      <details className="border border-rule/60 rounded p-3 bg-bg/40">
        <summary className="mono text-xs uppercase tracking-[0.1em] text-whisper cursor-pointer">
          advanced — scale poles (used by the scoring engine)
        </summary>
        <div className="mt-4 grid sm:grid-cols-[1fr_1fr_6rem] gap-4">
          <label className="block">
            <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
              Low label (1)
            </span>
            <input
              value={lowLabel}
              onChange={(e) => setLowLabel(e.target.value)}
              className="mt-1 w-full bg-bg border border-rule rounded px-3 py-2 serif text-base text-ink focus:outline-none focus:border-moss"
              placeholder="e.g. UK-hostile"
            />
          </label>
          <label className="block">
            <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
              High label ({scale})
            </span>
            <input
              value={highLabel}
              onChange={(e) => setHighLabel(e.target.value)}
              className="mt-1 w-full bg-bg border border-rule rounded px-3 py-2 serif text-base text-ink focus:outline-none focus:border-moss"
              placeholder="e.g. UK-friendly"
            />
          </label>
          <label className="block">
            <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
              Scale
            </span>
            <input
              type="number"
              min={2}
              max={10}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value) || 5)}
              className="mt-1 w-full bg-bg border border-rule rounded px-3 py-2 serif text-base text-ink focus:outline-none focus:border-moss"
            />
          </label>
        </div>
      </details>

      {error && <p className="serif text-sm text-terracotta">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="mono text-xs uppercase tracking-[0.1em] bg-moss text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink"
        >
          cancel
        </button>
      </div>
    </form>
  );
}

function CatSuggestions() {
  const [suggestions, setSuggestions] = useState<SuggestedFrame[] | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [adding, startAdding] = useTransition();

  function ask() {
    setError(null);
    startLoading(async () => {
      try {
        const result = await suggestFrames();
        // v0.7.2: page only renders scale frames; filter anything else out
        // even if the model returns it. See A3.6.
        const scaleOnly = result.filter((s) => s.kind === "scale");
        setSuggestions(scaleOnly);
        setAdded(new Set());
        if (scaleOnly.length === 0) {
          setError("the cat didn't come back with anything useful. try again?");
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "the cat napped through it. try again?",
        );
      }
    });
  }

  return (
    <section className="rounded-md border border-rule bg-sage-soft/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <CatMark size={28} className="mt-1 shrink-0" />
          <div className="min-w-0">
            <h2 className="serif text-lg text-ink font-medium">
              Ask lobbycat for frame ideas
            </h2>
            <p className="serif text-sm text-muted mt-1 max-w-2xl">
              Lobbycat reads your profile, your existing frames, and the
              company set, and proposes a couple of axes you aren&apos;t yet
              scoring on. One-click to add.
            </p>
          </div>
        </div>
        <button
          onClick={ask}
          disabled={loading}
          className="shrink-0 mono text-xs uppercase tracking-[0.1em] bg-moss text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "thinking…" : suggestions ? "✨ ask again" : "✨ suggest frames"}
        </button>
      </div>

      {error && <p className="serif text-sm text-terracotta mt-3">{error}</p>}

      {suggestions && suggestions.length > 0 && (
        <ul className="mt-5 space-y-3">
          {suggestions.map((s, i) => {
            const isAdded = added.has(i);
            return (
              <li key={i} className="rounded border border-rule bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="serif text-base text-ink font-medium">
                      {s.name}
                    </h3>
                    {s.kind === "scale" && (
                      <div className="mono text-xs uppercase tracking-[0.1em] text-whisper mt-2">
                        {s.lowLabel} → {s.highLabel} · 1–{s.scale}
                      </div>
                    )}
                    {s.description && (
                      <p className="serif text-sm text-muted mt-2">
                        {s.description}
                      </p>
                    )}
                    {s.rationale && (
                      <p className="serif text-xs text-mushroom mt-2 italic">
                        why: {s.rationale}
                      </p>
                    )}
                  </div>
                  <button
                    disabled={isAdded || adding}
                    onClick={() => {
                      startAdding(async () => {
                        try {
                          await createFrame({
                            name: s.name,
                            description: s.description,
                            kind: "scale",
                            scale: s.scale,
                            highLabel: s.highLabel,
                            lowLabel: s.lowLabel,
                            prompt: null,
                          });
                          setAdded((prev) => {
                            const next = new Set(prev);
                            next.add(i);
                            return next;
                          });
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "couldn't add that frame.",
                          );
                        }
                      });
                    }}
                    className="shrink-0 mono text-xs uppercase tracking-[0.1em] text-moss hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {isAdded ? "✓ added" : adding ? "…" : "+ add"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
