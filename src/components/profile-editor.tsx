"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions";

type Weights = Record<string, string>;

export type ProfileEditorProps = {
  displayName: string;
  headline: string | null;
  bio: string | null;
  concerns: string[];
  weights: Weights;
  sources: string[];
};

type Section = null | "header" | "bio" | "concerns" | "weights" | "sources";

const SECTION_LABEL = "mono text-[0.65rem] uppercase tracking-[0.16em] text-whisper hover:text-moss";

function humanizeKey(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export function ProfileEditor(initial: ProfileEditorProps) {
  const [editing, setEditing] = useState<Section>(null);
  const [data, setData] = useState<ProfileEditorProps>(initial);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function save(patch: Partial<ProfileEditorProps>) {
    setErr(null);
    startTransition(async () => {
      try {
        await updateProfile(patch);
        setData((d) => ({ ...d, ...patch }));
        setEditing(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  }

  return (
    <article className="max-w-[42rem] mx-auto px-6 pt-12 pb-24">
      <div className="mb-8">
        <a href="/" className="mono text-xs uppercase tracking-[0.14em] text-whisper hover:text-ink">
          ← Index
        </a>
      </div>

      {err && (
        <div className="mb-6 mono text-xs text-terracotta border-l-2 border-terracotta pl-3">
          {err}
        </div>
      )}

      {/* HEADER: name + headline */}
      {editing === "header" ? (
        <HeaderForm
          displayName={data.displayName}
          headline={data.headline}
          onCancel={() => setEditing(null)}
          onSave={(v) => save(v)}
          pending={pending}
        />
      ) : (
        <header className="group">
          <div className="flex items-baseline justify-between gap-4">
            <div className="eyebrow mb-4">The user</div>
            <button
              type="button"
              onClick={() => setEditing("header")}
              className={SECTION_LABEL}
            >
              edit
            </button>
          </div>
          <h1 className="serif text-5xl font-medium text-ink tracking-tight leading-[1.05]">
            {data.displayName}
          </h1>
          {data.headline && (
            <p className="serif mt-5 text-xl text-muted leading-relaxed">
              {data.headline}
            </p>
          )}
        </header>
      )}

      {/* BIO */}
      <Section
        title="Bio"
        editing={editing === "bio"}
        onEdit={() => setEditing("bio")}
        onCancel={() => setEditing(null)}
      >
        {editing === "bio" ? (
          <BioForm
            bio={data.bio}
            onCancel={() => setEditing(null)}
            onSave={(bio) => save({ bio })}
            pending={pending}
          />
        ) : data.bio ? (
          <p className="serif text-base text-body leading-relaxed">{data.bio}</p>
        ) : (
          <p className="serif text-base text-whisper italic">No bio yet.</p>
        )}
      </Section>

      {/* CONCERNS */}
      <Section
        title="Concerns while deciding"
        editing={editing === "concerns"}
        onEdit={() => setEditing("concerns")}
        onCancel={() => setEditing(null)}
      >
        {editing === "concerns" ? (
          <ListForm
            items={data.concerns}
            placeholder="One concern per line"
            onCancel={() => setEditing(null)}
            onSave={(concerns) => save({ concerns })}
            pending={pending}
          />
        ) : data.concerns.length > 0 ? (
          <ul className="space-y-3">
            {data.concerns.map((c, i) => (
              <li
                key={i}
                className="serif text-base text-body leading-relaxed pl-4 border-l-2 border-rule-strong"
              >
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="serif text-base text-whisper italic">None yet.</p>
        )}
      </Section>

      {/* WEIGHTS */}
      <Section
        title="How he weights things"
        editing={editing === "weights"}
        onEdit={() => setEditing("weights")}
        onCancel={() => setEditing(null)}
      >
        {editing === "weights" ? (
          <WeightsForm
            weights={data.weights}
            onCancel={() => setEditing(null)}
            onSave={(weights) => save({ weights })}
            pending={pending}
          />
        ) : Object.keys(data.weights).length > 0 ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            {Object.entries(data.weights).map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between border-b border-rule pb-2"
              >
                <dt className="serif text-sm text-body">{humanizeKey(k)}</dt>
                <dd className="mono text-xs uppercase tracking-[0.12em] text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="serif text-base text-whisper italic">No weights set.</p>
        )}
      </Section>

      {/* SOURCES */}
      <Section
        title="Sources"
        editing={editing === "sources"}
        onEdit={() => setEditing("sources")}
        onCancel={() => setEditing(null)}
      >
        {editing === "sources" ? (
          <ListForm
            items={data.sources}
            placeholder="One source per line"
            onCancel={() => setEditing(null)}
            onSave={(sources) => save({ sources })}
            pending={pending}
          />
        ) : data.sources.length > 0 ? (
          <ul className="mono text-xs text-whisper space-y-1">
            {data.sources.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="serif text-base text-whisper italic">None yet.</p>
        )}
      </Section>

      <p className="serif text-sm text-whisper mt-12 italic">
        Used by the lobbycat agent to ground every fit-note. Read it critically;
        tell the cat where it&apos;s wrong.
      </p>
    </article>
  );
}

/* --- shared section shell --- */

function Section({
  title,
  editing,
  onEdit,
  children,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-rule">
        <h2 className="eyebrow">{title}</h2>
        {!editing && (
          <button type="button" onClick={onEdit} className={SECTION_LABEL}>
            edit
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* --- inline forms --- */

const INPUT =
  "w-full rounded-sm border border-rule bg-surface px-3 py-2 serif text-base text-ink focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss/30";
const TEXTAREA = INPUT + " resize-y min-h-[6rem]";
const BTN_PRIMARY =
  "mono text-xs uppercase tracking-[0.14em] px-3 py-1.5 rounded-sm bg-moss text-surface hover:bg-moss/90 disabled:opacity-50";
const BTN_GHOST =
  "mono text-xs uppercase tracking-[0.14em] px-3 py-1.5 rounded-sm text-muted hover:text-ink";

function FormActions({
  onCancel,
  pending,
  label = "save",
}: {
  onCancel: () => void;
  pending: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <button type="submit" disabled={pending} className={BTN_PRIMARY}>
        {pending ? "saving…" : label}
      </button>
      <button type="button" onClick={onCancel} className={BTN_GHOST}>
        cancel
      </button>
    </div>
  );
}

function HeaderForm({
  displayName,
  headline,
  onCancel,
  onSave,
  pending,
}: {
  displayName: string;
  headline: string | null;
  onCancel: () => void;
  onSave: (v: { displayName: string; headline: string | null }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState(displayName);
  const [head, setHead] = useState(headline ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ displayName: name, headline: head || null });
      }}
    >
      <div className="eyebrow mb-4">The user</div>
      <label className="block">
        <span className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper">name</span>
        <input
          className={INPUT + " mt-1 serif text-3xl font-medium tracking-tight"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="block mt-4">
        <span className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper">headline</span>
        <input
          className={INPUT + " mt-1"}
          value={head}
          onChange={(e) => setHead(e.target.value)}
          placeholder="A one-line description"
        />
      </label>
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}

function BioForm({
  bio,
  onCancel,
  onSave,
  pending,
}: {
  bio: string | null;
  onCancel: () => void;
  onSave: (bio: string | null) => void;
  pending: boolean;
}) {
  const [value, setValue] = useState(bio ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value || null);
      }}
    >
      <textarea
        className={TEXTAREA}
        rows={6}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="A few sentences about who you are and what you're looking for."
      />
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}

function ListForm({
  items,
  placeholder,
  onCancel,
  onSave,
  pending,
}: {
  items: string[];
  placeholder: string;
  onCancel: () => void;
  onSave: (items: string[]) => void;
  pending: boolean;
}) {
  const [text, setText] = useState(items.join("\n"));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = text
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        onSave(parsed);
      }}
    >
      <textarea
        className={TEXTAREA}
        rows={Math.max(4, items.length + 1)}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
      />
      <p className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper mt-1">
        one per line
      </p>
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}

function WeightsForm({
  weights,
  onCancel,
  onSave,
  pending,
}: {
  weights: Weights;
  onCancel: () => void;
  onSave: (weights: Weights) => void;
  pending: boolean;
}) {
  const initialRows =
    Object.entries(weights).length > 0
      ? Object.entries(weights).map(([k, v]) => ({ key: k, value: v }))
      : [{ key: "", value: "" }];
  const [rows, setRows] = useState(initialRows);

  function update(i: number, patch: Partial<{ key: string; value: string }>) {
    setRows((rs) => rs.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  }
  function add() {
    setRows((rs) => [...rs, { key: "", value: "" }]);
  }
  function remove(i: number) {
    setRows((rs) => rs.filter((_, j) => j !== i));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const out: Weights = {};
        for (const r of rows) {
          const k = r.key.trim();
          const v = r.value.trim();
          if (k && v) out[k] = v;
        }
        onSave(out);
      }}
    >
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={INPUT + " flex-1"}
              value={r.key}
              onChange={(e) => update(i, { key: e.target.value })}
              placeholder="key (e.g. policyDepth)"
            />
            <input
              className={INPUT + " flex-1"}
              value={r.value}
              onChange={(e) => update(i, { value: e.target.value })}
              placeholder="weight (e.g. high)"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mono text-xs text-whisper hover:text-terracotta px-2"
              aria-label="remove row"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mono text-[0.65rem] uppercase tracking-[0.14em] text-moss hover:text-ink mt-3"
      >
        + add weight
      </button>
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}
