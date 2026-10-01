CREATE TABLE "inventory_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"inventory_id" text NOT NULL,
	"transaction_type" text NOT NULL,
	"weight_change" integer NOT NULL,
	"reference_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "current_weight" integer DEFAULT null;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "initial_weight" integer DEFAULT null;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;