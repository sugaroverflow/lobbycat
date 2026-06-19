"use client";

import { useState, useTransition } from "react";
import {
  proposeNextRoleChanges,
  applyNextRoleChanges,
  type NextRoleProposal,
  type WeightChangeProposal,
  type ConcernChangeProposal,
} from "@/app/actions-next-role";

const LABEL = "mono text-[0.65rem] uppercase tracking-[0.16em] text-whisper";

export function NextRoleForm() {
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState<NextRoleProposal | null>(null);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [acceptedConcerns, setAcceptedConcerns] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();
  const [applied, setApplied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    setErr(null);
    setApplied(false);
    startTransition(async () => {
      const p = await proposeNextRoleChanges(text);
      setProposal(p);
      if (p.ok) {
        // default to all accepted; Aadi unchecks the ones he doesn't want
        setAccepted(new Set(p.weightChanges.map((_, i) => i)));
        setAcceptedConcerns(new Set(p.concernChanges.map((_, i) => i)));
      }
    });
  }

  function apply() {
    if (!proposal?.ok) return;
    const weightPicks = proposal.weightChanges
      .filter((_, i) => accepted.has(i))
      .map((c) => ({ key: c.key, to: c.to }));
    const concernPicks = proposal.concernChanges.filter((_, i) =>
      acceptedConcerns.has(i),
    );
    setErr(null);
    startTransition(async () => {
      const res = await applyNextRoleChanges(weightPicks, concernPicks);
      if (!res.ok) setErr(res.error);
      else {
        setApplied(true);
        // freeze the panel; force a reload so the underlying ProfileEditor reflects new weights
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  }

  return (
    <section className="max-w-[42rem] mx-auto px-6 pt-4 pb-10">
      <div className="border-t border-whisper/40 pt-8">
        <h2 className={LABEL + " mb-3"}>What I&apos;m looking for in my next role</h2>
        <p className="serif text-sm text-muted mb-4">
          Tell the cat in your own words. It&apos;ll propose tweaks to your weights; you accept or reject each one.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="I&apos;m drawn to roles where I&apos;d define the policy function rather than maintain an existing one…"
          className="w-full border border-whisper/60 rounded-sm px-3 py-2 serif text-base bg-paper focus:outline-none focus:border-moss"
          disabled={pending}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={pending || !text.trim()}
            className="mono text-xs uppercase tracking-[0.14em] px-3 py-1.5 border border-ink hover:bg-ink hover:text-paper disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending && !proposal ? "asking the cat…" : "ask the cat"}
          </button>
          {proposal && (
            <button
              onClick={() => {
                setProposal(null);
                setAccepted(new Set());
                setAcceptedConcerns(new Set());
                setApplied(false);
                setErr(null);
              }}
              className="mono text-xs uppercase tracking-[0.14em] text-whisper hover:text-ink"
            >
              start over
            </button>
          )}
        </div>

        {err && (
          <p className="mt-4 mono text-xs text-terracotta border-l-2 border-terracotta pl-3">{err}</p>
        )}

        {proposal && !proposal.ok && (
          <p className="mt-4 mono text-xs text-terracotta border-l-2 border-terracotta pl-3">
            {proposal.error}
          </p>
        )}

        {proposal?.ok && (
          <div className="mt-8">
            <h3 className={LABEL + " mb-3"}>lobbycat suggests</h3>

            {proposal.concernChanges.length > 0 && (
              <div className="mb-6">
                <h4 className={LABEL + " mb-2 text-whisper"}>concerns</h4>
                <ul className="space-y-3">
                  {proposal.concernChanges.map((c, i) => (
                    <ConcernRow
                      key={i}
                      change={c}
                      accepted={acceptedConcerns.has(i)}
                      onToggle={() => {
                        const next = new Set(acceptedConcerns);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        setAcceptedConcerns(next);
                      }}
                      disabled={applied}
                    />
                  ))}
                </ul>
              </div>
            )}

            {proposal.concernChanges.length > 0 && proposal.weightChanges.length > 0 && (
              <h4 className={LABEL + " mb-2 text-whisper"}>weights</h4>
            )}
            <ul className="space-y-3">
              {proposal.weightChanges.length === 0 && proposal.concernChanges.length === 0 && (
                <li className="serif text-sm text-muted">
                  The cat didn&apos;t see anything in your note that warrants a change. That&apos;s a fine answer.
                </li>
              )}
              {proposal.weightChanges.map((c, i) => (
                <ProposalRow
                  key={i}
                  change={c}
                  accepted={accepted.has(i)}
                  onToggle={() => {
                    const next = new Set(accepted);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    setAccepted(next);
                  }}
                  disabled={applied}
                />
              ))}
            </ul>

            {(proposal.weightChanges.length > 0 || proposal.concernChanges.length > 0) && !applied && (
              <button
                onClick={apply}
                disabled={pending || (accepted.size === 0 && acceptedConcerns.size === 0)}
                className="mt-5 mono text-xs uppercase tracking-[0.14em] px-3 py-1.5 border border-moss bg-moss text-paper hover:bg-ink hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending
                  ? "applying…"
                  : `apply ${accepted.size + acceptedConcerns.size} change${accepted.size + acceptedConcerns.size === 1 ? "" : "s"}`}
              </button>
            )}

            {applied && (
              <p className="mt-5 mono text-xs uppercase tracking-[0.14em] text-moss">
                applied — refreshing…
              </p>
            )}

            <p className="serif text-sm text-muted mt-6 italic border-l-2 border-moss/40 pl-3">
              {proposal.summary}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ConcernRow({
  change,
  accepted,
  onToggle,
  disabled,
}: {
  change: ConcernChangeProposal;
  accepted: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const label =
    change.op === "add" ? "add" : change.op === "remove" ? "remove" : "edit";
  return (
    <li className="flex items-start gap-3 border border-whisper/40 px-3 py-2">
      <input
        type="checkbox"
        checked={accepted}
        onChange={onToggle}
        disabled={disabled}
        className="mt-1.5 accent-moss"
        aria-label={`Accept ${label} concern: ${change.text}`}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper">
            {label}
          </span>
          {change.op === "edit" ? (
            <span className="serif text-sm">
              <span className="line-through text-whisper">{change.from}</span>{" "}
              <span className="text-moss">→ {change.text}</span>
            </span>
          ) : (
            <span
              className={`serif text-sm ${change.op === "remove" ? "line-through text-whisper" : "text-moss"}`}
            >
              {change.text}
            </span>
          )}
        </div>
        <p className="serif text-sm text-muted mt-1">{change.reason}</p>
      </div>
    </li>
  );
}

function ProposalRow({
  change,
  accepted,
  onToggle,
  disabled,
}: {
  change: WeightChangeProposal;
  accepted: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const isNew = change.from === null;
  return (
    <li className="flex items-start gap-3 border border-whisper/40 px-3 py-2">
      <input
        type="checkbox"
        checked={accepted}
        onChange={onToggle}
        disabled={disabled}
        className="mt-1.5 accent-moss"
        aria-label={`Accept change to ${change.key}`}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="serif text-sm font-medium">{change.key}</span>
          <span className="mono text-[0.65rem] uppercase tracking-[0.14em] text-whisper">
            {isNew ? "new" : `${change.from}`} → <span className="text-moss">{change.to}</span>
          </span>
        </div>
        <p className="serif text-sm text-muted mt-1">{change.reason}</p>
      </div>
    </li>
  );
}
