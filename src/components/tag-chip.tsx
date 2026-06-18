/**
 * Tag pill.
 *
 * v0.3 step 2c: pill colours are keyed off the human-readable labels we now
 * store in the DB (`Hiring policy lead`, `Frontier lab`, …). Geography pills
 * (UK/EU/US) stay deliberately neutral per the refactor spec. Unknown labels
 * still render with the legacy DB `color` prop applied to the text on a
 * neutral wash, so any new tag added through the UI degrades gracefully.
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
  "Hiring policy lead": { bg: "bg-terracotta-soft", text: "text-terracotta" },
  "First policy hire": { bg: "bg-ochre-soft", text: "text-ochre" },
  "Established team": { bg: "bg-mushroom-soft", text: "text-mushroom" },
  // lab / product shape
  "Frontier lab": { bg: "bg-sage-soft", text: "text-moss" },
  "Voice / media AI": { bg: "bg-sage-soft", text: "text-sage-dark" },
  "Agentic / coding AI": { bg: "bg-sage-soft", text: "text-sage-dark" },
  "Autonomous / mobility": { bg: "bg-sage-soft", text: "text-sage-dark" },
  "Open weights": { bg: "bg-sage-soft", text: "text-moss" },
  // geography — neutral by design (per refactor spec)
  UK: NEUTRAL,
  EU: NEUTRAL,
  US: NEUTRAL,
};

export function TagChip({
  label,
  color,
}: {
  label: string;
  color?: string | null;
}) {
  const variant = VARIANTS[label];
  // Labels are now human-readable sentences (mixed case). Drop the uppercase
  // transform so `Hiring policy lead` reads as a sentence, not a shout.
  const base =
    "inline-flex items-center mono text-[0.7rem] tracking-[0.04em] py-1 px-2.5 rounded-full";

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
