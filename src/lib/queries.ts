import { db } from "@/db";
import {
  companies,
  roles,
  tags as tagsTable,
  companyTags,
  frames,
  frameScores,
  publications,
  people,
  userProfile,
  fitNotes,
  fitNoteMessages,
  companyNotes,
  clarifySessions,
  clarifyMessages,
  companyFavorites,
  controversies,
  news,
} from "@/db/schema";
import { eq, desc, sql, inArray, and, asc } from "drizzle-orm";

export async function getCompaniesWithTags() {
  const allCompanies = await db
    .select()
    .from(companies)
    .orderBy(companies.tier, companies.name);

  const allCompanyTags = await db
    .select({
      companyId: companyTags.companyId,
      label: tagsTable.label,
      color: tagsTable.color,
    })
    .from(companyTags)
    .innerJoin(tagsTable, eq(companyTags.tagId, tagsTable.id));

  const tagsByCompany = new Map<
    number,
    Array<{ label: string; color: string | null }>
  >();
  for (const t of allCompanyTags) {
    const list = tagsByCompany.get(t.companyId) || [];
    list.push({ label: t.label, color: t.color });
    tagsByCompany.set(t.companyId, list);
  }

  const openRolesCounts = await db
    .select({
      companyId: roles.companyId,
      count: sql<number>`count(*)::int`,
    })
    .from(roles)
    .where(eq(roles.isOpen, true))
    .groupBy(roles.companyId);
  const openCountByCompany = new Map(
    openRolesCounts.map((r) => [r.companyId, Number(r.count)]),
  );

  return allCompanies.map((c) => ({
    ...c,
    tagList: tagsByCompany.get(c.id) || [],
    openRoles: openCountByCompany.get(c.id) || 0,
  }));
}

export async function getCompaniesWithExpandableDetails() {
  const baseCompanies = await getCompaniesWithTags();
  if (baseCompanies.length === 0) {
    return [] as Array<
      (typeof baseCompanies)[number] & {
        openRolesList: Array<{
          id: number;
          title: string;
          url: string;
          department: string | null;
          location: string | null;
        }>;
        recentPublications: Array<{
          id: number;
          title: string;
          url: string;
          type: string;
          publishedAt: Date | null;
        }>;
        scores: Array<{
          frameId: number;
          frameName: string;
          lowLabel: string;
          highLabel: string;
          score: number | null;
        }>;
      }
    >;
  }
  const companyIds = baseCompanies.map((c) => c.id);

  const [openRolesRows, recentPubsRows, allFramesRows, scoreRows] = await Promise.all([
    db
      .select({
        id: roles.id,
        companyId: roles.companyId,
        title: roles.title,
        url: roles.url,
        department: roles.department,
        location: roles.location,
        seenAt: roles.seenAt,
      })
      .from(roles)
      .where(and(inArray(roles.companyId, companyIds), eq(roles.isOpen, true)))
      .orderBy(desc(roles.seenAt)),
    db
      .select({
        id: publications.id,
        companyId: publications.companyId,
        title: publications.title,
        url: publications.url,
        type: publications.type,
        publishedAt: publications.publishedAt,
      })
      .from(publications)
      .where(inArray(publications.companyId, companyIds))
      .orderBy(desc(publications.publishedAt)),
    db.select().from(frames).orderBy(frames.sortIndex),
    db
      .select({
        companyId: frameScores.companyId,
        frameId: frameScores.frameId,
        score: frameScores.score,
      })
      .from(frameScores)
      .where(inArray(frameScores.companyId, companyIds)),
  ]);

  const rolesByCompany = new Map<number, typeof openRolesRows>();
  for (const r of openRolesRows) {
    const list = rolesByCompany.get(r.companyId) || [];
    list.push(r);
    rolesByCompany.set(r.companyId, list);
  }
  const pubsByCompany = new Map<number, typeof recentPubsRows>();
  for (const p of recentPubsRows) {
    const list = pubsByCompany.get(p.companyId) || [];
    list.push(p);
    pubsByCompany.set(p.companyId, list);
  }
  const scoreByCoFrame = new Map<string, number>();
  for (const s of scoreRows) {
    scoreByCoFrame.set(`${s.companyId}:${s.frameId}`, Number(s.score));
  }

  return baseCompanies.map((c) => ({
    ...c,
    openRolesList: (rolesByCompany.get(c.id) || []).slice(0, 5).map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      department: r.department,
      location: r.location,
    })),
    recentPublications: (pubsByCompany.get(c.id) || []).slice(0, 5).map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      type: p.type,
      publishedAt: p.publishedAt,
    })),
    scores: allFramesRows.map((f) => ({
      frameId: f.id,
      frameName: f.name,
      lowLabel: f.lowLabel,
      highLabel: f.highLabel,
      score: scoreByCoFrame.get(`${c.id}:${f.id}`) ?? null,
    })),
  }));
}

export async function getCompanyBySlug(slug: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug));
  if (!company) return null;

  const [
    companyRolesList,
    companyPeopleList,
    companyPublicationsList,
    companyTagList,
    companyFrameScores,
    companyFitNotes,
    companyFitNoteMessages,
    companyNoteRows,
    companyFavoriteRows,
    companyNewsList,
    companyControversiesList,
  ] = await Promise.all([
    db
      .select()
      .from(roles)
      .where(eq(roles.companyId, company.id))
      .orderBy(desc(roles.seenAt)),
    db
      .select()
      .from(people)
      .where(eq(people.companyId, company.id))
      .orderBy(people.name),
    db
      .select()
      .from(publications)
      .where(eq(publications.companyId, company.id))
      .orderBy(desc(publications.publishedAt))
      .limit(20),
    db
      .select({ id: tagsTable.id, label: tagsTable.label, color: tagsTable.color })
      .from(companyTags)
      .innerJoin(tagsTable, eq(companyTags.tagId, tagsTable.id))
      .where(eq(companyTags.companyId, company.id)),
    db
      .select({
        frameId: frameScores.frameId,
        score: frameScores.score,
        rationale: frameScores.rationale,
      })
      .from(frameScores)
      .where(eq(frameScores.companyId, company.id)),
    db
      .select()
      .from(fitNotes)
      .where(eq(fitNotes.companyId, company.id))
      .orderBy(desc(fitNotes.createdAt))
      .limit(1),
    db
      .select()
      .from(fitNoteMessages)
      .where(eq(fitNoteMessages.companyId, company.id))
      .orderBy(asc(fitNoteMessages.createdAt)),
    db
      .select()
      .from(companyNotes)
      .where(eq(companyNotes.companyId, company.id))
      .limit(1),
    // v0.8.1 Phase B item 13 (F3.5) — single-row presence check so the
    // detail page header can render the star in its correct initial
    // state without a separate round-trip. `limit(1)` keeps it cheap.
    db
      .select({ companyId: companyFavorites.companyId })
      .from(companyFavorites)
      .where(eq(companyFavorites.companyId, company.id))
      .limit(1),
    // v0.8.5: detail page reads same evidence kinds as the dashboard
    // card show-more reveal — news + controversies. No date filter
    // (the detail page is the deep-dive surface; surface everything).
    // Cap at 20 each so an outlier doesn't blow the page.
    db
      .select({
        id: news.id,
        title: news.title,
        url: news.url,
        publishedAt: news.publishedAt,
        source: news.source,
        summary: news.summary,
      })
      .from(news)
      .where(eq(news.companyId, company.id))
      .orderBy(desc(news.publishedAt), desc(news.seenAt))
      .limit(20),
    db
      .select({
        id: controversies.id,
        title: controversies.title,
        url: controversies.url,
        severity: controversies.severity,
        status: controversies.status,
        summary: controversies.summary,
        occurredAt: controversies.occurredAt,
      })
      .from(controversies)
      .where(eq(controversies.companyId, company.id))
      .orderBy(desc(controversies.occurredAt), desc(controversies.seenAt))
      .limit(20),
  ]);

  const allFrames = await db
    .select()
    .from(frames)
    .orderBy(frames.sortIndex);
  const scoresByFrame = new Map(
    companyFrameScores.map((s) => [s.frameId, s]),
  );

  return {
    company,
    roles: companyRolesList,
    people: companyPeopleList,
    publications: companyPublicationsList,
    news: companyNewsList.map((n) => ({
      ...n,
      publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString() : null,
    })),
    controversies: companyControversiesList.map((c) => ({
      ...c,
      occurredAt: c.occurredAt ? new Date(c.occurredAt).toISOString() : null,
    })),
    tags: companyTagList,
    frames: allFrames.map((f) => ({
      ...f,
      score:
        scoresByFrame.get(f.id)?.score != null
          ? Number(scoresByFrame.get(f.id)!.score)
          : null,
      rationale: scoresByFrame.get(f.id)?.rationale ?? null,
    })),
    fitNote: companyFitNotes[0] ?? null,
    fitNoteThread: companyFitNoteMessages,
    note: companyNoteRows[0] ?? null,
    isFavorited: companyFavoriteRows.length > 0,
  };
}

/**
 * v0.6: notes index for the /profile page — every per-company note Aadi
 * has written, joined with company name + slug so he can find what he
 * said without remembering which company it was on.
 */
export async function getAllCompanyNotes() {
  return db
    .select({
      id: companyNotes.id,
      companyId: companyNotes.companyId,
      body: companyNotes.body,
      updatedAt: companyNotes.updatedAt,
      companyName: companies.name,
      companySlug: companies.slug,
    })
    .from(companyNotes)
    .innerJoin(companies, eq(companyNotes.companyId, companies.id))
    .orderBy(desc(companyNotes.updatedAt));
}

export async function getAllFrames() {
  return db.select().from(frames).orderBy(frames.sortIndex);
}

export async function getMapData() {
  const [
    allCompanies,
    scaleFrames,
    scores,
    allCompanyTags,
    latestFitNotes,
    openRolesRows,
    recentPubsRows,
  ] = await Promise.all([
      db.select().from(companies).orderBy(companies.tier, companies.name),
      db
        .select()
        .from(frames)
        .where(eq(frames.kind, "scale"))
        .orderBy(frames.sortIndex),
      db
        .select({
          companyId: frameScores.companyId,
          frameId: frameScores.frameId,
          score: frameScores.score,
        })
        .from(frameScores),
      db
        .select({
          companyId: companyTags.companyId,
          label: tagsTable.label,
          color: tagsTable.color,
        })
        .from(companyTags)
        .innerJoin(tagsTable, eq(companyTags.tagId, tagsTable.id)),
      db
        .select({
          companyId: fitNotes.companyId,
          body: fitNotes.body,
          createdAt: fitNotes.createdAt,
        })
        .from(fitNotes)
        .orderBy(desc(fitNotes.createdAt)),
      db
        .select({
          companyId: roles.companyId,
          id: roles.id,
          title: roles.title,
          url: roles.url,
          location: roles.location,
          seenAt: roles.seenAt,
        })
        .from(roles)
        .where(eq(roles.isOpen, true))
        .orderBy(desc(roles.seenAt)),
      db
        .select({
          companyId: publications.companyId,
          id: publications.id,
          title: publications.title,
          url: publications.url,
          type: publications.type,
          publishedAt: publications.publishedAt,
        })
        .from(publications)
        .orderBy(desc(publications.publishedAt)),
    ]);

  const scoresByCompany = new Map<number, Record<number, number>>();
  for (const s of scores) {
    const m = scoresByCompany.get(s.companyId) || {};
    m[s.frameId] = Number(s.score);
    scoresByCompany.set(s.companyId, m);
  }
  const tagsByCompany = new Map<
    number,
    Array<{ label: string; color: string | null }>
  >();
  for (const t of allCompanyTags) {
    const list = tagsByCompany.get(t.companyId) || [];
    list.push({ label: t.label, color: t.color });
    tagsByCompany.set(t.companyId, list);
  }
  // latestFitNotes is desc(createdAt); take first hit per company.
  const fitPreviewByCompany = new Map<number, string>();
  for (const n of latestFitNotes) {
    if (fitPreviewByCompany.has(n.companyId)) continue;
    const preview = firstBullet(n.body);
    if (preview) fitPreviewByCompany.set(n.companyId, preview);
  }

  // Open roles + recent publications for the pinned-card drawer. Cap at 3
  // each — the card is narrow and meant to *signal* activity, not exhaust
  // it. Deep dives live on /companies/[slug].
  const rolesByCompany = new Map<
    number,
    Array<{ id: number; title: string; url: string; location: string | null }>
  >();
  for (const r of openRolesRows) {
    const list = rolesByCompany.get(r.companyId) || [];
    if (list.length < 3)
      list.push({ id: r.id, title: r.title, url: r.url, location: r.location });
    rolesByCompany.set(r.companyId, list);
  }
  const pubsByCompany = new Map<
    number,
    Array<{
      id: number;
      title: string;
      url: string;
      type: string;
      publishedAt: Date | null;
    }>
  >();
  for (const p of recentPubsRows) {
    const list = pubsByCompany.get(p.companyId) || [];
    if (list.length < 3)
      list.push({
        id: p.id,
        title: p.title,
        url: p.url,
        type: p.type,
        publishedAt: p.publishedAt,
      });
    pubsByCompany.set(p.companyId, list);
  }

  return {
    companies: allCompanies.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      tier: c.tier,
      hq: c.hq,
      description: c.description,
      tagList: tagsByCompany.get(c.id) || [],
      scores: scoresByCompany.get(c.id) || {},
      fitNotePreview: fitPreviewByCompany.get(c.id) ?? null,
      openRoles: rolesByCompany.get(c.id) || [],
      recentPublications: pubsByCompany.get(c.id) || [],
    })),
    scaleFrames: scaleFrames.map((f) => ({
      id: f.id,
      name: f.name,
      scale: f.scale,
      lowLabel: f.lowLabel,
      highLabel: f.highLabel,
      lowDescription: f.lowDescription,
      highDescription: f.highDescription,
    })),
  };
}

// Pull the first bullet (or first non-caveat line) out of a fit-note body.
// Mirrors the parser in `fit-note-panel.tsx`: bullets start with `- `,
// a final `caveat:` line is honesty-only and should be skipped here.
function firstBullet(body: string | null | undefined): string | null {
  if (!body) return null;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^caveat\s*:/i.test(line)) continue;
    const bullet = line.replace(/^[-*•]\s+/, "").trim();
    if (bullet) return bullet;
  }
  return null;
}

export async function getTrackerData() {
  const [allCompanies, allCompanyTags, openRolesCounts, latestPubs] =
    await Promise.all([
      db.select().from(companies).orderBy(companies.tier, companies.name),
      db
        .select({
          companyId: companyTags.companyId,
          label: tagsTable.label,
          color: tagsTable.color,
        })
        .from(companyTags)
        .innerJoin(tagsTable, eq(companyTags.tagId, tagsTable.id)),
      db
        .select({
          companyId: roles.companyId,
          count: sql<number>`count(*)::int`,
        })
        .from(roles)
        .where(eq(roles.isOpen, true))
        .groupBy(roles.companyId),
      db
        .select({
          companyId: publications.companyId,
          title: publications.title,
          url: publications.url,
          type: publications.type,
          publishedAt: publications.publishedAt,
        })
        .from(publications)
        .orderBy(desc(publications.publishedAt)),
    ]);

  const tagsByCompany = new Map<
    number,
    Array<{ label: string; color: string | null }>
  >();
  for (const t of allCompanyTags) {
    const list = tagsByCompany.get(t.companyId) || [];
    list.push({ label: t.label, color: t.color });
    tagsByCompany.set(t.companyId, list);
  }

  const openCountByCompany = new Map(
    openRolesCounts.map((r) => [r.companyId, Number(r.count)]),
  );

  // latestPubs is desc(publishedAt); take first hit per company.
  type PubLite = {
    title: string;
    url: string;
    type: string;
    publishedAt: Date | null;
  };
  const latestPubByCompany = new Map<number, PubLite>();
  for (const p of latestPubs) {
    if (latestPubByCompany.has(p.companyId)) continue;
    latestPubByCompany.set(p.companyId, {
      title: p.title,
      url: p.url,
      type: p.type,
      publishedAt: p.publishedAt,
    });
  }

  return allCompanies.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tier: c.tier,
    hq: c.hq,
    tagList: tagsByCompany.get(c.id) || [],
    openRoles: openCountByCompany.get(c.id) || 0,
    latestPub: latestPubByCompany.get(c.id) ?? null,
  }));
}

export async function getUserProfile() {
  const [profile] = await db.select().from(userProfile).limit(1);
  return profile ?? null;
}

/**
 * v0.7 step 8 — record a home-page visit and return the *previous*
 * `last_seen_at` so the caller can compute the welcome-back diff window.
 *
 * Debounced ~5 minutes: if the previous visit is within that window we
 * don't bump, so a refresh doesn't wipe the diff that's still on screen.
 */
const LAST_SEEN_DEBOUNCE_MS = 5 * 60 * 1000;
export async function recordHomeVisit(): Promise<{
  previousLastSeen: string | null;
}> {
  const [profile] = await db.select().from(userProfile).limit(1);
  if (!profile) return { previousLastSeen: null };
  const prev = profile.lastSeenAt
    ? new Date(profile.lastSeenAt as unknown as Date).toISOString()
    : null;
  const prevMs = prev ? Date.parse(prev) : 0;
  const now = Date.now();
  if (!prev || now - prevMs > LAST_SEEN_DEBOUNCE_MS) {
    await db
      .update(userProfile)
      .set({ lastSeenAt: new Date() })
      .where(eq(userProfile.id, profile.id));
  }
  return { previousLastSeen: prev };
}

export async function getCompaniesForCompare(slugs: string[]) {
  if (slugs.length === 0) return [];
  const cos = await db
    .select()
    .from(companies)
    .where(inArray(companies.slug, slugs));

  const scores = await db
    .select({
      companyId: frameScores.companyId,
      frameId: frameScores.frameId,
      score: frameScores.score,
      rationale: frameScores.rationale,
    })
    .from(frameScores)
    .where(
      inArray(
        frameScores.companyId,
        cos.map((c) => c.id),
      ),
    );

  return cos.map((c) => ({
    ...c,
    scores: scores.filter((s) => s.companyId === c.id),
  }));
}

/* ------------------------------------------------------------------ */
/* v0.6 ranked-table home                                              */
/* ------------------------------------------------------------------ */

/**
 * Data for the ranked-table home (v0.6 §3.2).
 *
 * Returns:
 *  - frames: the six scale frames, in sort order
 *  - companies: all companies (id, slug, name, hq, short description)
 *  - scores: every (companyId, frameId) frame score with scoredAt
 *  - activity: per-company, the dates (last 90 days) of publication + role
 *              + lobbying record events, for the recent-activity dot pattern
 *  - frameWeights: the user's current L/M/H weights (keyed by frame id)
 *  - oldestScoreAt: the oldest scoredAt across all rows (drives the "stale"
 *    Re-score button on the welcome card; > 7 days is stale)
 */
export async function getRankedHomeData() {
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
  const sinceDate = new Date(Date.now() - NINETY_DAYS_MS);
  // Pass as ISO string — drizzle's raw sql template hands params to
  // postgres.js which serialises strings, not Date instances.
  const since = sinceDate.toISOString();

  // v0.8.5 fix (2026-06-27 13:16Z): bumped 6mo → 12mo. The old window
  // was filtering out highly relevant events that aged out by a few
  // weeks (e.g. Getty v Stability AI at 8mo) — the show-more reveal
  // is supposed to surface the company's recent shape, not the last
  // half-year only. Variable name kept for diff clarity; the var still
  // controls the same three sections (pubs, news, controversies).
  const SIX_MONTHS_MS = 12 * 30 * 24 * 60 * 60 * 1000;
  const sixMonthsAgo = new Date(Date.now() - SIX_MONTHS_MS).toISOString();

  const [
    allCompanies,
    scaleFrames,
    scoreRows,
    recentPubs,
    recentRoles,
    profile,
    pubsForCards,
    openRolesForCards,
    fitNoteCompanyIds,
    favoritedRows,
    recentControversiesRows,
    recentNewsRows,
  ] = await Promise.all([
      db
        .select({
          id: companies.id,
          slug: companies.slug,
          name: companies.name,
          hq: companies.hq,
          description: companies.description,
          tier: companies.tier,
        })
        .from(companies)
        .orderBy(companies.name),
      db
        .select()
        .from(frames)
        .where(eq(frames.kind, "scale"))
        .orderBy(frames.sortIndex),
      db
        .select({
          companyId: frameScores.companyId,
          frameId: frameScores.frameId,
          score: frameScores.score,
          confidence: frameScores.confidence,
          scoredAt: frameScores.scoredAt,
        })
        .from(frameScores),
      db
        .select({
          companyId: publications.companyId,
          at: publications.publishedAt,
        })
        .from(publications)
        .where(sql`${publications.publishedAt} >= ${since}`),
      db
        .select({
          companyId: roles.companyId,
          at: roles.seenAt,
        })
        .from(roles)
        .where(sql`${roles.seenAt} >= ${since}`),
      db.select().from(userProfile).limit(1),
      // Recent publications (last 6mo) for the dashboard cards' expand reveal
      db
        .select({
          id: publications.id,
          companyId: publications.companyId,
          title: publications.title,
          url: publications.url,
          type: publications.type,
          publishedAt: publications.publishedAt,
        })
        .from(publications)
        // v0.8.4 fix: include NULL publishedAt rows. Some of Glyphie's
        // primary-source pubs (ICO consultation responses etc.) come
        // without a precise date — the strict `>= sixMonthsAgo` filter
        // was dropping them. Matches the controversies treatment (above)
        // and the news read added in this PR.
        .where(
          sql`(${publications.publishedAt} IS NULL OR ${publications.publishedAt} >= ${sixMonthsAgo})`,
        )
        .orderBy(desc(publications.publishedAt)),
      // All currently-open roles for the dashboard cards' expand reveal
      db
        .select({
          id: roles.id,
          companyId: roles.companyId,
          title: roles.title,
          department: roles.department,
          location: roles.location,
          url: roles.url,
          postedAt: roles.postedAt,
          seenAt: roles.seenAt,
        })
        .from(roles)
        .where(eq(roles.isOpen, true))
        .orderBy(desc(roles.seenAt)),
      // Which companies have a fit-note (drives the “Fit-note ready” badge)
      db
        .select({ companyId: fitNotes.companyId })
        .from(fitNotes),
      // v0.8.1 Phase B item 13 (F3.5) — which companies are starred. The
      // dashboard renders a filled star in the card header when a row is
      // present; absence == not favorited (presence is the source of truth,
      // same model as companyNotes).
      db
        .select({ companyId: companyFavorites.companyId })
        .from(companyFavorites),
      // v0.8.1 F8.2 / Glyphie PR #40 — controversies from migration 0013.
      // Surface the last 6mo, newest-first, per-company. Renderer (F3.4
      // show-more reveal) shows up to 3 per company.
      db
        .select({
          id: controversies.id,
          companyId: controversies.companyId,
          title: controversies.title,
          url: controversies.url,
          occurredAt: controversies.occurredAt,
        })
        .from(controversies)
        .where(
          // Either occurredAt within window, or null occurredAt (cat-
          // curated items may not always have a precise event date).
          sql`(${controversies.occurredAt} IS NULL OR ${controversies.occurredAt} >= ${sixMonthsAgo})`,
        )
        .orderBy(desc(controversies.occurredAt), desc(controversies.seenAt)),
      // v0.8.4 fix: wire the news table read. Migration 0015 (PR #69)
      // added the table + the feeds-sync write path; this is the matching
      // read for the show-more reveal's "Recent news" section. Mirrors
      // the controversies shape — last 6mo by publishedAt, with NULL
      // publishedAt preserved so Glyphie's date-less rows still surface.
      db
        .select({
          id: news.id,
          companyId: news.companyId,
          title: news.title,
          url: news.url,
          publishedAt: news.publishedAt,
        })
        .from(news)
        .where(
          sql`(${news.publishedAt} IS NULL OR ${news.publishedAt} >= ${sixMonthsAgo})`,
        )
        .orderBy(desc(news.publishedAt), desc(news.seenAt)),
    ]);

  // Flatten scores; coerce score numeric -> number
  const scores = scoreRows.map((r) => ({
    companyId: r.companyId,
    frameId: r.frameId,
    score: r.score === null ? null : Number(r.score),
    confidence: r.confidence ?? null,
    scoredAt: r.scoredAt ? new Date(r.scoredAt).toISOString() : null,
  }));

  // Recent activity: pre-bucket on the server so the client renders pure.
  // 12 buckets × ~7.5d each, oldest → newest.
  const ACTIVITY_BUCKETS = 12;
  const BUCKET_MS = (90 * 24 * 60 * 60 * 1000) / ACTIVITY_BUCKETS;
  const now = Date.now();
  type Bucket = { pub: number; role: number };
  const activityByCompany = new Map<number, Bucket[]>();
  const ensure = (id: number) => {
    let b = activityByCompany.get(id);
    if (!b) {
      b = Array.from({ length: ACTIVITY_BUCKETS }, () => ({ pub: 0, role: 0 }));
      activityByCompany.set(id, b);
    }
    return b;
  };
  const place = (companyId: number, at: Date | null, kind: "pub" | "role") => {
    if (!at) return;
    const t = at instanceof Date ? at.getTime() : new Date(at).getTime();
    if (Number.isNaN(t)) return;
    const ageMs = now - t;
    if (ageMs < 0 || ageMs > 90 * 24 * 60 * 60 * 1000) return;
    const idx = ACTIVITY_BUCKETS - 1 - Math.floor(ageMs / BUCKET_MS);
    if (idx < 0 || idx >= ACTIVITY_BUCKETS) return;
    const buckets = ensure(companyId);
    if (kind === "pub") buckets[idx].pub += 1;
    else buckets[idx].role += 1;
  };
  for (const p of recentPubs) place(p.companyId, p.at as Date | null, "pub");
  for (const r of recentRoles) place(r.companyId, r.at as Date | null, "role");

  let oldestScoreAt: string | null = null;
  for (const s of scores) {
    if (!s.scoredAt) continue;
    if (oldestScoreAt === null || s.scoredAt < oldestScoreAt) {
      oldestScoreAt = s.scoredAt;
    }
  }

  const [p] = profile;

  // ---------- Per-company card details (v0.7 step 6) ---------------------
  // For each company, surface:
  //   - recentPublications: top 6 in the last 6mo, newest first
  //   - openRoles: top 6 currently-open roles, newest first
  //   - hasFitNote: has the user generated a fit-note for this company
  //   - isHiring: derived from openRoles.length > 0 (null when we have no
  //     ATS source configured — surfaced as UNKNOWN, not NOT HIRING)
  //   - latestEvent: newest of {publication, open role} — powers the
  //     “Latest:” strip on collapsed cards
  //   - recentNews: press/news items in the last 6 months (v0.8.1 F3.4 —
  //     populated by Glyphie's news[] feed in F8.x; empty until then)
  //   - recentControversies: controversies surfaced in the last 6 months
  //     (v0.8.1 F3.4 — populated by Glyphie's controversies migration
  //     0013 in F8.x; empty until then)
  const CARD_LIMIT = 6;
  const pubsByCompany = new Map<
    number,
    Array<{
      id: number;
      title: string;
      url: string;
      type: string | null;
      publishedAt: string | null;
    }>
  >();
  for (const p of pubsForCards) {
    let list = pubsByCompany.get(p.companyId);
    if (!list) {
      list = [];
      pubsByCompany.set(p.companyId, list);
    }
    if (list.length < CARD_LIMIT) {
      list.push({
        id: p.id,
        title: p.title,
        url: p.url,
        type: p.type ?? null,
        publishedAt: p.publishedAt
          ? new Date(p.publishedAt as unknown as Date).toISOString()
          : null,
      });
    }
  }
  const rolesByCompany = new Map<
    number,
    Array<{
      id: number;
      title: string;
      url: string;
      department: string | null;
      location: string | null;
      seenAt: string | null;
    }>
  >();
  const openRoleCount = new Map<number, number>();
  for (const r of openRolesForCards) {
    openRoleCount.set(
      r.companyId,
      (openRoleCount.get(r.companyId) ?? 0) + 1,
    );
    let list = rolesByCompany.get(r.companyId);
    if (!list) {
      list = [];
      rolesByCompany.set(r.companyId, list);
    }
    if (list.length < CARD_LIMIT) {
      list.push({
        id: r.id,
        title: r.title,
        url: r.url,
        department: r.department ?? null,
        location: r.location ?? null,
        seenAt: r.seenAt
          ? new Date(r.seenAt as unknown as Date).toISOString()
          : null,
      });
    }
  }
  const hasFitNoteSet = new Set<number>(
    fitNoteCompanyIds.map((r) => r.companyId),
  );
  const favoritedCompanyIds = favoritedRows.map((r) => r.companyId);

  // v0.8.1 F8.2: per-company controversies map. Cap at 3 per company
  // for the card show-more reveal.
  const CONTROVERSY_LIMIT = 3;
  const controversiesByCompany = new Map<
    number,
    Array<{
      id: string;
      title: string;
      url: string;
      surfacedAt: string | null;
    }>
  >();
  for (const c of recentControversiesRows) {
    const list = controversiesByCompany.get(c.companyId) ?? [];
    if (list.length >= CONTROVERSY_LIMIT) continue;
    list.push({
      id: String(c.id),
      title: c.title,
      url: c.url,
      surfacedAt: c.occurredAt ? new Date(c.occurredAt).toISOString() : null,
    });
    controversiesByCompany.set(c.companyId, list);
  }

  // v0.8.4 fix: per-company news map (mirrors controversies shape).
  // Capped at 5 per company for the card show-more reveal — news is
  // first-party press, lower-signal than publications/controversies
  // (see policy-evidence-types.md), so we surface a few more.
  const NEWS_LIMIT = 5;
  const newsByCompany = new Map<
    number,
    Array<{
      id: string;
      title: string;
      url: string;
      publishedAt: string | null;
    }>
  >();
  for (const n of recentNewsRows) {
    const list = newsByCompany.get(n.companyId) ?? [];
    if (list.length >= NEWS_LIMIT) continue;
    list.push({
      id: String(n.id),
      title: n.title,
      url: n.url,
      publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString() : null,
    });
    newsByCompany.set(n.companyId, list);
  }

  const details = allCompanies.map((c) => {
    const pubs = pubsByCompany.get(c.id) ?? [];
    const roleList = rolesByCompany.get(c.id) ?? [];
    const openRoles = openRoleCount.get(c.id) ?? 0;
    const newestPubAt = pubs[0]?.publishedAt ?? null;
    const newestRoleAt = roleList[0]?.seenAt ?? null;
    let latestEvent: {
      kind: "publication" | "role";
      title: string;
      url: string;
      at: string | null;
    } | null = null;
    if (pubs[0] && roleList[0]) {
      const pubT = newestPubAt ? Date.parse(newestPubAt) : 0;
      const roleT = newestRoleAt ? Date.parse(newestRoleAt) : 0;
      latestEvent =
        pubT >= roleT
          ? {
              kind: "publication",
              title: pubs[0].title,
              url: pubs[0].url,
              at: newestPubAt,
            }
          : {
              kind: "role",
              title: roleList[0].title,
              url: roleList[0].url,
              at: newestRoleAt,
            };
    } else if (pubs[0]) {
      latestEvent = {
        kind: "publication",
        title: pubs[0].title,
        url: pubs[0].url,
        at: newestPubAt,
      };
    } else if (roleList[0]) {
      latestEvent = {
        kind: "role",
        title: roleList[0].title,
        url: roleList[0].url,
        at: newestRoleAt,
      };
    }
    return {
      companyId: c.id,
      recentPublications: pubs,
      openRoles: roleList,
      openRoleCount: openRoles,
      isHiring: openRoles > 0 ? true : null, // null = UNKNOWN (no source)
      hasFitNote: hasFitNoteSet.has(c.id),
      // v0.8.1 F3.4 — render plumbing for the restructured "Show more"
      // reveal. v0.8.4: now wired to newsByCompany (was hardcoded []).
      // Empty array when there's nothing in the 6-month window —
      // renderer shows the "No recent news in the last 6 months."
      // empty state.
      recentNews: newsByCompany.get(c.id) ?? [],
      // v0.8.1 §F8.2: populated from controversiesByCompany (Glyphie's
      // migration 0013). Empty array when there's nothing in the
      // 6-month window — renderer shows the "No recent controversy
      // surfaced." empty state.
      recentControversies: controversiesByCompany.get(c.id) ?? [],
      latestEvent,
    };
  });

  return {
    frames: scaleFrames.map((f) => ({
      id: f.id,
      name: f.name,
      sortIndex: f.sortIndex,
      lowLabel: f.lowLabel,
      highLabel: f.highLabel,
    })),
    companies: allCompanies,
    details,
    scores,
    activity: Array.from(activityByCompany.entries()).map(([companyId, buckets]) => ({
      companyId,
      buckets,
    })),
    frameWeights: (p?.frameWeights ?? {}) as Record<
      string,
      "low" | "medium" | "high"
    >,
    oldestScoreAt,
    favoritedCompanyIds,
  };
}

/* ----------------------------------------------------------------------- *
 * v0.8 Step 9 — Clarify sessions for the /about Conversations section.
 *
 * Two surfaces:
 *   - getClarifySessionsForAbout()   list view, newest-first
 *   - getClarifySessionWithMessages(id)  full transcript for the row
 *
 * Both return plain-shape rows the React components can render directly.
 * Surprise discipline: nothing here exposes the cat's internal session
 * notes (those live in ~/.openclaw/workspace/main/lobbycat/memory/),
 * only the user-facing transcript + proposal payload.
 * ----------------------------------------------------------------------- */

export type ClarifySessionListRow = {
  id: number;
  startedAt: Date;
  endedAt: Date | null;
  trigger: string;
  endState: string | null;
  proposalKind: string | null;
  proposalAccepted: boolean | null;
  /** Cat's opening observation (truncated for the list view). */
  seedNote: string | null;
  /** Resolved company name when the session was seeded on one. */
  seedCompanyName: string | null;
  seedCompanySlug: string | null;
  /** Number of user + cat turns in the session. */
  messageCount: number;
};

export async function getClarifySessionsForAbout(): Promise<
  ClarifySessionListRow[]
> {
  const rows = await db
    .select({
      id: clarifySessions.id,
      startedAt: clarifySessions.startedAt,
      endedAt: clarifySessions.endedAt,
      trigger: clarifySessions.trigger,
      endState: clarifySessions.endState,
      proposalKind: clarifySessions.proposalKind,
      proposalAccepted: clarifySessions.proposalAccepted,
      seedNote: clarifySessions.seedNote,
      seedCompanyName: companies.name,
      seedCompanySlug: companies.slug,
      // Aggregated message count via a correlated subquery. Cheap enough
      // at the volumes v0.8 expects (one user, dozens of sessions over
      // weeks); revisit if a future tenant model needs it scaling out.
      messageCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${clarifyMessages}
        WHERE ${clarifyMessages.sessionId} = ${clarifySessions.id}
      )`,
    })
    .from(clarifySessions)
    .leftJoin(companies, eq(companies.id, clarifySessions.seedCompany))
    .orderBy(desc(clarifySessions.startedAt));

  return rows.map((r) => ({
    id: r.id,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    trigger: r.trigger,
    endState: r.endState,
    proposalKind: r.proposalKind,
    proposalAccepted: r.proposalAccepted,
    seedNote: r.seedNote,
    seedCompanyName: r.seedCompanyName ?? null,
    seedCompanySlug: r.seedCompanySlug ?? null,
    messageCount: Number(r.messageCount ?? 0),
  }));
}

export type ClarifySessionWithMessages = {
  id: number;
  startedAt: Date;
  endedAt: Date | null;
  trigger: string;
  endState: string | null;
  proposalKind: string | null;
  proposalData: Record<string, unknown> | null;
  proposalAccepted: boolean | null;
  seedNote: string | null;
  seedCompanyName: string | null;
  seedCompanySlug: string | null;
  messages: Array<{
    id: number;
    role: string; // 'cat' | 'user'
    body: string;
    moveType: string | null;
    createdAt: Date;
  }>;
};

export async function getClarifySessionWithMessages(
  sessionId: number,
): Promise<ClarifySessionWithMessages | null> {
  const [session] = await db
    .select({
      id: clarifySessions.id,
      startedAt: clarifySessions.startedAt,
      endedAt: clarifySessions.endedAt,
      trigger: clarifySessions.trigger,
      endState: clarifySessions.endState,
      proposalKind: clarifySessions.proposalKind,
      proposalData: clarifySessions.proposalData,
      proposalAccepted: clarifySessions.proposalAccepted,
      seedNote: clarifySessions.seedNote,
      seedCompanyName: companies.name,
      seedCompanySlug: companies.slug,
    })
    .from(clarifySessions)
    .leftJoin(companies, eq(companies.id, clarifySessions.seedCompany))
    .where(eq(clarifySessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  const messages = await db
    .select({
      id: clarifyMessages.id,
      role: clarifyMessages.role,
      body: clarifyMessages.body,
      moveType: clarifyMessages.moveType,
      createdAt: clarifyMessages.createdAt,
    })
    .from(clarifyMessages)
    .where(eq(clarifyMessages.sessionId, sessionId))
    .orderBy(asc(clarifyMessages.createdAt));

  return {
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    trigger: session.trigger,
    endState: session.endState,
    proposalKind: session.proposalKind,
    proposalData: (session.proposalData as Record<string, unknown>) ?? null,
    proposalAccepted: session.proposalAccepted,
    seedNote: session.seedNote,
    seedCompanyName: session.seedCompanyName ?? null,
    seedCompanySlug: session.seedCompanySlug ?? null,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      body: m.body,
      moveType: m.moveType,
      createdAt: m.createdAt,
    })),
  };
}
