CREATE TABLE IF NOT EXISTS "daily_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"input_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manual_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"note_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"full_output" text NOT NULL,
	"structured_summary" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"type" text DEFAULT 'stock',
	"exchange" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_run_id_daily_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."daily_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
