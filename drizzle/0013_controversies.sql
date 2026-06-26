CREATE TABLE "controversies" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"occurred_at" timestamp with time zone,
	"status" text NOT NULL,
	"severity" text,
	"company_role" text,
	"summary" text,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_excerpt" text,
	"corroboration" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source" text DEFAULT 'curated' NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "controversies" ADD CONSTRAINT "controversies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "controversies_company_idx" ON "controversies" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "controversies_type_idx" ON "controversies" USING btree ("type");--> statement-breakpoint
CREATE INDEX "controversies_status_idx" ON "controversies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "controversies_occurred_idx" ON "controversies" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "controversies_company_url_idx" ON "controversies" USING btree ("company_id","url");