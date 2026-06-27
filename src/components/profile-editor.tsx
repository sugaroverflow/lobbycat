"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateProfile } from "@/app/actions";

type LocationPrefs = {
  uk?: boolean;
  eu?: boolean;
  us?: boolean;
  remoteOk?: boolean;
  notes?: string;
};

type OpenTextAnswer = {
  question: string;
  answer: string;
  answeredAt?: string;
};

export type ProfileEditorProps = {
  displayName: string;
  currentRoleOneLiner: string | null;
  exploringText: string | null;
  locationPreferences: LocationPrefs;
  openTextAnswers: OpenTextAnswer[];
};

type Section = null | "name" | "role" | "exploring" | "location" | "answers";

const SECTION_LABEL =
  "mono text-[0.65rem] uppercase tracking-[0.16em] text-whisper hover:text-moss";

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
    <article className="max-w-[42rem] mx-auto px-6 pt-12 pb-16">
      <div className="mb-8">
        <Link
          href="/"
          className="mono text-xs uppercase tracking-[0.14em] text-whisper hover:text-ink"
        >
          ← Index
        </Link>
      </div>

      {err && (
        <div className="mb-6 mono text-xs text-terracotta border-l-2 border-terracotta pl-3">
          {err}
        </div>
      )}

      {/* NAME */}
      {editing === "name" ? (
        <NameForm
          displayName={data.displayName}
          onCancel={() => setEditing(null)}
          onSave={(displayName) => save({ displayName })}
          pending={pending}
        />
      ) : (
        <header className="group">
          <div className="flex items-baseline justify-between gap-4">
            <div className="eyebrow mb-4">The user</div>
            <button
              type="button"
              onClick={() => setEditing("name")}
              className={SECTION_LABEL}
            >
              edit
            </button>
          </div>
          <h1 className="font-sans text-5xl font-medium text-ink tracking-tight leading-[1.05]">
            {data.displayName}
          </h1>
        </header>
      )}

      {/* CURRENT ROLE ONE-LINER */}
      <Section
        title="Current role (one-liner)"
        editing={editing === "role"}
        onEdit={() => setEditing("role")}
      >
        {editing === "role" ? (
          <ShortTextForm
            value={data.currentRoleOneLiner}
            placeholder="What you do right now, in a sentence"
            onCancel={() => setEditing(null)}
            onSave={(v) => save({ currentRoleOneLiner: v })}
            pending={pending}
          />
        ) : data.currentRoleOneLiner ? (
          <p className="serif text-base text-body leading-relaxed">
            {data.currentRoleOneLiner}
          </p>
        ) : (
          <p className="serif text-base text-whisper italic">Not set.</p>
        )}
      </Section>

      {/* WHAT EXPLORING */}
      <Section
        title="What you're exploring"
        editing={editing === "exploring"}
        onEdit={() => setEditing("exploring")}
      >
        {editing === "exploring" ? (
          <LongTextForm
            value={data.exploringText}
            placeholder="The kind of role, work, or company you're looking for next"
            onCancel={() => setEditing(null)}
            onSave={(v) => save({ exploringText: v })}
            pending={pending}
          />
        ) : data.exploringText ? (
          <p className="serif text-base text-body leading-relaxed whitespace-pre-wrap">
            {data.exploringText}
          </p>
        ) : (
          <p className="serif text-base text-whisper italic">Not set.</p>
        )}
      </Section>

      {/* LOCATION PREFERENCES */}
      <Section
        title="Location"
        editing={editing === "location"}
        onEdit={() => setEditing("location")}
      >
        {editing === "location" ? (
          <LocationForm
            prefs={data.locationPreferences}
            onCancel={() => setEditing(null)}
            onSave={(prefs) => save({ locationPreferences: prefs })}
            pending={pending}
          />
        ) : (
          <LocationDisplay prefs={data.locationPreferences} />
        )}
      </Section>

      {/* OPEN-TEXT ANSWERS */}
      <Section
        title="Open-text thoughts"
        editing={editing === "answers"}
        onEdit={() => setEditing("answers")}
      >
        {editing === "answers" ? (
          <AnswersForm
            answers={data.openTextAnswers}
            onCancel={() => setEditing(null)}
            onSave={(openTextAnswers) => save({ openTextAnswers })}
            pending={pending}
          />
        ) : data.openTextAnswers.length > 0 ? (
          <ul className="space-y-5">
            {data.openTextAnswers.map((a, i) => (
              <li key={i}>
                <p className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper mb-1">
                  {a.question}
                </p>
                <p className="serif text-base text-body leading-relaxed whitespace-pre-wrap">
                  {a.answer || (
                    <span className="text-whisper italic">no answer</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="serif text-base text-whisper italic">No answers yet.</p>
        )}
      </Section>

      <p className="serif text-sm text-whisper mt-12 italic">
        Used by the lobbycat agent to ground every fit-note. Read it critically;
        tell lobbycat where it&apos;s wrong. Frames + weights live on{" "}
        <Link href="/frames" className="underline hover:text-ink">
          /frames
        </Link>
        .
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

function NameForm({
  displayName,
  onCancel,
  onSave,
  pending,
}: {
  displayName: string;
  onCancel: () => void;
  onSave: (v: string) => void;
  pending: boolean;
}) {
  const [name, setName] = useState(displayName);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave(name.trim());
      }}
    >
      <div className="eyebrow mb-4">The user</div>
      <label className="block">
        <span className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper">
          name
        </span>
        <input
          className={INPUT + " mt-1 serif text-3xl font-medium tracking-tight"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}

function ShortTextForm({
  value,
  placeholder,
  onCancel,
  onSave,
  pending,
}: {
  value: string | null;
  placeholder: string;
  onCancel: () => void;
  onSave: (v: string | null) => void;
  pending: boolean;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v.trim() || null);
      }}
    >
      <input
        className={INPUT}
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
      />
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}

function LongTextForm({
  value,
  placeholder,
  onCancel,
  onSave,
  pending,
}: {
  value: string | null;
  placeholder: string;
  onCancel: () => void;
  onSave: (v: string | null) => void;
  pending: boolean;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v.trim() || null);
      }}
    >
      <textarea
        className={TEXTAREA}
        rows={6}
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
      />
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}

function LocationDisplay({ prefs }: { prefs: LocationPrefs }) {
  const flags: { key: keyof LocationPrefs; label: string }[] = [
    { key: "uk", label: "UK" },
    { key: "eu", label: "EU" },
    { key: "us", label: "US" },
    { key: "remoteOk", label: "Remote OK" },
  ];
  const set = flags.filter((f) => prefs[f.key]);
  if (set.length === 0 && !prefs.notes) {
    return <p className="serif text-base text-whisper italic">Not set.</p>;
  }
  return (
    <div>
      {set.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {set.map((f) => (
            <li
              key={f.key}
              className="mono text-[0.65rem] uppercase tracking-[0.14em] text-moss border border-moss/40 px-2 py-1 rounded-sm"
            >
              {f.label}
            </li>
          ))}
        </ul>
      )}
      {prefs.notes && (
        <p className="serif text-sm text-body leading-relaxed mt-3">
          {prefs.notes}
        </p>
      )}
    </div>
  );
}

function LocationForm({
  prefs,
  onCancel,
  onSave,
  pending,
}: {
  prefs: LocationPrefs;
  onCancel: () => void;
  onSave: (v: LocationPrefs) => void;
  pending: boolean;
}) {
  const [uk, setUk] = useState(!!prefs.uk);
  const [eu, setEu] = useState(!!prefs.eu);
  const [us, setUs] = useState(!!prefs.us);
  const [remoteOk, setRemote] = useState(!!prefs.remoteOk);
  const [notes, setNotes] = useState(prefs.notes ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ uk, eu, us, remoteOk, notes: notes.trim() });
      }}
    >
      <div className="flex flex-wrap gap-4">
        {(
          [
            ["uk", "UK", uk, setUk],
            ["eu", "EU", eu, setEu],
            ["us", "US", us, setUs],
            ["remoteOk", "Remote OK", remoteOk, setRemote],
          ] as const
        ).map(([k, label, val, setVal]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => setVal(e.target.checked)}
              className="accent-moss"
            />
            <span className="serif text-sm text-body">{label}</span>
          </label>
        ))}
      </div>
      <label className="block mt-4">
        <span className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper">
          notes
        </span>
        <textarea
          className={TEXTAREA + " mt-1"}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. London-based, prefer hybrid"
        />
      </label>
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}

function AnswersForm({
  answers,
  onCancel,
  onSave,
  pending,
}: {
  answers: OpenTextAnswer[];
  onCancel: () => void;
  onSave: (v: OpenTextAnswer[]) => void;
  pending: boolean;
}) {
  const [rows, setRows] = useState<OpenTextAnswer[]>(
    answers.length > 0 ? answers : [{ question: "", answer: "" }],
  );

  function update(i: number, patch: Partial<OpenTextAnswer>) {
    setRows((rs) => rs.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  }
  function add() {
    setRows((rs) => [...rs, { question: "", answer: "" }]);
  }
  function remove(i: number) {
    setRows((rs) => rs.filter((_, j) => j !== i));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(rows.filter((r) => r.question.trim().length > 0));
      }}
    >
      <ul className="space-y-5">
        {rows.map((r, i) => (
          <li key={i} className="border-l-2 border-rule pl-4">
            <div className="flex items-baseline justify-between gap-3">
              <input
                className={INPUT + " mb-2"}
                value={r.question}
                onChange={(e) => update(i, { question: e.target.value })}
                placeholder="Question"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="mono text-xs text-whisper hover:text-terracotta px-2"
                aria-label="remove answer"
              >
                ×
              </button>
            </div>
            <textarea
              className={TEXTAREA}
              rows={3}
              value={r.answer}
              onChange={(e) => update(i, { answer: e.target.value })}
              placeholder="Your answer"
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mono text-[0.65rem] uppercase tracking-[0.14em] text-moss hover:text-ink mt-3"
      >
        + add answer
      </button>
      <FormActions onCancel={onCancel} pending={pending} />
    </form>
  );
}
