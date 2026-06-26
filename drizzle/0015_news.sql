CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"published_at" timestamp with time zone,
	"source" text DEFAULT 'company_press' NOT NULL,
	"summary" text,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_company_idx" ON "news" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "news_published_idx" ON "news" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "news_company_url_idx" ON "news" USING btree ("company_id","url");
