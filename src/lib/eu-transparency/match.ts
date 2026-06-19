/**
 * Company name normalisation for matching the EU Transparency Register
 * registrant column against our `companies.name` column.
 *
 * The register lists organisations under their legal name, which often has
 * a suffix ("SAS", "GmbH", "Ltd", "Inc", "S.A.", "B.V.") and may include
 * parenthetical clarifiers. Our seed names are colloquial ("Mistral AI",
 * "Hugging Face"). Strategy: aggressively normalise both sides and compare.
 *
 * False positives are cheap (a row gets attributed to the wrong company,
 * easy to notice). False negatives are expensive (no rows = pipeline looks
 * broken). So we err on permissive: normalised exact match OR one side is a
 * prefix of the other after normalisation.
 */

const LEGAL_SUFFIXES = [
  "sas",
  "sa",
  "sl",
  "srl",
  "spa",
  "ag",
  "gmbh",
  "ug",
  "ltd",
  "limited",
  "plc",
  "llc",
  "lp",
  "llp",
  "inc",
  "corp",
  "corporation",
  "co",
  "bv",
  "nv",
  "oy",
  "ab",
  "as",
  "kk",
  "se",
  "kft",
];

export function normaliseName(raw: string): string {
  let s = raw.toLowerCase();
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip diacritics
  s = s.replace(/\([^)]*\)/g, " "); // drop parentheticals
  s = s.replace(/[^a-z0-9]+/g, " ").trim();
  // Drop trailing legal suffixes (possibly stacked: "mistral ai sas").
  const parts = s.split(" ").filter(Boolean);
  while (parts.length > 1 && LEGAL_SUFFIXES.includes(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join(" ");
}

export type CompanyKey = { id: number; slug: string; name: string };

export function buildMatcher(
  companies: CompanyKey[],
): (registrant: string) => CompanyKey | null {
  const index = new Map<string, CompanyKey>();
  for (const c of companies) {
    const n = normaliseName(c.name);
    if (n) index.set(n, c);
  }
  return (registrant: string): CompanyKey | null => {
    const n = normaliseName(registrant);
    if (!n) return null;
    // Exact normalised.
    const exact = index.get(n);
    if (exact) return exact;
    // Prefix / containment match — only if normalised key is reasonably long
    // (avoid 1-2 char false-positives like "ai" matching everything).
    for (const [key, c] of index) {
      if (key.length < 4) continue;
      if (n.startsWith(key + " ") || key.startsWith(n + " ") || n === key) {
        return c;
      }
    }
    return null;
  };
}
