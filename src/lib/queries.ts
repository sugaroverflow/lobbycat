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
    scoreByCoFrame.set(`${s.companyId}:${s.frameId}`, s.score);
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
      score: scoresByFrame.get(f.id)?.score ?? null,
      rationale: scoresByFrame.get(f.id)?.rationale ?? null,
    })),
    fitNote: companyFitNotes[0] ?? null,
    fitNoteThread: companyFitNoteMessages,
  };
}

export async function getAllFrames() {
  return db.select().from(frames).orderBy(frames.sortIndex);
}

export async function getMapData() {
  const [allCompanies, scaleFrames, scores, allCompanyTags, latestFitNotes] =
    await Promise.all([
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
    ]);

  const scoresByCompany = new Map<number, Record<number, number>>();
  for (const s of scores) {
    const m = scoresByCompany.get(s.companyId) || {};
    m[s.frameId] = s.score;
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
