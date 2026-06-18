"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type CompanyOption = { id: number; slug: string; name: string };

export function CompareForm({
  companies,
  initialSelected,
}: {
  companies: CompanyOption[];
  initialSelected: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected),
  );

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const slugs = Array.from(selected);
    router.push("/compare" + (slugs.length ? `?slugs=${slugs.join(",")}` : ""));
  }

  return (
    <form className="mt-8" onSubmit={onSubmit}>
      <div className="eyebrow mb-2">Select companies</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {companies.map((c) => (
          <label
            key={c.id}
            className="flex items-center gap-2 mono text-xs text-muted hover:text-ink cursor-pointer"
          >
            <input
              type="checkbox"
              value={c.slug}
              checked={selected.has(c.slug)}
              onChange={() => toggle(c.slug)}
              className="accent-accent"
            />
            {c.name}
          </label>
        ))}
      </div>
      <button
        type="submit"
        className="mt-4 mono text-xs uppercase tracking-[0.14em] px-4 py-2 bg-ink text-white rounded-sm hover:bg-accent transition"
      >
        Compare ↗
      </button>
    </form>
  );
}
