CREATE TABLE "agent_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"result" text,
	"tool_calls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"cost_usd" text
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tier" integer DEFAULT 2 NOT NULL,
	"hq" text,
	"website_url" text,
	"careers_url" text,
	"policy_page_url" text,
	"blog_rss_url" text,
	"press_rss_url" text,
	"focus_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"status" text DEFAULT 'watching' NOT NULL,
	"score" integer,
	"notes" text,
	"roles_source" text,
	"roles_source_id" text,
	"last_refreshed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_tags" (
	"company_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "company_tags_company_id_tag_id_pk" PRIMARY KEY("company_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "fit_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"profile_version" timestamp with time zone NOT NULL,
	"headline" text,
	"body" text NOT NULL,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"honesty" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frame_scores" (
	"company_id" integer NOT NULL,
	"frame_id" integer NOT NULL,
	"score" integer NOT NULL,
	"rationale" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "frame_scores_company_id_frame_id_pk" PRIMARY KEY("company_id","frame_id")
);
--> statement-breakpoint
CREATE TABLE "frames" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"scale" integer DEFAULT 5 NOT NULL,
	"high_label" text,
	"low_label" text,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lobbying_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"jurisdiction" text NOT NULL,
	"period" text NOT NULL,
	"registrant" text,
	"spend_eur" integer,
	"spend_usd" integer,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"meetings" integer,
	"source_url" text,
	"raw" jsonb,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"seniority" text,
	"linkedin_url" text,
	"twitter_url" text,
	"bio_url" text,
	"notes" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"published_at" timestamp with time zone,
	"summary" text,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_excerpt" text,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"external_id" text,
	"title" text NOT NULL,
	"department" text,
	"location" text,
	"url" text NOT NULL,
	"source" text,
	"posted_at" timestamp with time zone,
	"snapshot" jsonb,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"color" text
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"headline" text,
	"bio" text,
	"weights" jsonb,
	"concerns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_tags" ADD CONSTRAINT "company_tags_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_tags" ADD CONSTRAINT "company_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_notes" ADD CONSTRAINT "fit_notes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_scores" ADD CONSTRAINT "frame_scores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_scores" ADD CONSTRAINT "frame_scores_frame_id_frames_id_fk" FOREIGN KEY ("frame_id") REFERENCES "public"."frames"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobbying_records" ADD CONSTRAINT "lobbying_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "companies_tier_idx" ON "companies" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "companies_status_idx" ON "companies" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "fit_notes_company_version_idx" ON "fit_notes" USING btree ("company_id","profile_version");--> statement-breakpoint
CREATE UNIQUE INDEX "frames_name_idx" ON "frames" USING btree ("name");--> statement-breakpoint
CREATE INDEX "lobbying_company_idx" ON "lobbying_records" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "lobbying_jurisdiction_idx" ON "lobbying_records" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "people_company_idx" ON "people" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "publications_company_idx" ON "publications" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "publications_type_idx" ON "publications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "publications_published_idx" ON "publications" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "publications_company_url_idx" ON "publications" USING btree ("company_id","url");--> statement-breakpoint
CREATE INDEX "roles_company_idx" ON "roles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "roles_open_idx" ON "roles" USING btree ("is_open");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_company_external_idx" ON "roles" USING btree ("company_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_label_idx" ON "tags" USING btree ("label");