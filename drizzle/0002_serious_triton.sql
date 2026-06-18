CREATE TABLE "frame_answers" (
	"company_id" integer NOT NULL,
	"frame_id" integer NOT NULL,
	"answer" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "frame_answers_company_id_frame_id_pk" PRIMARY KEY("company_id","frame_id")
);
--> statement-breakpoint
ALTER TABLE "frames" ADD COLUMN "kind" text DEFAULT 'scale' NOT NULL;--> statement-breakpoint
ALTER TABLE "frames" ADD COLUMN "prompt" text;--> statement-breakpoint
ALTER TABLE "frame_answers" ADD CONSTRAINT "frame_answers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_answers" ADD CONSTRAINT "frame_answers_frame_id_frames_id_fk" FOREIGN KEY ("frame_id") REFERENCES "public"."frames"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "frames_kind_idx" ON "frames" USING btree ("kind");