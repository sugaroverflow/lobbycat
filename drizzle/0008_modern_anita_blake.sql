ALTER TABLE "frame_scores" ADD COLUMN "stale_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "frame_scores_stale_at_idx" ON "frame_scores" ("stale_at") WHERE "stale_at" IS NOT NULL;
