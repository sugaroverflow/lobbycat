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
  };
}

/**
 * v0.6: notes index for the /about page — every per-company note Aadi
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

  const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
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
  ] = await Promise.all([
      db
        .select({
          id: companies.id,
          slug: companies.slug,
          name: companies.name,
          hq: companies.hq,
          description: companies.description,
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
        .where(sql`${publications.publishedAt} >= ${sixMonthsAgo}`)
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
  };
}
