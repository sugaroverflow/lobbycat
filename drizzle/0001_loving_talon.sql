CREATE TABLE "fit_note_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit_note_messages" ADD CONSTRAINT "fit_note_messages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fit_note_messages_company_idx" ON "fit_note_messages" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "fit_note_messages_created_idx" ON "fit_note_messages" USING btree ("created_at");