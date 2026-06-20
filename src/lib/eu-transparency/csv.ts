/**
 * Minimal RFC 4180 CSV parser.
 *
 * The EU Transparency Register bulk export uses commas + double-quote escaping
 * and is small enough (~tens of MB) to fit in memory inside a Vercel cron run.
 * If we ever outgrow that we'll swap for a streaming parser; for now a single
 * pass with quoted-field support is fine.
 *
 * Returns `{ headers, rows }` where each row is a plain object keyed by header.
 * Header names are kept verbatim (case + whitespace) so callers can normalise
 * if they want.
 */

export type CsvTable = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export function parseCsv(input: string, delimiter = ","): CsvTable {
  // Strip UTF-8 BOM, normalise line endings.
  const text = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      records.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  // Trailing field / row.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  if (records.length === 0) return { headers: [], rows: [] };

  const headers = records[0].map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < records.length; i++) {
    const r = records[i];
    if (r.length === 1 && r[0] === "") continue; // blank line
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = r[c] ?? "";
    }
    rows.push(obj);
  }
  return { headers, rows };
}

/** Find the first header whose normalised form matches any candidate. */
export function pickColumn(
  headers: string[],
  candidates: string[],
): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_\-]+/g, "");
  const wanted = new Set(candidates.map(norm));
  for (const h of headers) {
    if (wanted.has(norm(h))) return h;
  }
  // Fallback: substring match on any candidate.
  for (const h of headers) {
    const n = norm(h);
    for (const c of wanted) {
      if (n.includes(c)) return h;
    }
  }
  return null;
}
