/**
 * Tag pill.
 *
 * v0.3 step 2b: bigger, rounder pills + a slug-keyed colour map keyed on the
 * v0.2 taxonomy. The human-readable taxonomy rewrite (step 2c) will land via a
 * seed-data slug → label rewrite; this component keeps a label-text fallback
 * so unknown labels still render with the legacy `color` prop applied to the
 * text on a neutral wash.
 */

type Variant = {
  bg: string;
  text: string;
};

const NEUTRAL: Variant = {
  bg: "bg-surface-sunk",
  text: "text-muted",
};

const VARIANTS: Record<string, Variant> = {
  // policy posture
  "hiring-policy": { bg: "bg-terracotta-soft", text: "text-terracotta" },
  "first-policy-hire": { bg: "bg-ochre-soft", text: "text-ochre" },
  "established-policy-team": { bg: "bg-mushroom-soft", text: "text-mushroom" },
  // lab / product shape
  "frontier-lab": { bg: "bg-sage-soft", text: "text-moss" },
  "voice-AI": { bg: "bg-sage-soft", text: "text-sage-dark" },
  agentic: { bg: "bg-sage-soft", text: "text-sage-dark" },
  "self-driving": { bg: "bg-sage-soft", text: "text-sage-dark" },
  "open-weights": { bg: "bg-sage-soft", text: "text-moss" },
  // geography — neutral by design (per refactor spec)
  "UK-HQ": NEUTRAL,
  "EU-HQ": NEUTRAL,
  "US-HQ": NEUTRAL,
};

export function TagChip({
  label,
  color,
}: {
  label: string;
  color?: string | null;
}) {
  const variant = VARIANTS[label];
  const base =
    "inline-flex items-center mono text-[0.7rem] uppercase tracking-[0.08em] py-1 px-2.5 rounded-full";

  if (variant) {
    return (
      <span className={`${base} ${variant.bg} ${variant.text}`}>{label}</span>
    );
  }

  // Unknown label — keep the legacy DB-provided colour, soft neutral background.
  return (
    <span
      className={`${base} ${NEUTRAL.bg}`}
      style={color ? { color } : undefined}
    >
      {label}
    </span>
  );
}
