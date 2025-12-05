import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  decimal,
  date,
  timestamp,
  jsonb,
  boolean,
  index,
  unique,
  integer,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { IdCard } from "lucide-react";
import { z } from "zod";

// Culture Code interface for XML-based language metadata
export interface CultureCode {
  cultureCode: string;
  cultureName: string;
  cultureNameEnglish: string;
  numberThousandsSeparator: string;
  numberDecimalSeparator: string;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  defaultTimePresentation: string;
  nameOrder: string;
  fallBackCultureLanguage: string;
}

// Helper schemas to convert empty strings to null for optional fields
const optionalNumeric = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform(val => {
    if (val === "" || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  })
  .nullable();

const optionalDate = z
  .union([z.string(), z.date(), z.null(), z.undefined()])
  .transform(val => {
    if (val === "" || val === null || val === undefined) return null;
    return val;
  })
  .nullable();

const optionalTimestamp = z
  .union([z.string(), z.date(), z.null(), z.undefined()])
  .transform(val => {
    if (val === "" || val === null || val === undefined) return null;
    return val;
  })
  .nullable();

const optionalForeignKey = z
  .union([z.string(), z.null(), z.undefined()])
  .transform(val => {
    if (val === "" || val === null || val === undefined) return null;
    return val;
  })
  .nullable();

export const companies = pgTable("companies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyOfficialName: text("company_official_name").notNull(),
  companyAlias: text("company_alias"),
  companyRegistrationId: text("company_registration_id"),
  bankAccountNumber: text("bank_account_number"),
  address: text("address"),
  taxResidencyCountry: text("tax_residency_country"),
  logoUrl: text("logo_url"),
  openaiApiKey: text("openai_api_key"),
  openaiOrganizationId: text("openai_organization_id"),
  openaiPreferredModel: text("openai_preferred_model").default("gpt-4o"),
  tavilyApiKey: text("tavily_api_key"),
  createdDate: timestamp("created_date").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  mobilePhone: text("mobile_phone"),
  isPersonAccount: boolean("is_person_account"),
  isSelfEmployed: boolean("is_self_employed"),
  isLegalEntity: boolean("is_legal_entity"),
  isShippingAddress: boolean("is_shipping_address"),
  isCompanyContact: boolean("is_company_contact"),
  name: text("name"),
  companyOfficialName: text("company_official_name"),
  companyRegistrationId: text("company_registration_id"),
  taxId: text("tax_id"),
  address: text("address"),
  addressStreetAddress: text("address_street_address"),
  addressCity: text("address_city"),
  addressStateProvince: text("address_state_province"),
  addressZipCode: text("address_zip_code"),
  addressCountry: text("address_country"),
  industry: text("industry"),
  ownerId: text("owner_id"),
  parentAccountId: text("parent_account_id"),
  companyId: text("company_id"),
  createdDate: timestamp("created_date").defaultNow(),
});

export const assets = pgTable("assets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name"),
  description: text("description"),
  quantity: decimal("quantity", { precision: 17, scale: 5 }),
  serialNumber: text("serial_number").notNull(),
  installationDate: date("installation_date"),
  deletePhone: text("delete_phone"),
  productId: text("product_id"),
  accountId: text("account_id"),
  locationStreetAddress: text("location_street_address"),
  locationCity: text("location_city"),
  locationStateProvince: text("location_state_province"),
  locationZipCode: text("location_zip_code"),
  locationCountry: text("location_country"),
  companyId: text("company_id"),
  AssetInstallStatus: text("AssetInstallationStatus"),
  createdDate: timestamp("created_date").defaultNow(),
});

export const companyRoles = pgTable("company_roles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentCompanyRoleId: varchar("parent_company_role_id").references(
    (): AnyPgColumn => companyRoles.id,
    { onDelete: "restrict" },
  ),
  companyId: varchar("company_id"),
  createdDate: timestamp("created_date").defaultNow(),
});

export const userRoleAssignments = pgTable(
  "user_role_assignments",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyRoleId: varchar("company_role_id")
      .notNull()
      .references(() => companyRoles.id, { onDelete: "cascade" }),
    createdDate: timestamp("created_date").defaultNow(),
  },
  (table) => ({
    uniqueUserRole: unique().on(table.userId, table.companyRoleId),
  }),
);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  preferredLanguage: text("preferred_language"),
  timezone: text("timezone"), // IANA timezone ID (e.g., "America/New_York", "Europe/London")
  profileImageUrl: varchar("profile_image_url"),
  password: text("password"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  companyId: varchar("company_id"),
  companyContext: varchar("company_context"), // RLS context field - set during login, cleared during logout
  isGlobalAdmin: boolean("is_global_admin").default(false).notNull(),
  licenceAgreementId: varchar("licence_agreement_id").references(
    () => licenceAgreements.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const releases = pgTable("releases", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  releaseName: text("release_name").notNull(),
  releaseDescription: text("release_description"),
  order: integer("order").notNull(),
  commits: text("commits"),
  status: varchar("status", { length: 20 }).notNull().default("Planned"),
  createdDate: timestamp("created_date").defaultNow().notNull(),
  companyId: varchar("company_id"),
});

export const unitOfMeasures = pgTable("unit_of_measures", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  uomName: text("uom_name").notNull(),
  baseToType: boolean("base_to_type").notNull().default(false),
  companyId: text("company_id"),
  createdDate: timestamp("created_date").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  salesCategory: text("sales_category"),
  name: text("name"),
  salesUomId: varchar("sales_uom_id"),
  salesUnitPrice: decimal("sales_unit_price", {
    precision: 17,
    scale: 5,
  }),
  salesUnitPriceCurrency: text("sales_unit_price_currency"),
  vatPercent: decimal("vat_percent", { precision: 17, scale: 5 }),
  companyId: text("company_id"),
  createdDate: timestamp("created_date").defaultNow(),
});

export const translations = pgTable("translations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  labelCode: text("label_code").notNull(),
  labelContent: text("label_content").notNull(),
  languageCode: text("language_code").notNull(),
  createdDate: timestamp("created_date").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name"),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  customerAddress: text("customer_address"),
  customerAddressCity:text("customer_address_city"),
  customerAddressStreetAddress: text("customer_address_street_address"),
  customerAddressStateProvince: text("customer_address_state_province"),
  customerAddressZipCode: text("customer_address_zip_code"),
  customerAddressCountry: text("customer_address_country"),
  companyId: text("company_id"),
  sellerName: text("seller_name"),
  sellerAddress: text("seller_address"),
  sellerBankAccount: text("seller_bank_account"),
  sellerUserId: text("seller_user_id"),
  sellerEmail: text("seller_email"),
  sellerPhone: text("seller_phone"),
  quoteExpirationDate: date("quote_expiration_date"),
  createdBy: text("created_by"),
  createdDate: timestamp("created_date").defaultNow(),
  netGrandTotal: decimal("net_grand_total", { precision: 17, scale: 5 }),
  grossGrandTotal: decimal("gross_grand_total", { precision: 17, scale: 5 }),
});

export const quoteLines = pgTable("quote_lines", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  quoteName: text("quote_name"),
  productId: varchar("product_id"),
  name: text("name"),
  productUnitPrice: decimal("product_unit_price", { precision: 17, scale: 5 }),
  unitPriceCurrency: text("unit_price_currency"),
  productUnitPriceOverride: decimal("product_unit_price_override", {
    precision: 17,
    scale: 5,
  }),
  quoteUnitPrice: decimal("quote_unit_price", { precision: 17, scale: 5 }),
  unitPriceDiscountPercent: decimal("unit_price_discount_percent", {
    precision: 17,
    scale: 5,
  }),
  unitPriceDiscountAmount: decimal("unit_price_discount_amount", {
    precision: 17,
    scale: 5,
  }),
  finalUnitPrice: decimal("final_unit_price", { precision: 17, scale: 5 }),
  salesUom: text("sales_uom"),
  quotedQuantity: decimal("quoted_quantity", { precision: 17, scale: 5 }),
  subtotalBeforeRowDiscounts: decimal("subtotal_before_row_discounts", {
    precision: 17,
    scale: 5,
  }),
  discountPercentOnSubtotal: decimal("discount_percent_on_subtotal", {
    precision: 17,
    scale: 5,
  }),
  discountAmountOnSubtotal: decimal("discount_amount_on_subtotal", {
    precision: 17,
    scale: 5,
  }),
  finalSubtotal: decimal("final_subtotal", { precision: 17, scale: 5 }),
  vatPercent: decimal("vat_percent", { precision: 17, scale: 5 }),
  vatUnitAmount: decimal("vat_unit_amount", { precision: 17, scale: 5 }),
  vatOnSubtotal: decimal("vat_on_subtotal", { precision: 17, scale: 5 }),
  grossSubtotal: decimal("gross_subtotal", { precision: 17, scale: 5 }),
  createdDate: timestamp("created_date").defaultNow(),
});

export const devPatterns = pgTable("dev_patterns", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  pattern: text("pattern"),
});

export const licences = pgTable("licences", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdDate: timestamp("created_date").defaultNow(),
});

export const licenceAgreementTemplates = pgTable(
  "licence_agreement_templates",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    templateCode: text("template-code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    licenceId: varchar("licence_id")
      .notNull()
      .references(() => licences.id, { onDelete: "restrict" }),
    ValidFrom: date("valid_from"),
    ValidTo: date("valid_to"),
    agreementBaseDurationMonths: integer("agreement_base_duration_months"),
    price: decimal("price", { precision: 17, scale: 5 }).notNull(),
    currency: text("currency").notNull(),
    createdDate: timestamp("created_date").defaultNow(),
  },
);

export const licenceAgreements = pgTable("licence_agreements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  licenceAgreementTemplateId: varchar("licence_agreement_template_id")
    .notNull()
    .references(() => licenceAgreementTemplates.id, { onDelete: "restrict" }),
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  price: decimal("price", { precision: 17, scale: 5 }),
  currency: text("currency"),
  licenceSeats: integer("licence_seat"),
  licenceSeatsRemaining: integer("licence_seats_remaining"),
  licenceSeatsUsed: integer("licence_seats_used"),
  createdDate: timestamp("created_date").defaultNow(),
});

// Company Settings tables
export const companySettingMasterDomains = pgTable(
  "company_setting_master_domains",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    createdDate: timestamp("created_date").defaultNow(),
  },
);

export const companySettingMasterFunctionalities = pgTable(
  "company_setting_master_functionalities",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    domainId: varchar("domain_id")
      .notNull()
      .references(() => companySettingMasterDomains.id, {
        onDelete: "restrict",
      }),
    createdDate: timestamp("created_date").defaultNow(),
  },
);

export const companySettingsMaster = pgTable("company_settings_master", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  functionalityId: varchar("functionality_id").references(
    () => companySettingMasterFunctionalities.id,
    { onDelete: "restrict" },
  ),
  settingFunctionalDomainCode: text("setting_functional_domain_code"),
  settingFunctionalDomainName: text("setting_functional_domain_name"),
  settingFunctionalityName: text("setting_functionality_name"),
  settingFunctionalityCode: text("setting_functionality_code"),
  settingCode: text("setting_code").unique(),
  settingName: text("setting_name"),
  settingDescription: text("setting_description"),
  settingValues: text("setting_values"),
  defaultValue: text("default_value"),
  specialValueSet: text("special_value_set"),
  cantBeTrueIfTheFollowingIsFalse: text(
    "cant_be_true_if_the_following_is_false",
  ),
  articleCode: text("article_code"),
  settingOrderWithinFunctionality: integer(
    "setting_order_within_functionality",
  ),
  settingShowsInLevel: integer("setting_shows_in_level"),
  settingOnceEnabledCannotBeDisabled: boolean(
    "setting_once_enabled_cannot_be_disabled",
  ),
  createdDate: timestamp("created_date").defaultNow(),
});

export const companySettings = pgTable(
  "company_settings",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    companySettingsMasterId: varchar("company_settings_master_id")
      .notNull()
      .references(() => companySettingsMaster.id, { onDelete: "restrict" }),
    settingCode: text("setting_code"),
    settingName: text("setting_name"),
    settingValue: text("setting_value"),
    companyId: varchar("company_id").references(() => companies.id, {
      onDelete: "restrict",
    }),
    createdDate: timestamp("created_date").defaultNow(),
    lastUpdatedDate: timestamp("last_updated_date").defaultNow(),
    lastUpdatedBy: varchar("last_updated_by").references(() => users.id, {
      onDelete: "restrict",
    }),
  },
  (table) => ({
    uniqueCompanyMaster: unique(
      "company_settings_company_id_company_settings_master_id_unique",
    ).on(table.companyId, table.companySettingsMasterId),
  }),
);
//Knowledge Base tables
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  articleTitle: text("article_title"),
  articleContent: text("article_content"),
  articleCode: text("article_code"),
  functionalDomainId: varchar("functional_domain_id").references(
    () => companySettingMasterDomains.id,
    { onDelete: "set null" },
  ),
  functionalityId: varchar("functionality_id").references(
    () => companySettingMasterFunctionalities.id,
    { onDelete: "set null" },
  ),
  articleFunctionalDomain: text("article_functional_domain"),
  articleFunctionalityName: text("article_functionality_name"),
  articleTags: text("article_tags"),
  articleKeywords: text("article_keywords"),
  isPublished: boolean("is_published"),
  isInternal: boolean("is_internal"),
  languageCode: text("language_code"),
  authorId: varchar("author_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  createdDate: timestamp("created_date").defaultNow(),
});

// Emails table
export const emails = pgTable("emails", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  fromEmail: text("from_email").notNull(),
  toEmail: text("to_email").notNull(),
  ccEmail: text("cc_email"),
  bccEmail: text("bcc_email"),
  sentAt: timestamp("sent_at"),
  attachments: jsonb("attachments"),
  parentType: text("parent_type").notNull(),
  parentId: varchar("parent_id").notNull(),
  createdBy: varchar("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  companyId: varchar("company_id"),
});

// Define relations

export const accountsRelations = relations(accounts, ({ one }) => ({
  owner: one(users, {
    fields: [accounts.ownerId],
    references: [users.id],
  }),
}));

export const companyRolesRelations = relations(
  companyRoles,
  ({ one, many }) => ({
    parentCompanyRole: one(companyRoles, {
      fields: [companyRoles.parentCompanyRoleId],
      references: [companyRoles.id],
      relationName: "companyRoleHierarchy",
    }),
    childCompanyRoles: many(companyRoles, {
      relationName: "companyRoleHierarchy",
    }),
    userRoleAssignments: many(userRoleAssignments),
  }),
);

export const userRoleAssignmentsRelations = relations(
  userRoleAssignments,
  ({ one }) => ({
    user: one(users, {
      fields: [userRoleAssignments.userId],
      references: [users.id],
    }),
    companyRole: one(companyRoles, {
      fields: [userRoleAssignments.companyRoleId],
      references: [companyRoles.id],
    }),
  }),
);

export const productsRelations = relations(products, ({ one }) => ({
  salesUom: one(unitOfMeasures, {
    fields: [products.salesUomId],
    references: [unitOfMeasures.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ many, one }) => ({
  quoteLines: many(quoteLines),
  customer: one(accounts, {
    fields: [quotes.customerId],
    references: [accounts.id],
  }),
}));

export const quoteLinesRelations = relations(quoteLines, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteLines.quoteId],
    references: [quotes.id],
  }),
  product: one(products, {
    fields: [quoteLines.productId],
    references: [products.id],
  }),
}));

export const licencesRelations = relations(licences, ({ many }) => ({
  licenceAgreementTemplates: many(licenceAgreementTemplates),
}));

export const licenceAgreementTemplatesRelations = relations(
  licenceAgreementTemplates,
  ({ one, many }) => ({
    licence: one(licences, {
      fields: [licenceAgreementTemplates.licenceId],
      references: [licences.id],
    }),
    licenceAgreements: many(licenceAgreements),
  }),
);

export const licenceAgreementsRelations = relations(
  licenceAgreements,
  ({ one }) => ({
    licenceAgreementTemplate: one(licenceAgreementTemplates, {
      fields: [licenceAgreements.licenceAgreementTemplateId],
      references: [licenceAgreementTemplates.id],
    }),
    company: one(companies, {
      fields: [licenceAgreements.companyId],
      references: [companies.id],
    }),
  }),
);

export const knowledgeArticlesRelations = relations(
  knowledgeArticles,
  ({ one }) => ({
    author: one(users, {
      fields: [knowledgeArticles.authorId],
      references: [users.id],
    }),
    functionalDomain: one(companySettingMasterDomains, {
      fields: [knowledgeArticles.functionalDomainId],
      references: [companySettingMasterDomains.id],
    }),
    functionality: one(companySettingMasterFunctionalities, {
      fields: [knowledgeArticles.functionalityId],
      references: [companySettingMasterFunctionalities.id],
    }),
  }),
);

export const insertCompanySchema = createInsertSchema(companies)
  .omit({
    id: true,
  })
  .extend({
    companyOfficialName: z.string().min(1, "Company official name is required"),
    taxResidencyCountry: z.string().optional().nullable(),
  });

export const insertAccountSchema = createInsertSchema(accounts)
  .omit({
    id: true,
    createdDate: true,
    companyId: true,
  });


export const insertCompanyRoleSchema = createInsertSchema(companyRoles)
  .omit({
    id: true,
  })
  .extend({
    name: z.string().min(1, "Role name is required"),
    parentCompanyRoleId: optionalForeignKey,
  });

export const insertUserRoleAssignmentSchema = createInsertSchema(
  userRoleAssignments,
)
  .omit({
    id: true,
  })
  .extend({
    userId: z.string().min(1, "User is required"),
    companyRoleId: z.string().min(1, "Company role is required"),
  });

export const insertReleaseSchema = createInsertSchema(releases)
  .omit({
    id: true,
    createdDate: true,
  })
  .extend({
    releaseName: z.string().min(1, "Release name is required"),
    order: z.number().min(1, "Order must be a positive number"),
    status: z.enum(["Planned", "In Progress", "Completed", "Dropped"]),
  });

export const insertAssetSchema = createInsertSchema(assets)
  .omit({
    id: true,
    companyId: true,
    createdDate: true,
  });

export const insertUnitOfMeasureSchema = createInsertSchema(unitOfMeasures)
  .omit({
    id: true,
  })
  .extend({
    type: z.string().min(1, "Type is required"),
    uomName: z.string().min(1, "UoM Name is required"),
    baseToType: z.boolean(),
  });

export const insertProductSchema = createInsertSchema(products)
  .omit({
    id: true,
    createdDate: true,
  });

export const insertTranslationSchema = createInsertSchema(translations)
  .omit({
    id: true,
  })
  .extend({
    labelCode: z.string().min(1, "Label code is required"),
    labelContent: z.string().min(1, "Label content is required"),
    languageCode: z.string().min(1, "Language code is required"),
  });

export const insertQuoteSchema = createInsertSchema(quotes)
  .omit({
    id: true,
    createdDate: true,
  });

export const insertQuoteLineSchema = createInsertSchema(quoteLines)
  .omit({
    id: true,
  })
  .extend({
    quoteId: z.string().min(1, "Quote ID is required"),
    productId: optionalForeignKey,
    productUnitPrice: optionalNumeric,
    productUnitPriceOverride: optionalNumeric,
    quoteUnitPrice: optionalNumeric,
    unitPriceDiscountPercent: optionalNumeric,
    unitPriceDiscountAmount: optionalNumeric,
    finalUnitPrice: optionalNumeric,
    quotedQuantity: optionalNumeric,
    subtotalBeforeRowDiscounts: optionalNumeric,
    discountPercentOnSubtotal: optionalNumeric,
    discountAmountOnSubtotal: optionalNumeric,
    finalSubtotal: optionalNumeric,
    vatPercent: optionalNumeric,
    vatUnitAmount: optionalNumeric,
    vatOnSubtotal: optionalNumeric,
    grossSubtotal: optionalNumeric,
  });

export const insertKnowledgeArticleSchema = createInsertSchema(
  knowledgeArticles,
)
  .omit({
    id: true,
    createdDate: true,
  })
  .extend({
    articleTitle: z.string().min(1, "Article title is required"),
    authorId: z.string().min(1, "Author is required"),
    functionalDomainId: optionalForeignKey,
    functionalityId: optionalForeignKey,
    languageCode: optionalForeignKey,
  });

export const insertDevPatternSchema = createInsertSchema(devPatterns)
  .omit({
    id: true,
  })
  .extend({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    pattern: z.string().optional(),
  });

export const insertLicenceSchema = createInsertSchema(licences)
  .omit({
    id: true,
  })
  .extend({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
  });

export const insertLicenceAgreementTemplateSchema = createInsertSchema(
  licenceAgreementTemplates,
)
  .omit({
    id: true,
  })
  .extend({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    licenceId: z.string().min(1, "Licence is required"),
    ValidFrom: optionalDate,
    ValidTo: optionalDate,
    price: optionalNumeric.refine((val) => val !== null && val > 0, {
      message: "Price is required and must be greater than 0",
    }),
    currency: z.string().min(1, "Currency is required"),
    agreementBaseDurationMonths: optionalNumeric,
  });

export const insertLicenceAgreementSchema = createInsertSchema(
  licenceAgreements,
)
  .omit({
    id: true,
  })
  .extend({
    licenceAgreementTemplateId: z
      .string()
      .min(1, "Licence agreement template is required"),
    companyId: z.string().min(1, "Company is required"),
    validFrom: optionalDate,
    validTo: optionalDate,
    price: optionalNumeric,
    currency: z.string().optional(),
    licenceSeats: optionalNumeric,
    licenceSeatsRemaining: optionalNumeric,
    licenceSeatsUsed: optionalNumeric,
  });

export const insertEmailSchema = createInsertSchema(emails)
  .omit({
    id: true,
    sentAt: true,
  })
  .extend({
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
    fromEmail: z.string().email("From email must be valid"),
    toEmail: z.string().min(1, "To email is required"),
    ccEmail: z.string().optional(),
    bccEmail: z.string().optional(),
    attachments: z
      .array(
        z.object({
          fileName: z.string(),
          fileSize: z.number(),
          fileType: z.string(),
          fileUrl: z.string(),
        }),
      )
      .optional(),
    parentType: z.enum(["Quote", "Account"]),
    parentId: z.string().min(1, "Parent ID is required"),
    createdBy: z.string().min(1, "Created by is required"),
  });

export const insertCompanySettingMasterDomainSchema = createInsertSchema(
  companySettingMasterDomains,
)
  .omit({
    id: true,
  })
  .extend({
    code: z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
  });

export const insertCompanySettingMasterFunctionalitySchema = createInsertSchema(
  companySettingMasterFunctionalities,
)
  .omit({
    id: true,
  })
  .extend({
    code: z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
    domainId: z.string().min(1, "Domain is required"),
  });

export const insertCompanySettingsMasterSchema = createInsertSchema(
  companySettingsMaster,
)
  .omit({
    id: true,
  })
  .extend({
    functionalityId: optionalForeignKey,
    settingName: z.string().min(1, "Setting name is required"),
    settingCode: z.string().optional(),
    settingDescription: z.string().optional(),
    settingValues: z.string().optional(),
    defaultValue: z.string().optional(),
    specialValueSet: z.string().optional(),
    articleCode: z.string().optional(),
  });

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertCompanyRole = z.infer<typeof insertCompanyRoleSchema>;
export type CompanyRole = typeof companyRoles.$inferSelect;
export type InsertUserRoleAssignment = z.infer<
  typeof insertUserRoleAssignmentSchema
>;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;
export type InsertUnitOfMeasure = z.infer<typeof insertUnitOfMeasureSchema>;
export type UnitOfMeasure = typeof unitOfMeasures.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuoteLine = z.infer<typeof insertQuoteLineSchema>;
export type QuoteLine = typeof quoteLines.$inferSelect;
export type InsertDevPattern = z.infer<typeof insertDevPatternSchema>;
export type DevPattern = typeof devPatterns.$inferSelect;
export type InsertLicence = z.infer<typeof insertLicenceSchema>;
export type Licence = typeof licences.$inferSelect;
export type InsertLicenceAgreementTemplate = z.infer<
  typeof insertLicenceAgreementTemplateSchema
>;
export type LicenceAgreementTemplate =
  typeof licenceAgreementTemplates.$inferSelect;
export type InsertLicenceAgreement = z.infer<
  typeof insertLicenceAgreementSchema
>;
export type LicenceAgreement = typeof licenceAgreements.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertCompanySettingMasterDomain = z.infer<
  typeof insertCompanySettingMasterDomainSchema
>;
export type CompanySettingMasterDomain =
  typeof companySettingMasterDomains.$inferSelect;
export type InsertCompanySettingMasterFunctionality = z.infer<
  typeof insertCompanySettingMasterFunctionalitySchema
>;
export type CompanySettingMasterFunctionality =
  typeof companySettingMasterFunctionalities.$inferSelect;
export type InsertCompanySettingsMaster = z.infer<
  typeof insertCompanySettingsMasterSchema
>;
export type CompanySettingsMaster = typeof companySettingsMaster.$inferSelect;
export type CompanySetting = typeof companySettings.$inferSelect;

// Company settings with master data (used by API endpoints)
export type CompanySettingWithMaster = {
  id: string;
  companySettingsMasterId: string;
  settingCode: string | null;
  settingName: string | null;
  settingValue: string | null;
  companyId: string | null;
  createdDate: Date | null;
  lastUpdatedDate: Date | null;
  lastUpdatedBy: string | null;
  settingFunctionalDomainCode: string | null;
  settingFunctionalDomainName: string | null;
  settingFunctionalityName: string | null;
  settingFunctionalityCode: string | null;
  settingDescription: string | null;
  settingValues: string | null;
  defaultValue: string | null;
  cantBeTrueIfTheFollowingIsFalse: string | null;
  settingOrderWithinFunctionality: number | null;
  settingShowsInLevel: number | null;
  settingOnceEnabledCannotBeDisabled: boolean | null;
};

export type AccountWithOwner = Account & {
  owner: User;
};

export type CompanyRoleWithParent = CompanyRole & {
  parentCompanyRole?: CompanyRole | null;
};

export type UserRoleAssignmentWithUserAndRole = UserRoleAssignment & {
  user: User;
  companyRole: CompanyRole;
};

export type LicenceAgreementTemplateWithLicence = LicenceAgreementTemplate & {
  licence: Licence;
};

export type LicenceAgreementWithDetails = LicenceAgreement & {
  licenceAgreementTemplate: LicenceAgreementTemplate;
  company: Company;
};

export type InsertKnowledgeArticle = z.infer<
  typeof insertKnowledgeArticleSchema
>;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;

export type KnowledgeArticleWithAuthor = KnowledgeArticle & {
  author: User;
};

// User types - Required for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
