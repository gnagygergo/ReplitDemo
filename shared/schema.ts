import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date, timestamp, jsonb, boolean, index, unique, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyOfficialName: text("company_official_name").notNull(),
  companyAlias: text("company_alias"),
  companyRegistrationId: text("company_registration_id"),
});

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  industry: text("industry").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  companyId: varchar("company_id"),
});

export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  closeDate: date("close_date").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull(),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  companyId: varchar("company_id"),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  subject: text("subject"),
  description: text("description"),
  fromEmail: text("from_email").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  companyId: varchar("company_id"),
});

export const companyRoles = pgTable("company_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentCompanyRoleId: varchar("parent_company_role_id").references((): AnyPgColumn => companyRoles.id, { onDelete: "restrict" }),
  companyId: varchar("company_id"),
});

export const userRoleAssignments = pgTable("user_role_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyRoleId: varchar("company_role_id").notNull().references(() => companyRoles.id, { onDelete: "cascade" }),
}, (table) => ({
  uniqueUserRole: unique().on(table.userId, table.companyRoleId),
}));

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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: text("password"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  companyId: varchar("company_id"),
  companyContext: varchar("company_context"), // RLS context field - set during login, cleared during logout
  isGlobalAdmin: boolean("is_global_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const companyRolesRelations = relations(companyRoles, ({ one, many }) => ({
  parentCompanyRole: one(companyRoles, {
    fields: [companyRoles.parentCompanyRoleId],
    references: [companyRoles.id],
    relationName: "companyRoleHierarchy",
  }),
  childCompanyRoles: many(companyRoles, {
    relationName: "companyRoleHierarchy",
  }),
  userRoleAssignments: many(userRoleAssignments),
}));

export const userRoleAssignmentsRelations = relations(userRoleAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userRoleAssignments.userId],
    references: [users.id],
  }),
  companyRole: one(companyRoles, {
    fields: [userRoleAssignments.companyRoleId],
    references: [companyRoles.id],
  }),
}));

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
}).extend({
  companyOfficialName: z.string().min(1, "Company official name is required"),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
}).extend({
  industry: z.enum(["tech", "construction", "services"]),
  ownerId: z.string().min(1, "Owner is required"),
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
}).extend({
  totalRevenue: z.number().min(0.01, "Total revenue must be greater than 0"),
  closeDate: z.string().min(1, "Close date is required"),
  ownerId: z.string().min(1, "Owner is required"),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
}).extend({
  fromEmail: z.string().email("Please enter a valid email address"),
  ownerId: z.string().min(1, "Owner is required"),
});

export const insertCompanyRoleSchema = createInsertSchema(companyRoles).omit({
  id: true,
}).extend({
  name: z.string().min(1, "Role name is required"),
});

export const insertUserRoleAssignmentSchema = createInsertSchema(userRoleAssignments).omit({
  id: true,
}).extend({
  userId: z.string().min(1, "User is required"),
  companyRoleId: z.string().min(1, "Company role is required"),
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
export type InsertUserRoleAssignment = z.infer<typeof insertUserRoleAssignmentSchema>;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;


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

// User types - Required for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
