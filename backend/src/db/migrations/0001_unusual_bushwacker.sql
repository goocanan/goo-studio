CREATE TABLE "contents" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"projectId" text,
	"title" text NOT NULL,
	"description" text,
	"tags" text,
	"platform" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'idea' NOT NULL,
	"scheduledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batches" ALTER COLUMN "totalWeight" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "parts" ALTER COLUMN "weight" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "printDurationMinutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "path" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" DROP COLUMN "current_weight";--> statement-breakpoint
ALTER TABLE "inventory" DROP COLUMN "initial_weight";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "defaultReelWeight";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "weightUnit";