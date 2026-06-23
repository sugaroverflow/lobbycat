CREATE TABLE "consultation_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"jurisdiction" text NOT NULL,
	"regulator" text NOT NULL,
	"consultation_name" text NOT NULL,
	"submitted_at" timestamp with time zone,
	"url" text,
	"summary" text,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_excerpt" text,
	"source" text DEFAULT 'curated' NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consultation_submissions" ADD CONSTRAINT "consultation_submissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consultation_company_idx" ON "consultation_submissions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "consultation_regulator_idx" ON "consultation_submissions" USING btree ("regulator");--> statement-breakpoint
CREATE INDEX "consultation_submitted_idx" ON "consultation_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "consultation_company_name_idx" ON "consultation_submissions" USING btree ("company_id","consultation_name");