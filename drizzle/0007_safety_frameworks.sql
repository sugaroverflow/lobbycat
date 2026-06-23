CREATE TABLE "safety_frameworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"framework_type" text NOT NULL,
	"title" text NOT NULL,
	"version" text,
	"url" text,
	"published_at" timestamp with time zone,
	"summary" text,
	"commitments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"strength" integer,
	"raw_excerpt" text,
	"source" text DEFAULT 'curated' NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "safety_frameworks" ADD CONSTRAINT "safety_frameworks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "safety_frameworks_company_idx" ON "safety_frameworks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "safety_frameworks_type_idx" ON "safety_frameworks" USING btree ("framework_type");--> statement-breakpoint
CREATE INDEX "safety_frameworks_published_idx" ON "safety_frameworks" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "safety_frameworks_company_title_idx" ON "safety_frameworks" USING btree ("company_id","title");