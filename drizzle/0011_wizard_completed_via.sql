ALTER TABLE "user_profile" ADD COLUMN "completed_via" text DEFAULT 'seed' NOT NULL;--> statement-breakpoint
-- Backfill: any existing row that already has a wizard_completed_at
-- predates the defense column. We trust historical completions as legit
-- (the symptom Fatima caught was the auto-fill *path*, not retroactive
-- corruption). Future bypass attempts will land as 'seed' and trip the
-- /api/health/wizard-integrity alert.
UPDATE "user_profile" SET "completed_via" = 'wizard-form' WHERE "wizard_completed_at" IS NOT NULL;
