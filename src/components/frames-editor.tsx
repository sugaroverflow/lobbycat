"use client";

import { useState, useTransition } from "react";
import { createFrame, updateFrame, deleteFrame } from "@/app/actions";

type FrameKind = "scale" | "tag" | "question";

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

const KIND_LABELS: Record<FrameKind, string> = {
  scale: "Scale",
  tag: "Tag",
  question: "Question",
};

const KIND_BLURBS: Record<FrameKind, string> = {
  scale: "A 1–N axis with a low and a high label. Used by the map and the comparator.",
  tag: "A binary categorical lens. Companies are tagged with it or not.",
  question: "A free-text prompt each company gets an answer to.",
};

export function FramesEditor({ frames }: { frames: EditableFrame[] }) {
  const grouped: Record<FrameKind, EditableFrame[]> = {
    scale: [],
    tag: [],
    question: [],
  };
  for (const f of frames) {
    const k = (["scale", "tag", "question"] as const).includes(f.kind as FrameKind)
      ? (f.kind as FrameKind)
      : "scale";
    grouped[k].push(f);
  }

  return (
    <div className="mt-10 space-y-12">
      {(["scale", "tag", "question"] as const).map((kind) => (
        <section key={kind}>
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h2 className="serif text-xl text-ink font-medium">
              {KIND_LABELS[kind]} frames
              <span className="ml-2 mono text-xs uppercase tracking-[0.1em] text-whisper">
                {grouped[kind].length}
              </span>
            </h2>
          </div>
          <p className="serif text-sm text-muted mt-2 max-w-2xl">
            {KIND_BLURBS[kind]}
          </p>
          <ul className="mt-4 divide-y divide-rule">
            {grouped[kind].map((f) => (
              <FrameRow key={f.id} frame={f} />
            ))}
            {grouped[kind].length === 0 && (
              <li className="py-6 serif text-sm text-whisper italic">
                None yet.
              </li>
            )}
          </ul>
          <NewFrameForm defaultKind={kind} />
        </section>
      ))}
    </div>
  );
}

function FrameRow({ frame }: { frame: EditableFrame }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <li className="py-6">
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
      </li>
    );
  }

  return (
    <li className="py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="serif text-lg text-ink font-medium">{frame.name}</h3>
          {frame.description && (
            <p className="serif text-sm text-muted mt-1 max-w-2xl">
              {frame.description}
            </p>
          )}
          {frame.kind === "scale" && (
            <div className="flex items-center gap-3 mt-2 mono text-xs uppercase tracking-[0.1em] text-whisper">
              <span>{frame.lowLabel || "—"}</span>
              <span>→</span>
              <span>{frame.highLabel || "—"}</span>
              <span>· 1–{frame.scale}</span>
            </div>
          )}
          {frame.kind === "question" && frame.prompt && (
            <p className="serif text-sm text-ink mt-2 italic max-w-2xl">
              “{frame.prompt}”
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-3 mono text-xs uppercase tracking-[0.1em]">
          <button
            onClick={() => setEditing(true)}
            className="text-moss hover:underline"
          >
            edit
          </button>
          <button
            onClick={() => {
              if (!confirm(`Delete frame “${frame.name}”? Existing scores/answers will cascade.`)) return;
              start(async () => {
                await deleteFrame(frame.id);
              });
            }}
            disabled={pending}
            className="text-terracotta hover:underline disabled:opacity-50"
          >
            {pending ? "…" : "delete"}
          </button>
        </div>
      </div>
    </li>
  );
}

function NewFrameForm({ defaultKind }: { defaultKind: FrameKind }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 mono text-xs uppercase tracking-[0.1em] text-moss hover:underline"
      >
        + add {defaultKind} frame
      </button>
    );
  }

  return (
    <div className="mt-6 border border-rule rounded-md p-5 bg-surface">
      <FrameForm
        initial={{
          id: 0,
          name: "",
          description: null,
          kind: defaultKind,
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
    kind: FrameKind;
    scale: number | null;
    highLabel: string | null;
    lowLabel: string | null;
    prompt: string | null;
  }) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [kind, setKind] = useState<FrameKind>(
    (["scale", "tag", "question"] as const).includes(initial.kind as FrameKind)
      ? (initial.kind as FrameKind)
      : "scale",
  );
  const [scale, setScale] = useState<number>(initial.scale ?? 5);
  const [highLabel, setHighLabel] = useState(initial.highLabel ?? "");
  const [lowLabel, setLowLabel] = useState(initial.lowLabel ?? "");
  const [prompt, setPrompt] = useState(initial.prompt ?? "");
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
            kind,
            scale: kind === "scale" ? scale : null,
            highLabel: kind === "scale" ? highLabel || null : null,
            lowLabel: kind === "scale" ? lowLabel || null : null,
            prompt: kind === "question" ? prompt || null : null,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }}
      className="space-y-4"
    >
      <div className="grid sm:grid-cols-[1fr_10rem] gap-4">
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
            Kind
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as FrameKind)}
            className="mt-1 w-full bg-bg border border-rule rounded px-3 py-2 serif text-base text-ink focus:outline-none focus:border-moss"
          >
            <option value="scale">Scale</option>
            <option value="tag">Tag</option>
            <option value="question">Question</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
          Description (optional)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full bg-bg border border-rule rounded px-3 py-2 serif text-base text-ink focus:outline-none focus:border-moss"
          placeholder="What does this frame mean? How should you read a high vs a low?"
        />
      </label>

      {kind === "scale" && (
        <div className="grid sm:grid-cols-[1fr_1fr_6rem] gap-4">
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
      )}

      {kind === "question" && (
        <label className="block">
          <span className="mono text-xs uppercase tracking-[0.1em] text-whisper">
            Prompt (the question asked of each company)
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            required
            className="mt-1 w-full bg-bg border border-rule rounded px-3 py-2 serif text-base text-ink focus:outline-none focus:border-moss"
            placeholder="e.g. What would you need to see before recommending them to a UK gov contact?"
          />
        </label>
      )}

      {error && (
        <p className="serif text-sm text-terracotta">{error}</p>
      )}

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
