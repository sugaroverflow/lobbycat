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
