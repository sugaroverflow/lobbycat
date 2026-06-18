"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CatMark } from "@/components/wordmark";
import {
  addDefaultOnboardingQuestions,
  DEFAULT_ONBOARDING_QUESTIONS,
} from "@/app/actions-onboarding";

const COOKIE_NAME = "lc_onboarded";
const COOKIE_MAX_AGE_DAYS = 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

type Step = 1 | 2 | 3 | 4;

const STEPS: Array<{
  eyebrow: string;
  title: string;
  body: string;
}> = [
  {
    eyebrow: "Step 1 of 4 — the room",
    title: "A map up top, a tracker below.",
    body: "The map plots companies on any two of your scale frames; the tracker lists who's hiring and who's publishing. Filters on either side narrow both views to the slice you care about.",
  },
  {
    eyebrow: "Step 2 of 4 — frames",
    title: "Frames are the lenses you look through.",
    body: "Three kinds: scales (1–5 axes you can plot on the map), tags (categorical labels), and questions (open-ended prompts you answer in your own words). Edit, rename, or invent new ones whenever your thinking shifts.",
  },
  {
    eyebrow: "Step 3 of 4 — the tracker",
    title: "Roles + publications, sortable and filterable.",
    body: "Who's currently hiring, what they last wrote, which tier they sit in. Use the chips to filter by tier, HQ, tag, or hiring status. Sortable on every column.",
  },
  {
    eyebrow: "Step 4 of 4 — three to get you started",
    title: "Some opening questions from the cat.",
    body: "These are three default question-kind frames you can answer per company. Add them now and you'll find them ready in /frames; skip if you'd rather invent your own.",
  },
];

export function OnboardingOverlay() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only show once. Cookie is the source of truth; we render after mount so
    // SSR + the gate stay decoupled.
    if (readCookie(COOKIE_NAME)) return;
    setOpen(true);
  }, []);

  function dismiss() {
    writeCookie(COOKIE_NAME, "1");
    setOpen(false);
  }

  function next() {
    if (step < 4) setStep(((step as number) + 1) as Step);
    else dismiss();
  }

  function back() {
    if (step > 1) setStep(((step as number) - 1) as Step);
  }

  function addDefaults() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await addDefaultOnboardingQuestions();
        setAddedCount(result.added);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't add the questions.");
      }
    });
  }

  if (!open) return null;

  const meta = STEPS[step - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-xl bg-surface border border-rule shadow-xl rounded-sm">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss onboarding"
          className="absolute top-3 right-3 mono text-xs text-muted hover:text-ink"
        >
          ×
        </button>

        <div className="px-8 pt-8 pb-2 flex items-baseline gap-3">
          <CatMark size={28} />
          <span className="eyebrow">{meta.eyebrow}</span>
        </div>

        <div className="px-8 pt-2 pb-6">
          <h2
            id="onboarding-title"
            className="serif text-2xl sm:text-3xl font-medium leading-[1.1] tracking-tight text-ink"
          >
            {meta.title}
          </h2>
          <p className="serif mt-4 text-base text-muted leading-relaxed">
            {meta.body}
          </p>

          {step === 4 && (
            <div className="mt-5 border-t border-rule pt-4">
              <ul className="space-y-3">
                {DEFAULT_ONBOARDING_QUESTIONS.map((q) => (
                  <li key={q.name}>
                    <div className="serif text-sm text-ink font-medium">
                      {q.name}
                    </div>
                    <div className="serif text-sm text-muted leading-snug">
                      {q.description}
                    </div>
                  </li>
                ))}
              </ul>

              {addedCount !== null && (
                <div className="mt-4 mono text-xs text-accent">
                  {addedCount > 0
                    ? `added ${addedCount} question${addedCount === 1 ? "" : "s"} to your frames`
                    : "already in your frames — nothing to add"}
                </div>
              )}
              {error && (
                <div className="mt-4 mono text-xs text-warm">{error}</div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={addDefaults}
                  disabled={pending || addedCount !== null}
                  className="px-3 py-1.5 mono text-xs bg-moss text-surface hover:bg-moss/90 disabled:opacity-50"
                >
                  {pending ? "adding…" : "add these to my frames"}
                </button>
                <Link
                  href="/frames"
                  onClick={dismiss}
                  className="mono text-xs text-accent underline"
                >
                  open /frames →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-rule px-8 py-4">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                aria-hidden
                className={`h-1.5 w-6 rounded-full ${
                  i === step
                    ? "bg-moss"
                    : i < step
                      ? "bg-moss/40"
                      : "bg-rule"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="mono text-xs text-muted hover:text-ink px-2 py-1"
            >
              skip
            </button>
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="mono text-xs text-muted hover:text-ink px-2 py-1"
              >
                back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="mono text-xs bg-moss text-surface hover:bg-moss/90 px-3 py-1.5"
            >
              {step === 4 ? "done" : "next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
