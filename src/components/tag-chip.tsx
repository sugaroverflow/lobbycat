export function TagChip({
  label,
  color,
}: {
  label: string;
  color?: string | null;
}) {
  return (
    <span
      className="inline-flex items-center mono text-[0.65rem] uppercase tracking-[0.1em] py-0.5 px-2 rounded-sm bg-surface-sunk text-muted"
      style={color ? { color: color } : undefined}
    >
      {label}
    </span>
  );
}
