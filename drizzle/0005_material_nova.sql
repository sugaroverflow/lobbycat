CREATE TABLE "company_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"body" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frame_score_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"frame_id" integer NOT NULL,
	"evidence_kind" text NOT NULL,
	"evidence_id" integer NOT NULL,
	"weight" numeric(2, 1) DEFAULT '1.0' NOT NULL,
	"scored_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "frame_scores" ALTER COLUMN "score" SET DATA TYPE numeric(2, 1);--> statement-breakpoint
ALTER TABLE "frame_scores" ADD COLUMN "confidence" text;--> statement-breakpoint
ALTER TABLE "frame_scores" ADD COLUMN "scored_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "frame_scores" ADD COLUMN "evidence_version" text;--> statement-breakpoint
ALTER TABLE "frame_scores" ADD COLUMN "profile_version" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "frame_weights" jsonb DEFAULT '{"1":"medium","2":"medium","3":"medium","4":"medium","5":"medium","6":"medium"}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "company_notes" ADD CONSTRAINT "company_notes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_score_evidence" ADD CONSTRAINT "frame_score_evidence_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_score_evidence" ADD CONSTRAINT "frame_score_evidence_frame_id_frames_id_fk" FOREIGN KEY ("frame_id") REFERENCES "public"."frames"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_notes_company_idx" ON "company_notes" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "frame_score_evidence_company_frame_idx" ON "frame_score_evidence" USING btree ("company_id","frame_id");--> statement-breakpoint
CREATE INDEX "frame_score_evidence_kind_idx" ON "frame_score_evidence" USING btree ("evidence_kind");