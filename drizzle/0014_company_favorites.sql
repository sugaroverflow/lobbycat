CREATE TABLE "company_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"favorited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_favorites" ADD CONSTRAINT "company_favorites_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_favorites_company_idx" ON "company_favorites" USING btree ("company_id");