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
  userProfile,
} from "./schema";
import {
  seedCompanies,
  seedTags,
  seedFrames,
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
          sortIndex: f.sortIndex,
        },
      });
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
  console.log(`  companies: ${seedCompanies.length}`);

  console.log("done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
