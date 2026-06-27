"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  completeWizard,
  renameWizardFrame,
  saveWizardProfile,
  saveWizardWeights,
} from "@/app/actions-wizard";
import type { FrameWeightLevel } from "@/lib/scoring/aggregate";
import {
  WizardClarifyStep,
  closeWizardClarifySession,
} from "@/components/wizard-clarify-step";

/**
 * v0.7 Step 4 — the wizard.
 *
 * Six steps, progress bar, server-action autosave per step. Step 6 fires
 * the rescore and bounces home. The full vaporwave-theatre takeover for
 * step 6 lands in Step 5 of the build (next chunk); this chunk ships the
 * functional skeleton + a basic loading state.
 */

export type WizardInitial = {
  displayName: string;
  currentRoleOneLiner: string;
  exploringText: string;
  locationPreferences: {
    uk?: boolean;
    eu?: boolean;
    us?: boolean;
    remoteOk?: boolean;
    notes?: string;
  };
  openTextAnswers: Array<{ question: string; answer: string; answeredAt: string }>;
  frames: Array<{
    id: number;
    name: string;
    description: string | null;
    lowLabel: string | null;
    highLabel: string | null;
  }>;
  weights: Record<string, FrameWeightLevel>;
  companyCount: number;
  firstScoringQuotes: string[];
  replay: boolean;
};

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Welcome",
  "Profile",
  "Frames",
  "Weighing",
  "Thoughts",
  "Scoring",
];

const WEIGHT_LEVELS: FrameWeightLevel[] = ["low", "medium", "high"];
const WEIGHT_COPY: Record<FrameWeightLevel, { glyph: string; label: string }> = {
  high: { glyph: "M", label: "Must" },
  medium: { glyph: "S", label: "Should" },
  low: { glyph: "C", label: "Could" },
};

// v0.7's DEFAULT_OPEN_PROMPTS for the step-5 textareas was removed in
// v0.8 step 7 — the textareas are replaced by a seeded clarify session
// run by the cat (see WizardClarifyStep). Historical openTextAnswers
// payloads on existing user profiles are preserved by the DB schema;
// nothing rendered today reads them, but a future migration can roll
// them into a synthetic clarify_session if we want continuity.

export function Wizard({ initial }: { initial: WizardInitial }) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  return (
    <section className="max-w-[60rem] mx-auto px-6 pt-10 pb-24">
      {step < 6 && <ProgressBar step={step} />}
      <div className={step < 6 ? "mt-8" : "mt-0"}>
        {step === 1 && <Step1Welcome onNext={() => setStep(2)} replay={initial.replay} />}
        {step === 2 && (
          <Step2Profile
            initial={initial}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3Frames
            frames={initial.frames}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4Weighing
            frames={initial.frames}
            initialWeights={initial.weights}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <Step5OpenText
            displayName={initial.displayName ?? ""}
            onBack={() => setStep(4)}
            onNext={() => setStep(6)}
          />
        )}
        {step === 6 && (
          <Step6BigMoment
            companyCount={initial.companyCount}
            quotes={initial.firstScoringQuotes}
            onDone={() => router.push("/")}
          />
        )}
      </div>
    </section>
  );
}

/* ---------------- progress bar ---------------- */

function ProgressBar({ step }: { step: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-prose-muted">
        <span>step {step} / {TOTAL_STEPS}</span>
        <span>{STEP_LABELS[step - 1]}</span>
      </div>
      <div className="mt-2 h-[3px] w-full bg-panel-sunk overflow-hidden">
        <div
          className="h-full bg-action transition-[width] duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------- step 1 ---------------- */

function Step1Welcome({ onNext, replay }: { onNext: () => void; replay: boolean }) {
  return (
    <div className="relative overflow-hidden border border-rule bg-panel p-10 sm:p-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 55%, rgba(255,153,0,0.35) 75%, rgba(255,51,204,0.45) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(0,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px, 32px 32px",
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 60%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 60%, black 100%)",
          perspective: "600px",
          transform: "rotateX(60deg)",
          transformOrigin: "center bottom",
        }}
      />
      <div className="relative">
        <div className="eyebrow mb-3">{replay ? "Replaying" : "Welcome"}</div>
        <h1 className="font-sans text-4xl sm:text-5xl text-prose tracking-tight">
          Hi. I&apos;m lobbycat.
        </h1>
        <p className="mt-6 max-w-xl text-prose-soft leading-relaxed">
          I&apos;m going to ask you six small things, then score 70-ish companies
          against your frames in front of you. Takes five to seven minutes.
          Nothing here is final — you can come back and change any of it later.
        </p>
        <p className="mt-4 max-w-xl text-prose-muted text-sm">
          We autosave each step. Close the tab and come back — you&apos;ll pick up
          where you left off.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="mt-8 inline-flex items-center gap-2 border border-action bg-action text-canvas px-5 py-2.5 text-sm tracking-wide uppercase hover:bg-action-hover transition"
        >
          Begin →
        </button>
      </div>
    </div>
  );
}

/* ---------------- step 2 ---------------- */

function Step2Profile({
  initial,
  onBack,
  onNext,
}: {
  initial: WizardInitial;
  onBack: () => void;
  onNext: () => void;
}) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [currentRoleOneLiner, setCurrentRoleOneLiner] = useState(
    initial.currentRoleOneLiner,
  );
  const [exploringText, setExploringText] = useState(initial.exploringText);
  const [loc, setLoc] = useState(initial.locationPreferences ?? {});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");

  const debouncedSave = useDebouncedSave(() => {
    setSaved("saving");
    startTransition(async () => {
      await saveWizardProfile({
        displayName,
        currentRoleOneLiner,
        exploringText,
        locationPreferences: loc,
      });
      setSaved("saved");
      setTimeout(() => setSaved("idle"), 1500);
    });
  }, 600);

  // Autosave whenever any field changes.
  useEffect(() => {
    debouncedSave();
  }, [displayName, currentRoleOneLiner, exploringText, loc, debouncedSave]);

  const canNext = displayName.trim().length > 0;

  return (
    <StepCard
      eyebrow="Step 2 — Profile"
      title="Who are you, roughly?"
      saved={saved}
      onBack={onBack}
      onNext={async () => {
        await saveWizardProfile({
          displayName,
          currentRoleOneLiner,
          exploringText,
          locationPreferences: loc,
        });
        onNext();
      }}
      nextDisabled={!canNext || pending}
    >
      <Field label="What should I call you?">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Aadi"
          className="w-full border border-rule bg-panel-raised px-3 py-2 text-prose focus:outline-none focus:border-action"
        />
      </Field>
      <Field label="Current role, in one line">
        <input
          type="text"
          value={currentRoleOneLiner ?? ""}
          onChange={(e) => setCurrentRoleOneLiner(e.target.value)}
          placeholder="Policy lead at a UK AI safety org"
          className="w-full border border-rule bg-panel-raised px-3 py-2 text-prose focus:outline-none focus:border-action"
        />
      </Field>
      <Field
        label="What are you exploring?"
        hint="A paragraph is fine. This shapes how I read every company below."
      >
        <textarea
          value={exploringText ?? ""}
          onChange={(e) => setExploringText(e.target.value)}
          rows={4}
          placeholder="I'm looking at frontier-safety policy roles in London or Brussels, ideally where I'd be doing public-facing work rather than internal red-teaming."
          className="w-full border border-rule bg-panel-raised px-3 py-2 text-prose focus:outline-none focus:border-action"
        />
      </Field>
      <Field label="Where would you actually work?">
        <div className="flex flex-wrap gap-2">
          {([
            ["uk", "UK"],
            ["eu", "EU"],
            ["us", "US"],
            ["remoteOk", "Remote OK"],
          ] as const).map(([key, label]) => {
            const on = !!(loc as Record<string, boolean | string | undefined>)[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setLoc((p) => ({ ...p, [key]: !on }))}
                className={`px-3 py-1.5 text-xs uppercase tracking-wide border transition ${
                  on
                    ? "bg-action text-canvas border-action"
                    : "bg-panel-raised text-prose-soft border-rule hover:border-action"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={loc.notes ?? ""}
          onChange={(e) => setLoc((p) => ({ ...p, notes: e.target.value }))}
          placeholder="anything else worth knowing about location"
          className="mt-3 w-full border border-rule bg-panel-raised px-3 py-2 text-sm text-prose focus:outline-none focus:border-action"
        />
      </Field>
    </StepCard>
  );
}

/* ---------------- step 3 ---------------- */

function Step3Frames({
  frames,
  onBack,
  onNext,
}: {
  frames: WizardInitial["frames"];
  onBack: () => void;
  onNext: () => void;
}) {
  const [names, setNames] = useState<Record<number, string>>(
    () => Object.fromEntries(frames.map((f) => [f.id, f.name])),
  );
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");

  const onRename = useCallback(
    async (id: number, value: string) => {
      setNames((p) => ({ ...p, [id]: value }));
      setSaved("saving");
      await renameWizardFrame(id, value);
      setSaved("saved");
      setTimeout(() => setSaved("idle"), 1500);
    },
    [],
  );

  return (
    <StepCard
      eyebrow="Step 3 — Frames"
      title="The six things you care about."
      subtitle="These are the axes I&rsquo;ll score every company on. Rename any of them so the language fits how you actually think. Full edits (descriptions, new frames) live on the Frames page."
      saved={saved}
      onBack={onBack}
      onNext={onNext}
    >
      <ul className="divide-y divide-rule border border-rule bg-panel-raised">
        {frames.map((f, i) => (
          <li key={f.id} className="p-4 flex gap-4 items-start">
            <div className="text-prose-muted font-mono text-xs pt-1 w-6">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0">
              <input
                value={names[f.id] ?? f.name}
                onChange={(e) =>
                  setNames((p) => ({ ...p, [f.id]: e.target.value }))
                }
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== f.name) {
                    onRename(f.id, e.target.value);
                  }
                }}
                className="w-full bg-transparent text-prose text-base font-medium border-b border-transparent focus:border-action focus:outline-none px-0 py-1"
              />
              {f.description && (
                <p className="mt-1 text-sm text-prose-soft leading-relaxed">
                  {f.description}
                </p>
              )}
              {(f.lowLabel || f.highLabel) && (
                <p className="mt-1 text-xs text-prose-muted">
                  <span className="font-mono">{f.lowLabel ?? "low"}</span>
                  <span className="mx-2 opacity-60">→</span>
                  <span className="font-mono">{f.highLabel ?? "high"}</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-prose-muted">
        Want to add a new frame, or change descriptions?{" "}
        <Link href="/frames" className="text-action underline">
          Edit on the Frames page →
        </Link>{" "}
        (opens in a new tab is fine — autosave preserves your wizard state.)
      </p>
    </StepCard>
  );
}

/* ---------------- step 4 ---------------- */

function Step4Weighing({
  frames,
  initialWeights,
  onBack,
  onNext,
}: {
  frames: WizardInitial["frames"];
  initialWeights: Record<string, FrameWeightLevel>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [weights, setWeights] = useState<Record<string, FrameWeightLevel>>(
    () => {
      const seed: Record<string, FrameWeightLevel> = {};
      for (const f of frames) {
        seed[String(f.id)] = initialWeights[String(f.id)] ?? "medium";
      }
      return seed;
    },
  );
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");

  const onSet = useCallback(
    async (frameId: number, level: FrameWeightLevel) => {
      setWeights((p) => ({ ...p, [String(frameId)]: level }));
      setSaved("saving");
      await saveWizardWeights({ [String(frameId)]: level });
      setSaved("saved");
      setTimeout(() => setSaved("idle"), 1500);
    },
    [],
  );

  return (
    <StepCard
      eyebrow="Step 4 — Weighing"
      title="What matters how much?"
      subtitle="Must / Should / Could. Picture three companies you&rsquo;d look at. Which of these would you actually walk away over?"
      saved={saved}
      onBack={onBack}
      onNext={onNext}
    >
      <ul className="divide-y divide-rule border border-rule bg-panel-raised">
        {frames.map((f) => {
          const current = weights[String(f.id)] ?? "medium";
          return (
            <li key={f.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-prose font-medium">{f.name}</div>
                  {f.description && (
                    <p className="mt-1 text-sm text-prose-soft leading-relaxed">
                      {f.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {WEIGHT_LEVELS.map((lvl) => {
                    const active = current === lvl;
                    const copy = WEIGHT_COPY[lvl];
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => onSet(f.id, lvl)}
                        title={copy.label}
                        className={`px-3 py-2 text-xs uppercase tracking-wide border transition ${
                          active
                            ? "bg-action text-canvas border-action"
                            : "bg-panel text-prose-soft border-rule hover:border-action"
                        }`}
                      >
                        {copy.glyph}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 text-xs text-prose-muted">
        <span className="font-mono">M</span> Must · {" "}
        <span className="font-mono">S</span> Should ·{" "}
        <span className="font-mono">C</span> Could
      </div>
    </StepCard>
  );
}

/* ---------------- step 5 ---------------- */

function Step5OpenText({
  displayName,
  onBack,
  onNext,
}: {
  displayName: string;
  onBack: () => void;
  onNext: () => void;
}) {
  // v0.8 Step 7: the open-text textarea graveyard is replaced by a
  // seeded 3-question clarify session. The embedded WizardClarifyStep
  // owns its own session lifecycle; when the user clicks Score it →
  // we fire `closeWizardClarifySession()` so the row is cleanly closed
  // server-side before advancing. (A7.1 / A7.2 in ASSUMPTIONS-v0.8.md.)
  const [advancing, setAdvancing] = useState(false);

  return (
    <StepCard
      eyebrow="Step 5 — Thoughts"
      title="What&rsquo;s making this hard?"
      subtitle="Lobbycat will ask a few quick questions before we score. Skip if you&rsquo;d rather just see the dashboard."
      saved="idle"
      onBack={onBack}
      onNext={async () => {
        if (advancing) return;
        setAdvancing(true);
        await closeWizardClarifySession();
        onNext();
      }}
      nextDisabled={advancing}
      nextLabel="Score it →"
    >
      <WizardClarifyStep displayName={displayName} />
    </StepCard>
  );
}

/* ---------------- step 6 ---------------- */

function Step6BigMoment({
  companyCount,
  quotes,
  onDone,
}: {
  companyCount: number;
  quotes: string[];
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [fired, setFired] = useState(false);
  const firedRef = useRef(false);

  // Kick off the rescore + wizardCompletedAt flip on mount.
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    completeWizard()
      .then(() => setFired(true))
      .catch(() => setFired(true));
  }, []);

  // ~25s theatre window, regardless of when completeWizard returns.
  useEffect(() => {
    const start = Date.now();
    const duration = 25_000;
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(id);
        // Small beat, then home.
        window.setTimeout(onDone, 800);
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [onDone]);

  // Cycle quotes every ~3.5s.
  useEffect(() => {
    if (quotes.length === 0) return;
    const id = window.setInterval(() => {
      setQuoteIdx((i) => (i + 1) % quotes.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, [quotes.length]);

  const scoredApprox = Math.floor(progress * companyCount);
  const quote = quotes[quoteIdx] ?? "scoring…";

  // Full-screen vaporwave-theatre takeover. Covers the wizard shell.
  return (
    <div
      role="dialog"
      aria-label="lobbycat is scoring companies"
      className="vw-theatre fixed inset-0 overflow-hidden"
      style={{
        zIndex: "var(--z-modal, 210)",
        background:
          "radial-gradient(ellipse at center 28%, rgba(255,51,204,0.30), transparent 65%), linear-gradient(180deg, #0a0420 0%, #1a0840 55%, #ff3399 88%, #ff9900 100%)",
      }}
    >
      {/* Sun disc behind cat */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[22%] -translate-x-1/2"
        style={{
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, #FFEE66 0%, #FF9900 40%, #FF00FF 75%, transparent 80%)",
          filter: "blur(2px)",
          opacity: 0.85,
        }}
      />

      {/* Perspective grid floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 vw-grid"
        style={{
          height: "60%",
          backgroundImage:
            "linear-gradient(0deg, rgba(0,255,255,0.85) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,255,0.85) 1px, transparent 1px)",
          backgroundSize: "60px 60px, 60px 60px",
          backgroundPosition: "center bottom",
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 35%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 35%, black 100%)",
          transform: "perspective(700px) rotateX(62deg)",
          transformOrigin: "center bottom",
        }}
      />

      {/* Scanlines overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "multiply",
          opacity: 0.55,
        }}
      />

      {/* Centre content */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6 text-center">
        <div
          className="mono text-[0.7rem] sm:text-xs tracking-[0.4em] uppercase"
          style={{ color: "#00FFFF", textShadow: "var(--vw-glow-cyan)" }}
        >
          ▸ step 6 / 6 · scoring
        </div>

        <h1
          className="mt-6 font-sans text-3xl sm:text-5xl tracking-[0.08em] uppercase"
          style={{
            background: "var(--vw-sunset-gradient)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 0 18px rgba(255,0,255,0.55))",
          }}
        >
          lobbycat is meeting the world
        </h1>

        <div className="vw-cat mt-10 sm:mt-12">
          <Image
            src="/cat/lobbycat.png"
            alt=""
            width={180}
            height={180}
            className="block"
            priority
          />
        </div>

        <div
          className="mt-10 max-w-2xl mx-auto serif italic text-xl sm:text-2xl leading-snug min-h-[3.5rem]"
          style={{ color: "#FFEEFF", textShadow: "0 0 12px rgba(255,0,255,0.45)" }}
          key={quoteIdx}
        >
          “{quote}”
        </div>

        <div className="mt-12 w-full max-w-lg mx-auto">
          <div
            className="h-[3px] w-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <div
              className="h-full transition-[width] duration-150"
              style={{
                width: `${progress * 100}%`,
                background: "var(--vw-sunset-gradient)",
                boxShadow: "var(--vw-glow-magenta)",
              }}
            />
          </div>
          <div
            className="mt-3 mono text-[0.7rem] sm:text-xs tracking-[0.3em] uppercase"
            style={{ color: "#00FFFF" }}
          >
            {fired
              ? `${scoredApprox} / ${companyCount} companies scored`
              : "warming up the engines…"}
          </div>
        </div>
      </div>

      <style jsx>{`
        .vw-cat {
          animation: vw-cat-float 2.4s ease-in-out infinite;
          filter: drop-shadow(0 0 24px rgba(255, 0, 255, 0.55))
            drop-shadow(0 0 8px rgba(0, 255, 255, 0.35));
        }
        .vw-cat :global(img) {
          image-rendering: pixelated;
        }
        .vw-grid {
          animation: vw-grid-scroll 4s linear infinite;
        }
        @keyframes vw-cat-float {
          0%,
          100% {
            transform: translateY(0) rotate(-1.5deg);
          }
          50% {
            transform: translateY(-10px) rotate(1.5deg);
          }
        }
        @keyframes vw-grid-scroll {
          0% {
            background-position: 0 0, 0 0;
          }
          100% {
            background-position: 0 60px, 0 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vw-cat,
          .vw-grid {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------- shared atoms ---------------- */

function StepCard({
  eyebrow,
  title,
  subtitle,
  children,
  saved,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Next →",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  saved: "idle" | "saving" | "saved";
  onBack: () => void;
  onNext: () => void | Promise<void>;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="border border-rule bg-panel p-6 sm:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">{eyebrow}</div>
          <h1 className="font-sans text-3xl sm:text-4xl text-prose tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-3 max-w-2xl text-prose-soft leading-relaxed"
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          )}
        </div>
        <SaveBadge saved={saved} />
      </div>
      <div className="mt-8 space-y-5">{children}</div>
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs uppercase tracking-wide text-prose-muted hover:text-prose"
        >
          ← Back
        </button>
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => onNext()}
          className="inline-flex items-center gap-2 border border-action bg-action text-canvas px-5 py-2.5 text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-action-hover transition"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-prose-soft mb-2">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-prose-muted">{hint}</p>}
    </div>
  );
}

function SaveBadge({ saved }: { saved: "idle" | "saving" | "saved" }) {
  if (saved === "idle") return null;
  return (
    <div className="text-[10px] uppercase tracking-[0.2em] text-prose-muted font-mono shrink-0 pt-2">
      {saved === "saving" ? "saving…" : "saved ✓"}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function useDebouncedSave(fn: () => void, delay: number) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(), delay);
  }, [delay]);
}
