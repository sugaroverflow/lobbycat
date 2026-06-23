ALTER TABLE "user_profile" ADD COLUMN "wizard_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "current_role_one_liner" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "exploring_text" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "location_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "open_text_answers" jsonb DEFAULT '[]'::jsonb NOT NULL;