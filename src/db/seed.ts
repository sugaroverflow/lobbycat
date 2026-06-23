/**
 * Idempotent seed. Run with: npm run db:seed
 */
import "dotenv/config";
import { db } from "./index";
import {
  companies,
  roles,
  tags as tagsTable,
  companyTags,
  frames,
  frameScores,
  publications,
  userProfile,
} from "./schema";
import {
  seedCompanies,
  seedTags,
  seedFrames,
  seedFrameScores,
  seedPublications,
  seedUserProfile,
} from "./seed-data";
import { eq, notInArray } from "drizzle-orm";

async function main() {
  console.log("seeding…");

  /* Tags */
  for (const t of seedTags) {
    await db
      .insert(tagsTable)
      .values(t)
      .onConflictDoUpdate({
        target: tagsTable.label,
        set: { color: t.color },
      });
  }
  // v0.3 step 2c: prune any tag rows whose labels aren't in the current
  // taxonomy (e.g. the old `hiring-policy` / `UK-HQ` slugs from v0.2).
  // company_tags rows cascade on tag delete.
  const keepLabels = seedTags.map((t) => t.label);
  const pruned = await db
    .delete(tagsTable)
    .where(notInArray(tagsTable.label, keepLabels))
    .returning({ label: tagsTable.label });
  if (pruned.length) {
    console.log(
      `  tags: pruned ${pruned.length} stale (${pruned
        .map((p) => p.label)
        .join(", ")})`,
    );
  }
  const allTags = await db.select().from(tagsTable);
  const tagId = new Map(allTags.map((t) => [t.label, t.id]));
  console.log(`  tags: ${allTags.length}`);

  /* Frames */
  for (const f of seedFrames) {
    await db
      .insert(frames)
      .values(f)
      .onConflictDoUpdate({
        target: frames.name,
        set: {
          description: f.description,
          scale: f.scale,
          lowLabel: f.lowLabel,
          highLabel: f.highLabel,
          lowDescription: f.lowDescription,
          highDescription: f.highDescription,
          sortIndex: f.sortIndex,
        },
      });
  }
  // v0.5: prune frames whose name isn't in the v0.5 set (drops the v0.4
  // frame rows like "UK-pigeonhole risk" etc.). frame_scores cascade.
  const keepFrameNames = seedFrames.map((f) => f.name);
  const prunedFrames = await db
    .delete(frames)
    .where(notInArray(frames.name, keepFrameNames))
    .returning({ name: frames.name });
  if (prunedFrames.length) {
    console.log(
      `  frames: pruned ${prunedFrames.length} stale (${prunedFrames
        .map((p) => p.name)
        .join(", ")})`,
    );
  }
  console.log(`  frames: ${seedFrames.length}`);

  /* User profile (single row) */
  const existingProfile = await db.select().from(userProfile).limit(1);
  if (existingProfile.length === 0) {
    await db.insert(userProfile).values(seedUserProfile);
  } else {
    await db
      .update(userProfile)
      .set({ ...seedUserProfile, updatedAt: new Date() })
      .where(eq(userProfile.id, existingProfile[0].id));
  }
  console.log("  user profile: seeded");

  /* Companies + roles + company_tags */
  for (const c of seedCompanies) {
    const [row] = await db
      .insert(companies)
      .values({
        slug: c.slug,
        name: c.name,
        tier: c.tier,
        hq: c.hq,
        websiteUrl: c.websiteUrl,
        careersUrl: c.careersUrl,
        policyPageUrl: c.policyPageUrl,
        focusAreas: c.focusAreas,
        description: c.description,
        rolesSource: c.rolesSource,
        rolesSourceId: c.rolesSourceId,
        blogRssUrl: c.blogRssUrl,
        pressRssUrl: c.pressRssUrl,
      })
      .onConflictDoUpdate({
        target: companies.slug,
        set: {
          name: c.name,
          tier: c.tier,
          hq: c.hq,
          websiteUrl: c.websiteUrl,
          careersUrl: c.careersUrl,
          policyPageUrl: c.policyPageUrl,
          focusAreas: c.focusAreas,
          description: c.description,
          rolesSource: c.rolesSource,
          rolesSourceId: c.rolesSourceId,
          blogRssUrl: c.blogRssUrl,
          pressRssUrl: c.pressRssUrl,
          updatedAt: new Date(),
        },
      })
      .returning({ id: companies.id });

    /* Roles */
    if (c.roles?.length) {
      for (const r of c.roles) {
        await db
          .insert(roles)
          .values({
            companyId: row.id,
            externalId: r.url, // use URL as the external id for manual-source roles
            title: r.title,
            location: r.location,
            url: r.url,
            source: r.source || "custom",
            isOpen: true,
          })
          .onConflictDoUpdate({
            target: [roles.companyId, roles.externalId],
            set: {
              title: r.title,
              location: r.location,
              url: r.url,
              source: r.source || "custom",
              isOpen: true,
              seenAt: new Date(),
            },
          });
      }
    }

    /* Tags */
    if (c.tags?.length) {
      for (const label of c.tags) {
        const t = tagId.get(label);
        if (!t) continue;
        await db
          .insert(companyTags)
          .values({ companyId: row.id, tagId: t })
          .onConflictDoNothing();
      }
    }
  }
  // v0.5: prune companies whose slug isn't in the v0.5 London set (drops
  // v0.4 entries like "anthropic", "openai", global-flavoured rows).
  // All dependent rows cascade.
  const keepSlugs = seedCompanies.map((c) => c.slug);
  const prunedCompanies = await db
    .delete(companies)
    .where(notInArray(companies.slug, keepSlugs))
    .returning({ slug: companies.slug });
  if (prunedCompanies.length) {
    console.log(
      `  companies: pruned ${prunedCompanies.length} stale (${prunedCompanies
        .map((p) => p.slug)
        .join(", ")})`,
    );
  }
  console.log(`  companies: ${seedCompanies.length}`);

  /* Frame scores — hand-picked editorial pass. Map (company slug, frame name)
   * onto (company id, frame id) using the rows we just upserted, then
   * onConflictDoUpdate on the composite PK so re-runs cleanly overwrite. */
  {
    const allCompanies = await db.select().from(companies);
    const companyIdBySlug = new Map(allCompanies.map((c) => [c.slug, c.id]));
    const allFrames = await db.select().from(frames);
    const frameIdByName = new Map(allFrames.map((f) => [f.name, f.id]));
    let inserted = 0;
    let missing = 0;
    for (const [slug, scoreByFrame] of Object.entries(seedFrameScores)) {
      const companyId = companyIdBySlug.get(slug);
      if (companyId == null) {
        missing++;
        console.warn(`  frame_scores: skipped unknown company slug "${slug}"`);
        continue;
      }
      for (const [frameName, score] of Object.entries(scoreByFrame)) {
        const frameId = frameIdByName.get(frameName);
        if (frameId == null) {
          missing++;
          console.warn(
            `  frame_scores: skipped unknown frame "${frameName}" (slug=${slug})`,
          );
          continue;
        }
        const scoreStr = Number(score).toFixed(1);
        await db
          .insert(frameScores)
          .values({ companyId, frameId, score: scoreStr })
          .onConflictDoUpdate({
            target: [frameScores.companyId, frameScores.frameId],
            set: { score: scoreStr, updatedAt: new Date() },
          });
        inserted++;
      }
    }
    console.log(
      `  frame_scores: ${inserted} upserted${missing ? `, ${missing} skipped` : ""}`,
    );
  }

  /* Publications \u2014 hand-picked editorial pass. Keyed by company slug;
   * idempotent on (company_id, url). */
  {
    const allCompanies = await db.select().from(companies);
    const companyIdBySlug = new Map(allCompanies.map((c) => [c.slug, c.id]));
    let inserted = 0;
    let missing = 0;
    for (const [slug, pubs] of Object.entries(seedPublications)) {
      const companyId = companyIdBySlug.get(slug);
      if (companyId == null) {
        missing++;
        console.warn(`  publications: skipped unknown company slug "${slug}"`);
        continue;
      }
      for (const p of pubs) {
        await db
          .insert(publications)
          .values({
            companyId,
            type: p.type,
            title: p.title,
            url: p.url,
            publishedAt: new Date(p.publishedAt),
            summary: p.summary,
            topics: p.topics ?? [],
          })
          .onConflictDoUpdate({
            target: [publications.companyId, publications.url],
            set: {
              type: p.type,
              title: p.title,
              publishedAt: new Date(p.publishedAt),
              summary: p.summary,
              topics: p.topics ?? [],
            },
          });
        inserted++;
      }
    }
    console.log(
      `  publications: ${inserted} upserted${missing ? `, ${missing} skipped` : ""}`,
    );
  }

  console.log("done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
