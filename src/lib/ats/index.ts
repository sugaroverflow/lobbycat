import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { companies, roles } from "@/db/schema";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { ashbyAdapter } from "./ashby";
import type { AtsAdapter, AtsSource, NormalisedRole } from "./types";

const ADAPTERS: Record<AtsSource, AtsAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  ashby: ashbyAdapter,
};

export type CompanyRunResult = {
  companyId: number;
  companySlug: string;
  source: AtsSource;
  token: string;
  fetched: number;
  inserted: number;
  updated: number;
  closed: number;
  error?: string;
};

export type PipelineRunResult = {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  companies: CompanyRunResult[];
  totals: {
    companies: number;
    failed: number;
    fetched: number;
    inserted: number;
    updated: number;
    closed: number;
  };
};

/**
 * Run the ATS pipeline across every company that has both rolesSource and
 * rolesSourceId set in the `companies` table.
 *
 * The pipeline is intentionally idempotent: we upsert by (company_id,
 * external_id) and mark any previously-open role NOT seen in the latest pull
 * as closed (isOpen=false). That keeps the `roles` table honest as a snapshot
 * of "what's open right now".
 *
 * Errors per-company are caught and recorded in the result so one bad ATS
 * doesn't sink the whole cron run.
 */
export async function runAtsPipeline(options?: {
  /** Restrict to specific company slugs (useful for testing one feed). */
  onlySlugs?: string[];
  /** Don't write to the DB. Useful for smoke-testing in CI / locally. */
  dryRun?: boolean;
}): Promise<PipelineRunResult> {
  const startedAt = new Date();
  const onlySlugs = options?.onlySlugs;
  const dryRun = options?.dryRun ?? false;

  const where = onlySlugs?.length
    ? and(
        isNotNull(companies.rolesSource),
        isNotNull(companies.rolesSourceId),
        inArray(companies.slug, onlySlugs),
      )
    : and(isNotNull(companies.rolesSource), isNotNull(companies.rolesSourceId));

  const targetCompanies = await db
    .select({
      id: companies.id,
      slug: companies.slug,
      rolesSource: companies.rolesSource,
      rolesSourceId: companies.rolesSourceId,
    })
    .from(companies)
    .where(where);

  const perCompany: CompanyRunResult[] = [];

  for (const c of targetCompanies) {
    const source = c.rolesSource as AtsSource | null;
    const token = c.rolesSourceId;
    if (!source || !token || !(source in ADAPTERS)) {
      perCompany.push({
        companyId: c.id,
        companySlug: c.slug,
        source: (source ?? "greenhouse") as AtsSource,
        token: token ?? "",
        fetched: 0,
        inserted: 0,
        updated: 0,
        closed: 0,
        error: `unsupported rolesSource: ${source ?? "(null)"}`,
      });
      continue;
    }

    try {
      const fetched: NormalisedRole[] = await ADAPTERS[source](token);
      let inserted = 0;
      let updated = 0;
      let closed = 0;

      if (!dryRun) {
        const existing = await db
          .select({ externalId: roles.externalId, isOpen: roles.isOpen })
          .from(roles)
          .where(eq(roles.companyId, c.id));
        const existingById = new Map(
          existing
            .filter((r): r is { externalId: string; isOpen: boolean } =>
              Boolean(r.externalId),
            )
            .map((r) => [r.externalId, r] as const),
        );
        const seenIds = new Set(fetched.map((r) => r.externalId));

        for (const r of fetched) {
          const prior = existingById.get(r.externalId);
          if (!prior) {
            await db.insert(roles).values({
              companyId: c.id,
              externalId: r.externalId,
              title: r.title,
              department: r.department,
              location: r.location,
              url: r.url,
              source,
              postedAt: r.postedAt,
              snapshot: r.snapshot,
              isOpen: true,
            });
            inserted += 1;
          } else {
            await db
              .update(roles)
              .set({
                title: r.title,
                department: r.department,
                location: r.location,
                url: r.url,
                source,
                postedAt: r.postedAt,
                snapshot: r.snapshot,
                isOpen: true,
              })
              .where(
                and(
                  eq(roles.companyId, c.id),
                  eq(roles.externalId, r.externalId),
                ),
              );
            updated += 1;
          }
        }

        // Anything previously-open that we didn't see today → close it.
        const toClose = existing
          .filter(
            (r): r is { externalId: string; isOpen: boolean } =>
              Boolean(r.externalId) && r.isOpen && !seenIds.has(r.externalId!),
          )
          .map((r) => r.externalId);
        if (toClose.length) {
          await db
            .update(roles)
            .set({ isOpen: false })
            .where(
              and(
                eq(roles.companyId, c.id),
                inArray(roles.externalId, toClose),
              ),
            );
          closed = toClose.length;
        }

        await db
          .update(companies)
          .set({ lastRefreshedAt: new Date() })
          .where(eq(companies.id, c.id));
      }

      perCompany.push({
        companyId: c.id,
        companySlug: c.slug,
        source,
        token,
        fetched: fetched.length,
        inserted,
        updated,
        closed,
      });
    } catch (err) {
      perCompany.push({
        companyId: c.id,
        companySlug: c.slug,
        source,
        token,
        fetched: 0,
        inserted: 0,
        updated: 0,
        closed: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const finishedAt = new Date();
  const totals = perCompany.reduce(
    (acc, r) => ({
      companies: acc.companies + 1,
      failed: acc.failed + (r.error ? 1 : 0),
      fetched: acc.fetched + r.fetched,
      inserted: acc.inserted + r.inserted,
      updated: acc.updated + r.updated,
      closed: acc.closed + r.closed,
    }),
    { companies: 0, failed: 0, fetched: 0, inserted: 0, updated: 0, closed: 0 },
  );

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    companies: perCompany,
    totals,
  };
}

export { ADAPTERS };
export type { AtsSource, NormalisedRole } from "./types";
