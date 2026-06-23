import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
  boolean,
  jsonb,
  numeric,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Companies                                                          */
/* ------------------------------------------------------------------ */

export const companies = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tier: integer("tier").notNull().default(2), // 1 = top focus, 2 = serious, 3 = on-radar
    hq: text("hq"),
    websiteUrl: text("website_url"),
    careersUrl: text("careers_url"),
    policyPageUrl: text("policy_page_url"),
    blogRssUrl: text("blog_rss_url"),
    pressRssUrl: text("press_rss_url"),
    focusAreas: jsonb("focus_areas").$type<string[]>().default([]).notNull(),
    description: text("description"),
    status: text("status").notNull().default("watching"),
    // watching | chatting | interviewing | offered | passed | dead
    score: integer("score"), // user's overall gut score (1-10) optional
    notes: text("notes"), // free text per company
    rolesSource: text("roles_source"), // greenhouse | lever | ashby | custom
    rolesSourceId: text("roles_source_id"), // the board token
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("companies_slug_idx").on(t.slug),
    index("companies_tier_idx").on(t.tier),
    index("companies_status_idx").on(t.status),
  ],
);

/* ------------------------------------------------------------------ */
/* Roles (open positions)                                             */
/* ------------------------------------------------------------------ */

export const roles = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    externalId: text("external_id"), // id in source ATS
    title: text("title").notNull(),
    department: text("department"),
    location: text("location"),
    url: text("url").notNull(),
    source: text("source"), // greenhouse | lever | ashby | manual
    postedAt: timestamp("posted_at", { withTimezone: true }),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>(),
    seenAt: timestamp("seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    isOpen: boolean("is_open").notNull().default(true),
  },
  (t) => [
    index("roles_company_idx").on(t.companyId),
    index("roles_open_idx").on(t.isOpen),
    uniqueIndex("roles_company_external_idx").on(t.companyId, t.externalId),
  ],
);

/* ------------------------------------------------------------------ */
/* People (policy team members, surfaced not scraped)                 */
/* ------------------------------------------------------------------ */

export const people = pgTable(
  "people",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    role: text("role"),
    seniority: text("seniority"), // lead | senior | mid | junior | unknown
    linkedinUrl: text("linkedin_url"),
    twitterUrl: text("twitter_url"),
    bioUrl: text("bio_url"),
    notes: text("notes"),
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("people_company_idx").on(t.companyId)],
);

/* ------------------------------------------------------------------ */
/* Publications (blog/press/filing/paper)                             */
/* ------------------------------------------------------------------ */

export const publications = pgTable(
  "publications",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(), // blog | press | filing | paper | other
    title: text("title").notNull(),
    url: text("url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    summary: text("summary"), // Claude-generated, one-sentence
    topics: jsonb("topics").$type<string[]>().default([]).notNull(),
    rawExcerpt: text("raw_excerpt"), // grounding for the summary
    seenAt: timestamp("seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("publications_company_idx").on(t.companyId),
    index("publications_type_idx").on(t.type),
    index("publications_published_idx").on(t.publishedAt),
    uniqueIndex("publications_company_url_idx").on(t.companyId, t.url),
  ],
);

/* ------------------------------------------------------------------ */
/* Lobbying records                                                   */
/* ------------------------------------------------------------------ */

export const lobbyingRecords = pgTable(
  "lobbying_records",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    jurisdiction: text("jurisdiction").notNull(), // eu | us | uk
    period: text("period").notNull(), // e.g. 2025-Q4 or 2025
    registrant: text("registrant"),
    spendEur: integer("spend_eur"), // smallest unit irrelevant here; cents not needed
    spendUsd: integer("spend_usd"),
    topics: jsonb("topics").$type<string[]>().default([]).notNull(),
    meetings: integer("meetings"),
    sourceUrl: text("source_url"),
    raw: jsonb("raw").$type<Record<string, unknown>>(),
    seenAt: timestamp("seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("lobbying_company_idx").on(t.companyId),
    index("lobbying_jurisdiction_idx").on(t.jurisdiction),
  ],
);

/* ------------------------------------------------------------------ */
/* Tags                                                               */
/* ------------------------------------------------------------------ */

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
    color: text("color"),
  },
  (t) => [uniqueIndex("tags_label_idx").on(t.label)],
);

export const companyTags = pgTable(
  "company_tags",
  {
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    tagId: integer("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.tagId] })],
);

/* ------------------------------------------------------------------ */
/* Frames (custom evaluation axes)                                    */
/* ------------------------------------------------------------------ */

export const frames = pgTable(
  "frames",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    kind: text("kind").notNull().default("scale"), // 'scale' | 'tag' | 'question'
    scale: integer("scale").notNull().default(5), // 1..scale (scale-kind only)
    highLabel: text("high_label"), // short label for max (scale-kind)
    lowLabel: text("low_label"), // short label for min (scale-kind)
    highDescription: text("high_description"), // full descriptive sentence for max
    lowDescription: text("low_description"), // full descriptive sentence for min
    prompt: text("prompt"), // question text (question-kind)
    sortIndex: integer("sort_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("frames_name_idx").on(t.name),
    index("frames_kind_idx").on(t.kind),
  ],
);

/* ------------------------------------------------------------------ */
/* Frame answers (question-kind frames: free-text answer per company) */
/* ------------------------------------------------------------------ */

export const frameAnswers = pgTable(
  "frame_answers",
  {
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    frameId: integer("frame_id")
      .references(() => frames.id, { onDelete: "cascade" })
      .notNull(),
    answer: text("answer").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.frameId] })],
);

export const frameScores = pgTable(
  "frame_scores",
  {
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    frameId: integer("frame_id")
      .references(() => frames.id, { onDelete: "cascade" })
      .notNull(),
    // v0.6: decimal scores 1.0..5.0 (one decimal place)
    score: numeric("score", { precision: 2, scale: 1 }).notNull(),
    rationale: text("rationale"),
    confidence: text("confidence"), // 'low' | 'medium' | 'high' (v0.6)
    // When the score was produced (separate from updatedAt mutation timestamp)
    scoredAt: timestamp("scored_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Hash of the evidence set used for this score (for invalidation)
    evidenceVersion: text("evidence_version"),
    // user_profile.updated_at at scoring time
    profileVersion: timestamp("profile_version", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.frameId] })],
);

/* ------------------------------------------------------------------ */
/* Frame-score evidence (citations supporting each score) — v0.6      */
/* ------------------------------------------------------------------ */

export const frameScoreEvidence = pgTable(
  "frame_score_evidence",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    frameId: integer("frame_id")
      .references(() => frames.id, { onDelete: "cascade" })
      .notNull(),
    // 'publication' | 'role' | 'lobbying_record' | 'submission' | 'safety_framework'
    evidenceKind: text("evidence_kind").notNull(),
    evidenceId: integer("evidence_id").notNull(),
    weight: numeric("weight", { precision: 2, scale: 1 })
      .notNull()
      .default("1.0"),
    scoredAt: timestamp("scored_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("frame_score_evidence_company_frame_idx").on(t.companyId, t.frameId),
    index("frame_score_evidence_kind_idx").on(t.evidenceKind),
  ],
);

/* ------------------------------------------------------------------ */
/* Per-company notes (replaces v0.4 free-text intent) — v0.6          */
/* ------------------------------------------------------------------ */

export const companyNotes = pgTable(
  "company_notes",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    body: text("body").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("company_notes_company_idx").on(t.companyId)],
);

/* ------------------------------------------------------------------ */
/* User profile (single-row, for fit-notes grounding)                 */
/* ------------------------------------------------------------------ */

export type FrameWeightLevel = "low" | "medium" | "high";
export type FrameWeightsMap = Record<string, FrameWeightLevel>;

export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),
  headline: text("headline"),
  bio: text("bio"),
  // v0.5 legacy free-text-derived weights (deprecated, removal slated v0.7)
  weights: jsonb("weights").$type<Record<string, unknown>>(),
  // v0.6: user's L/M/H weight per frame, keyed by frame id (string)
  frameWeights: jsonb("frame_weights")
    .$type<FrameWeightsMap>()
    .default({
      "1": "medium",
      "2": "medium",
      "3": "medium",
      "4": "medium",
      "5": "medium",
      "6": "medium",
    })
    .notNull(),
  concerns: jsonb("concerns").$type<string[]>().default([]).notNull(),
  sources: jsonb("sources").$type<string[]>().default([]).notNull(),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ------------------------------------------------------------------ */
/* Fit notes (cached per company × profile version)                   */
/* ------------------------------------------------------------------ */

export const fitNotes = pgTable(
  "fit_notes",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    profileVersion: timestamp("profile_version", { withTimezone: true })
      .notNull(),
    headline: text("headline"), // e.g. "Could be interesting because..."
    body: text("body").notNull(), // serif-rendered narrative
    citations: jsonb("citations")
      .$type<Array<{ label: string; url: string }>>()
      .default([])
      .notNull(),
    honesty: text("honesty"), // optional caveat ("stretch on UK-pigeonhole axis")
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("fit_notes_company_version_idx").on(
      t.companyId,
      t.profileVersion,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Fit-note conversation messages (chat thread, per company)          */
/* ------------------------------------------------------------------ */

export const fitNoteMessages = pgTable(
  "fit_note_messages",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(), // 'user' | 'cat'
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("fit_note_messages_company_idx").on(t.companyId),
    index("fit_note_messages_created_idx").on(t.createdAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Agent runs (audit log)                                             */
/* ------------------------------------------------------------------ */

export const agentRuns = pgTable("agent_runs", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  result: text("result"),
  toolCalls: jsonb("tool_calls").$type<unknown[]>().default([]).notNull(),
  status: text("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  costUsd: text("cost_usd"),
});

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const companiesRelations = relations(companies, ({ many }) => ({
  roles: many(roles),
  people: many(people),
  publications: many(publications),
  lobbyingRecords: many(lobbyingRecords),
  tags: many(companyTags),
  frameScores: many(frameScores),
  frameAnswers: many(frameAnswers),
  fitNotes: many(fitNotes),
  fitNoteMessages: many(fitNoteMessages),
}));

export const rolesRelations = relations(roles, ({ one }) => ({
  company: one(companies, {
    fields: [roles.companyId],
    references: [companies.id],
  }),
}));

export const peopleRelations = relations(people, ({ one }) => ({
  company: one(companies, {
    fields: [people.companyId],
    references: [companies.id],
  }),
}));

export const publicationsRelations = relations(publications, ({ one }) => ({
  company: one(companies, {
    fields: [publications.companyId],
    references: [companies.id],
  }),
}));

export const lobbyingRelations = relations(lobbyingRecords, ({ one }) => ({
  company: one(companies, {
    fields: [lobbyingRecords.companyId],
    references: [companies.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  companies: many(companyTags),
}));

export const companyTagsRelations = relations(companyTags, ({ one }) => ({
  company: one(companies, {
    fields: [companyTags.companyId],
    references: [companies.id],
  }),
  tag: one(tags, {
    fields: [companyTags.tagId],
    references: [tags.id],
  }),
}));

export const framesRelations = relations(frames, ({ many }) => ({
  scores: many(frameScores),
  answers: many(frameAnswers),
}));

export const frameAnswersRelations = relations(frameAnswers, ({ one }) => ({
  company: one(companies, {
    fields: [frameAnswers.companyId],
    references: [companies.id],
  }),
  frame: one(frames, {
    fields: [frameAnswers.frameId],
    references: [frames.id],
  }),
}));

export const frameScoresRelations = relations(frameScores, ({ one }) => ({
  company: one(companies, {
    fields: [frameScores.companyId],
    references: [companies.id],
  }),
  frame: one(frames, {
    fields: [frameScores.frameId],
    references: [frames.id],
  }),
}));

export const fitNotesRelations = relations(fitNotes, ({ one }) => ({
  company: one(companies, {
    fields: [fitNotes.companyId],
    references: [companies.id],
  }),
}));

export const fitNoteMessagesRelations = relations(
  fitNoteMessages,
  ({ one }) => ({
    company: one(companies, {
      fields: [fitNoteMessages.companyId],
      references: [companies.id],
    }),
  }),
);

/* Inferred types */
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type Person = typeof people.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type LobbyingRecord = typeof lobbyingRecords.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Frame = typeof frames.$inferSelect;
export type FrameScore = typeof frameScores.$inferSelect;
export type NewFrameScore = typeof frameScores.$inferInsert;
export type FrameScoreEvidence = typeof frameScoreEvidence.$inferSelect;
export type NewFrameScoreEvidence = typeof frameScoreEvidence.$inferInsert;
export type CompanyNote = typeof companyNotes.$inferSelect;
export type NewCompanyNote = typeof companyNotes.$inferInsert;
export type FrameAnswer = typeof frameAnswers.$inferSelect;
export type NewFrameAnswer = typeof frameAnswers.$inferInsert;
export type FitNote = typeof fitNotes.$inferSelect;
export type FitNoteMessage = typeof fitNoteMessages.$inferSelect;
export type NewFitNoteMessage = typeof fitNoteMessages.$inferInsert;
export type UserProfile = typeof userProfile.$inferSelect;
