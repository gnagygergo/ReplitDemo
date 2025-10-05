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
import { z } from "zod";

export const companies = pgTable("companies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyOfficialName: text("company_official_name").notNull(),
  companyAlias: text("company_alias"),
  companyRegistrationId: text("company_registration_id"),
  bankAccountNumber: text("bank_account_number"),
  address: text("address"),
});

export const accounts = pgTable("accounts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  industry: text("industry").notNull(),
  ownerId: varchar("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  companyId: varchar("company_id"),
});

export const opportunities = pgTable("opportunities", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  closeDate: date("close_date").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull(),
  accountId: varchar("account_id")
    .notNull()
    .references(() => accounts.id),
  ownerId: varchar("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  companyId: varchar("company_id"),
});

export const cases = pgTable("cases", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  accountId: varchar("account_id")
    .notNull()
    .references(() => accounts.id),
  subject: text("subject"),
  description: text("description"),
  fromEmail: text("from_email").notNull(),
  ownerId: varchar("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  companyId: varchar("company_id"),
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
  preferredLanguage: text("preferred_language").references(
    () => languages.languageCode,
    { onDelete: "set null" },
  ),
  profileImageUrl: varchar("profile_image_url"),
  password: text("password"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  companyId: varchar("company_id"),
  companyContext: varchar("company_context"), // RLS context field - set during login, cleared during logout
  isGlobalAdmin: boolean("is_global_admin").default(false).notNull(),
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
  companyId: varchar("company_id"),
});

export const products = pgTable("products", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  salesCategory: text("sales_category").notNull(),
  productName: text("product_name").notNull(),
  salesUomId: varchar("sales_uom_id")
    .notNull()
    .references(() => unitOfMeasures.id, { onDelete: "restrict" }),
  salesUnitPrice: decimal("sales_unit_price", {
    precision: 12,
    scale: 3,
  }).notNull(),
  salesUnitPriceCurrency: text("sales_unit_price_currency").notNull(),
  vatPercent: decimal("vat_percent", { precision: 5, scale: 3 }).notNull(),
  companyId: varchar("company_id"),
});

export const languages = pgTable("languages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  languageCode: text("language_code").notNull().unique(),
  languageName: text("language_name").notNull(),
});

export const translations = pgTable("translations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  labelCode: text("label_code").notNull(),
  labelContent: text("label_content").notNull(),
  languageCode: text("language_code")
    .notNull()
    .references(() => languages.languageCode, { onDelete: "restrict" }),
});

export const quotes = pgTable("quotes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  quoteName: text("quote_name"),
  customerId: varchar("customer_id").references(() => accounts.id, {
    onDelete: "restrict",
  }),
  customerName: text("customer_name"),
  customerAddress: text("customer_address"),
  companyId: varchar("company_id"),
  sellerName: text("seller_name"),
  sellerAddress: text("seller_address"),
  sellerBankAccount: text("seller_bank_account"),
  sellerEmail: text("seller_email"),
  sellerPhone: text("seller_phone"),
  quoteExpirationDate: date("quote_expiration_date"),
  createdBy: varchar("created_by"),
  createdDate: timestamp("created_date").defaultNow(),
});

export const quoteLines = pgTable("quote_lines", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  quoteName: text("quote_name"),
  productId: varchar("product_id").references(() => products.id, {
    onDelete: "restrict",
  }),
  productName: text("product_name"),
  productUnitPrice: decimal("product_unit_price", { precision: 12, scale: 3 }),
  unitPriceCurrency: text("unit_price_currency"),
  productUnitPriceOverride: decimal("product_unit_price_override", { precision: 12, scale: 3 }),
  unitPriceDiscountPercent: decimal("unit_price_discount_percent", {
    precision: 12,
    scale: 3,
  }),
  unitPriceDiscountAmount: decimal("unit_price_discount_amount", {
    precision: 12,
    scale: 3,
  }),
  finalUnitPrice: decimal("final_unit_price", {
    precision: 12,
    scale: 3,
  }),
  salesUom: text("sales_uom"),
  quotedQuantity: decimal("quoted_quantity", { precision: 12, scale: 3 }),
  subtotalBeforeRowDiscounts: decimal("subtotal_before_row_discounts", {
    precision: 12,
    scale: 3,
  }),
  discountPercentOnSubtotal: decimal("discount_percent_on_subtotal", {
    precision: 12,
    scale: 3,
  }),
  discountAmountOnSubtotal: decimal("discount_amount_on_subtotal", {
    precision: 12,
    scale: 3,
  }),
  finalSubtotal: decimal("final_subtotal", {
    precision: 12,
    scale: 3,
  }),
  vatPercent: decimal("vat_percent", { precision: 12, scale: 3 }),
  vatUnitAmount: decimal("vat_unit_amount", { precision: 12, scale: 3 }),
  vatOnSubtotal: decimal("vat_on_subtotal", { precision: 12, scale: 3 }),
  grossSubtotal: decimal("gross_subtotal", { precision: 12, scale: 3 }),
});

export const devPatterns = pgTable("dev_patterns", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  pattern: text("pattern"),
});

// Define relations

export const accountsRelations = relations(accounts, ({ many, one }) => ({
  opportunities: many(opportunities),
  cases: many(cases),
  owner: one(users, {
    fields: [accounts.ownerId],
    references: [users.id],
  }),
}));

export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
  account: one(accounts, {
    fields: [opportunities.accountId],
    references: [accounts.id],
  }),
  owner: one(users, {
    fields: [opportunities.ownerId],
    references: [users.id],
  }),
}));

export const casesRelations = relations(cases, ({ one }) => ({
  account: one(accounts, {
    fields: [cases.accountId],
    references: [accounts.id],
  }),
  owner: one(users, {
    fields: [cases.ownerId],
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

export const insertCompanySchema = createInsertSchema(companies)
  .omit({
    id: true,
  })
  .extend({
    companyOfficialName: z.string().min(1, "Company official name is required"),
  });

export const insertAccountSchema = createInsertSchema(accounts)
  .omit({
    id: true,
  })
  .extend({
    industry: z.enum(["tech", "construction", "services"]),
    ownerId: z.string().min(1, "Owner is required"),
  });

export const insertOpportunitySchema = createInsertSchema(opportunities)
  .omit({
    id: true,
  })
  .extend({
    totalRevenue: z.number().min(0.01, "Total revenue must be greater than 0"),
    closeDate: z.string().min(1, "Close date is required"),
    ownerId: z.string().min(1, "Owner is required"),
  });

export const insertCaseSchema = createInsertSchema(cases)
  .omit({
    id: true,
  })
  .extend({
    fromEmail: z.string().email("Please enter a valid email address"),
    ownerId: z.string().min(1, "Owner is required"),
  });

export const insertCompanyRoleSchema = createInsertSchema(companyRoles)
  .omit({
    id: true,
  })
  .extend({
    name: z.string().min(1, "Role name is required"),
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
  })
  .extend({
    salesCategory: z.enum(["Saleable", "Quoting only"]),
    productName: z.string().min(1, "Product name is required"),
    salesUomId: z.string().min(1, "Sales UoM is required"),
    salesUnitPrice: z.number().min(0, "Sales unit price must be 0 or greater"),
    salesUnitPriceCurrency: z.string().min(1, "Currency is required"),
    vatPercent: z.number().min(0).max(100, "VAT % must be between 0 and 100"),
  });

export const insertLanguageSchema = createInsertSchema(languages)
  .omit({
    id: true,
  })
  .extend({
    languageCode: z.string().min(1, "Language code is required"),
    languageName: z.string().min(1, "Language name is required"),
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
  })
  .extend({
    customerName: z.string().min(0),
    createdBy: z.string().min(1, "Created by is required"),
  });

export const insertQuoteLineSchema = createInsertSchema(quoteLines)
  .omit({
    id: true,
  })
  .extend({
    quoteId: z.string().min(1, "Quote ID is required"),
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

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
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
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Language = typeof languages.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuoteLine = z.infer<typeof insertQuoteLineSchema>;
export type QuoteLine = typeof quoteLines.$inferSelect;
export type InsertDevPattern = z.infer<typeof insertDevPatternSchema>;
export type DevPattern = typeof devPatterns.$inferSelect;

export type AccountWithOwner = Account & {
  owner: User;
};

export type OpportunityWithAccount = Opportunity & {
  account: Account;
};

export type OpportunityWithAccountAndOwner = Opportunity & {
  account: Account;
  owner: User;
};

export type CaseWithAccount = Case & {
  account: Account;
};

export type CaseWithAccountAndOwner = Case & {
  account: Account;
  owner: User;
};

export type CompanyRoleWithParent = CompanyRole & {
  parentCompanyRole?: CompanyRole | null;
};

export type UserRoleAssignmentWithUserAndRole = UserRoleAssignment & {
  user: User;
  companyRole: CompanyRole;
};

export type ProductWithUom = Product & {
  salesUomName: string;
};

// User types - Required for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
