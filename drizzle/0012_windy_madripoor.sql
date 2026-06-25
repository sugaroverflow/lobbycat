CREATE TABLE "clarify_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" text NOT NULL,
	"body" text NOT NULL,
	"move_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clarify_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"trigger" text NOT NULL,
	"seed_company" integer,
	"seed_frame" integer,
	"seed_note" text,
	"end_state" text,
	"proposal_kind" text,
	"proposal_data" jsonb,
	"proposal_accepted" boolean
);
--> statement-breakpoint
ALTER TABLE "clarify_messages" ADD CONSTRAINT "clarify_messages_session_id_clarify_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."clarify_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarify_sessions" ADD CONSTRAINT "clarify_sessions_seed_company_companies_id_fk" FOREIGN KEY ("seed_company") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarify_sessions" ADD CONSTRAINT "clarify_sessions_seed_frame_frames_id_fk" FOREIGN KEY ("seed_frame") REFERENCES "public"."frames"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clarify_messages_session_idx" ON "clarify_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "clarify_sessions_started_at_idx" ON "clarify_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "clarify_sessions_seed_company_idx" ON "clarify_sessions" USING btree ("seed_company");