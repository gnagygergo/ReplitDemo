CREATE TABLE "accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"mobile_phone" text,
	"is_person_account" boolean,
	"is_self_employed" boolean,
	"is_legal_entity" boolean,
	"is_shipping_address" boolean,
	"is_company_contact" boolean,
	"name" text NOT NULL,
	"company_official_name" text,
	"company_registration_id" text,
	"tax_id" text,
	"address" text,
	"industry" text,
	"owner_id" varchar NOT NULL,
	"parent_account_id" varchar,
	"company_id" varchar
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_official_name" text NOT NULL,
	"company_alias" text,
	"company_registration_id" text,
	"bank_account_number" text,
	"address" text,
	"tax_residency_country" text,
	"logo_url" text,
	"openai_api_key" text,
	"openai_organization_id" text,
	"openai_preferred_model" text DEFAULT 'gpt-4o'
);
--> statement-breakpoint
CREATE TABLE "company_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_company_role_id" varchar,
	"company_id" varchar
);
--> statement-breakpoint
CREATE TABLE "company_setting_master_domains" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_setting_master_functionalities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"domain_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_settings_master_id" varchar NOT NULL,
	"setting_code" text,
	"setting_name" text,
	"setting_value" text,
	"company_id" varchar,
	"created_date" timestamp DEFAULT now(),
	"last_updated_date" timestamp DEFAULT now(),
	"last_updated_by" varchar,
	CONSTRAINT "company_settings_company_id_company_settings_master_id_unique" UNIQUE("company_id","company_settings_master_id")
);
--> statement-breakpoint
CREATE TABLE "company_settings_master" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"functionality_id" varchar,
	"setting_functional_domain_code" text,
	"setting_functional_domain_name" text,
	"setting_functionality_name" text,
	"setting_functionality_code" text,
	"setting_code" text,
	"setting_name" text,
	"setting_description" text,
	"setting_values" text,
	"default_value" text,
	"special_value_set" text,
	"cant_be_true_if_the_following_is_false" text,
	"article_code" text,
	"setting_order_within_functionality" integer,
	"setting_shows_in_level" integer,
	"setting_once_enabled_cannot_be_disabled" boolean
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"country_code" varchar PRIMARY KEY NOT NULL,
	"country_name" text,
	"country_name_locale_name" text,
	"country_phone_prefix" text
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"currency_iso_code" text PRIMARY KEY NOT NULL,
	"currency_name" text NOT NULL,
	"currency_culture" text,
	"currency_locale_name" text,
	"currency_symbol" text NOT NULL,
	"currency_symbol_position" text NOT NULL,
	"currency_decimal_places" integer,
	"currency_thousands_separator" text,
	"currency_decimal_separator" text
);
--> statement-breakpoint
CREATE TABLE "dev_patterns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"pattern" text
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"from_email" text NOT NULL,
	"to_email" text NOT NULL,
	"cc_email" text,
	"bcc_email" text,
	"sent_at" timestamp,
	"attachments" jsonb,
	"parent_type" text NOT NULL,
	"parent_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"company_id" varchar
);
--> statement-breakpoint
CREATE TABLE "knowledge_articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_title" text,
	"article_content" text,
	"article_code" text,
	"functional_domain_id" varchar,
	"functionality_id" varchar,
	"article_functional_domain" text,
	"article_functionality_name" text,
	"article_tags" text,
	"article_keywords" text,
	"is_published" boolean,
	"is_internal" boolean,
	"language_code" text,
	"author_id" varchar,
	"created_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language_code" text NOT NULL,
	"language_name" text NOT NULL,
	CONSTRAINT "languages_language_code_unique" UNIQUE("language_code")
);
--> statement-breakpoint
CREATE TABLE "licence_agreement_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template-code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"licence_id" varchar NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"agreement_base_duration_months" integer,
	"price" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	CONSTRAINT "licence_agreement_templates_template-code_unique" UNIQUE("template-code")
);
--> statement-breakpoint
CREATE TABLE "licence_agreements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"licence_agreement_template_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"price" numeric(12, 2),
	"currency" text,
	"licence_seat" integer,
	"licence_seats_remaining" integer,
	"licence_seats_used" integer
);
--> statement-breakpoint
CREATE TABLE "licences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "licences_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"close_date" date NOT NULL,
	"total_revenue" numeric(12, 2) NOT NULL,
	"account_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"company_id" varchar
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_category" text NOT NULL,
	"product_name" text NOT NULL,
	"sales_uom_id" varchar NOT NULL,
	"sales_unit_price" numeric(12, 3) NOT NULL,
	"sales_unit_price_currency" text NOT NULL,
	"vat_percent" numeric(5, 3) NOT NULL,
	"company_id" varchar
);
--> statement-breakpoint
CREATE TABLE "quote_lines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" varchar NOT NULL,
	"quote_name" text,
	"product_id" varchar,
	"product_name" text,
	"product_unit_price" numeric(12, 3),
	"unit_price_currency" text,
	"product_unit_price_override" numeric(12, 3),
	"quote_unit_price" numeric(12, 3),
	"unit_price_discount_percent" numeric(12, 3),
	"unit_price_discount_amount" numeric(12, 3),
	"final_unit_price" numeric(12, 3),
	"sales_uom" text,
	"quoted_quantity" numeric(12, 3),
	"subtotal_before_row_discounts" numeric(12, 3),
	"discount_percent_on_subtotal" numeric(12, 3),
	"discount_amount_on_subtotal" numeric(12, 3),
	"final_subtotal" numeric(12, 3),
	"vat_percent" numeric(12, 3),
	"vat_unit_amount" numeric(12, 3),
	"vat_on_subtotal" numeric(12, 3),
	"gross_subtotal" numeric(12, 3)
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_name" text,
	"customer_id" varchar,
	"customer_name" text,
	"customer_address" text,
	"company_id" varchar,
	"seller_name" text,
	"seller_address" text,
	"seller_bank_account" text,
	"seller_user_id" varchar,
	"seller_email" text,
	"seller_phone" text,
	"quote_expiration_date" date,
	"created_by" varchar,
	"created_date" timestamp DEFAULT now(),
	"net_grand_total" numeric(12, 3),
	"gross_grand_total" numeric(12, 3)
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_name" text NOT NULL,
	"release_description" text,
	"order" integer NOT NULL,
	"commits" text,
	"status" varchar(20) DEFAULT 'Planned' NOT NULL,
	"created_date" timestamp DEFAULT now() NOT NULL,
	"company_id" varchar
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label_code" text NOT NULL,
	"label_content" text NOT NULL,
	"language_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_of_measures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"uom_name" text NOT NULL,
	"base_to_type" boolean DEFAULT false NOT NULL,
	"company_id" varchar
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"company_role_id" varchar NOT NULL,
	CONSTRAINT "user_role_assignments_user_id_company_role_id_unique" UNIQUE("user_id","company_role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"phone" varchar,
	"preferred_language" text,
	"profile_image_url" varchar,
	"password" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"company_id" varchar,
	"company_context" varchar,
	"is_global_admin" boolean DEFAULT false NOT NULL,
	"licence_agreement_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_accounts_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_tax_residency_country_countries_country_code_fk" FOREIGN KEY ("tax_residency_country") REFERENCES "public"."countries"("country_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_roles" ADD CONSTRAINT "company_roles_parent_company_role_id_company_roles_id_fk" FOREIGN KEY ("parent_company_role_id") REFERENCES "public"."company_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_setting_master_functionalities" ADD CONSTRAINT "company_setting_master_functionalities_domain_id_company_setting_master_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."company_setting_master_domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_settings_master_id_company_settings_master_id_fk" FOREIGN KEY ("company_settings_master_id") REFERENCES "public"."company_settings_master"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings_master" ADD CONSTRAINT "company_settings_master_functionality_id_company_setting_master_functionalities_id_fk" FOREIGN KEY ("functionality_id") REFERENCES "public"."company_setting_master_functionalities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_functional_domain_id_company_setting_master_domains_id_fk" FOREIGN KEY ("functional_domain_id") REFERENCES "public"."company_setting_master_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_functionality_id_company_setting_master_functionalities_id_fk" FOREIGN KEY ("functionality_id") REFERENCES "public"."company_setting_master_functionalities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_language_code_languages_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licence_agreement_templates" ADD CONSTRAINT "licence_agreement_templates_licence_id_licences_id_fk" FOREIGN KEY ("licence_id") REFERENCES "public"."licences"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licence_agreements" ADD CONSTRAINT "licence_agreements_licence_agreement_template_id_licence_agreement_templates_id_fk" FOREIGN KEY ("licence_agreement_template_id") REFERENCES "public"."licence_agreement_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licence_agreements" ADD CONSTRAINT "licence_agreements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sales_uom_id_unit_of_measures_id_fk" FOREIGN KEY ("sales_uom_id") REFERENCES "public"."unit_of_measures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_accounts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_seller_user_id_users_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translations" ADD CONSTRAINT "translations_language_code_languages_language_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("language_code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_company_role_id_company_roles_id_fk" FOREIGN KEY ("company_role_id") REFERENCES "public"."company_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_preferred_language_languages_language_code_fk" FOREIGN KEY ("preferred_language") REFERENCES "public"."languages"("language_code") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_licence_agreement_id_licence_agreements_id_fk" FOREIGN KEY ("licence_agreement_id") REFERENCES "public"."licence_agreements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");