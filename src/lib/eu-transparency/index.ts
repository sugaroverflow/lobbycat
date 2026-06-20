import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, lobbyingRecords } from "@/db/schema";
import { parseCsv, pickColumn } from "./csv";
import { buildMatcher, type CompanyKey } from "./match";

export const DEFAULT_REGISTER_URL =
  "https://ec.europa.eu/transparencyregister/public/openFile.do?fileName=full_export.csv";

export type EuRegisterResult = {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  sourceUrl: string;
  rowsParsed: number;
  rowsMatched: number;
  inserted: number;
  updated: number;
  matches: Array<{
    companyId: number;
    companySlug: string;
    registrant: string;
    period: string;
    spendEur: number | null;
  }>;
  headers: string[];
  /** Note: when the upstream feed is empty / 404, this is set. */
  warning?: string;
};

function parseSpendToEur(raw: string | undefined): number | null {
  if (!raw) return null;
  // Register columns sometimes carry ranges like "100 000 - 199 999". Take the
  // low end as a defensible lower bound. Strip spaces, commas, currency.
  const cleaned = raw
    .replace(/[€£$]/g, "")
    .replace(/[\u00a0\s]/g, "")
    .replace(/,/g, "");
  const m = cleaned.match(/-?\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
}

function deriveYear(row: Record<string, string>, headers: string[]): string {
  const candidates = pickColumn(headers, [
    "closed financial year",
    "financial year",
    "fiscal year",
    "year",
  ]);
  if (candidates && row[candidates]) {
    const m = row[candidates].match(/(20\d{2})/);
    if (m) return m[1];
  }
  return new Date().getFullYear().toString();
}

async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "lobbycat-eu-transparency/0.1 (+https://lobbycat.app)",
      accept: "text/csv, application/csv, text/plain, */*",
    },
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`register responded ${res.status}`);
  return await res.text();
}

export async function runEuTransparencyPipeline(options?: {
  url?: string;
  dryRun?: boolean;
  /** Restrict matcher to specific company slugs (testing). */
  onlySlugs?: string[];
  /** Inline CSV text (testing); bypasses fetch. */
  csv?: string;
}): Promise<EuRegisterResult> {
  const startedAt = new Date();
  const sourceUrl =
    options?.url ?? process.env.EU_TRANSPARENCY_CSV_URL ?? DEFAULT_REGISTER_URL;
  const dryRun = options?.dryRun ?? false;

  const companyRows = await db
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
    })
    .from(companies)
    .where(
      options?.onlySlugs?.length
        ? inArray(companies.slug, options.onlySlugs)
        : undefined,
    );
  const companyKeys: CompanyKey[] = companyRows;
  const matcher = buildMatcher(companyKeys);

  let csvText: string;
  try {
    csvText = options?.csv ?? (await fetchCsv(sourceUrl));
  } catch (err) {
    const finishedAt = new Date();
    return {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      sourceUrl,
      rowsParsed: 0,
      rowsMatched: 0,
      inserted: 0,
      updated: 0,
      matches: [],
      headers: [],
      warning: `fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const { headers, rows } = parseCsv(csvText);
  const nameCol = pickColumn(headers, [
    "name",
    "organisation name",
    "legal name",
    "interest representative",
    "registrant",
  ]);
  const idCol = pickColumn(headers, [
    "identification number",
    "registration number",
    "registration code",
    "id",
  ]);
  const spendCol = pickColumn(headers, [
    "closed financial year - costs",
    "financial-data-closed-year-amount",
    "annual costs",
    "costs",
    "budget",
  ]);
  const topicsCol = pickColumn(headers, [
    "fields of interest",
    "areas of interest",
    "main interests",
    "interests",
  ]);

  if (!nameCol) {
    const finishedAt = new Date();
    return {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      sourceUrl,
      rowsParsed: rows.length,
      rowsMatched: 0,
      inserted: 0,
      updated: 0,
      matches: [],
      headers,
      warning:
        "could not identify the registrant-name column in the CSV; set EU_TRANSPARENCY_CSV_URL or update pickColumn() candidates",
    };
  }

  const matches: EuRegisterResult["matches"] = [];
  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const registrant = (row[nameCol] ?? "").trim();
    if (!registrant) continue;
    const match = matcher(registrant);
    if (!match) continue;

    const period = deriveYear(row, headers);
    const spendEur = spendCol ? parseSpendToEur(row[spendCol]) : null;
    const topicsRaw = topicsCol ? row[topicsCol] ?? "" : "";
    const topics = topicsRaw
      .split(/[;,]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
    const externalId = idCol ? row[idCol]?.trim() ?? null : null;

    matches.push({
      companyId: match.id,
      companySlug: match.slug,
      registrant,
      period,
      spendEur,
    });

    if (dryRun) continue;

    // Idempotent upsert: a company can only have one record per (jurisdiction,
    // period). lobbyingRecords has no unique constraint on that pair, so we
    // emulate it by select-then-decide. Cheap because the matched set is small.
    const existing = await db
      .select({ id: lobbyingRecords.id })
      .from(lobbyingRecords)
      .where(
        and(
          eq(lobbyingRecords.companyId, match.id),
          eq(lobbyingRecords.jurisdiction, "eu"),
          eq(lobbyingRecords.period, period),
        ),
      )
      .limit(1);

    const payload = {
      companyId: match.id,
      jurisdiction: "eu",
      period,
      registrant,
      spendEur,
      topics,
      sourceUrl,
      raw: { externalId, ...row } as Record<string, unknown>,
    };

    if (existing.length === 0) {
      await db.insert(lobbyingRecords).values(payload);
      inserted += 1;
    } else {
      await db
        .update(lobbyingRecords)
        .set(payload)
        .where(eq(lobbyingRecords.id, existing[0].id));
      updated += 1;
    }
  }

  const finishedAt = new Date();
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    sourceUrl,
    rowsParsed: rows.length,
    rowsMatched: matches.length,
    inserted,
    updated,
    matches,
    headers,
  };
}
