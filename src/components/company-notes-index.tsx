import Link from "next/link";

type NoteRow = {
  id: number;
  companyId: number;
  body: string;
  updatedAt: Date;
  companyName: string;
  companySlug: string;
};

function snippet(body: string, max = 220) {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : flat.slice(0, max).trimEnd() + "…";
}

function formatWhen(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CompanyNotesIndex({ notes }: { notes: NoteRow[] }) {
  return (
    <section className="max-w-[42rem] mx-auto px-6 pb-16">
      <h2 className="eyebrow mb-3 pb-2 border-b border-rule">
        Your notes ({notes.length})
      </h2>
      {notes.length === 0 ? (
        <p className="serif text-sm text-muted">
          No notes yet. Write one on any company page — it&rsquo;ll surface
          here so you can find it later.
        </p>
      ) : (
        <ul className="divide-y divide-rule">
          {notes.map((n) => (
            <li key={n.id} className="py-4">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <Link
                  href={`/companies/${n.companySlug}`}
                  className="serif text-base text-ink hover:underline"
                >
                  {n.companyName}
                </Link>
                <span className="mono text-[10px] uppercase tracking-[0.1em] text-whisper">
                  {formatWhen(n.updatedAt)}
                </span>
              </div>
              <p className="serif text-sm text-muted leading-relaxed">
                {snippet(n.body)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
