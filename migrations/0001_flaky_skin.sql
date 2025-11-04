ALTER TABLE "accounts" ADD COLUMN "street_address" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "state_province" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "zip_code" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "tavily_api_key" text;