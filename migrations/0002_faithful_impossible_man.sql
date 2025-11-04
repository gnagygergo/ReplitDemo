ALTER TABLE "accounts" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "company_roles" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "company_setting_master_domains" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "company_setting_master_functionalities" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "company_settings_master" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "licence_agreement_templates" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "licence_agreements" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "licences" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "quote_lines" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "translations" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "unit_of_measures" ADD COLUMN "created_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD COLUMN "created_date" timestamp DEFAULT now();