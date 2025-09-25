import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  industry: text("industry").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
});

export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  closeDate: date("close_date").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull(),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  subject: text("subject"),
  description: text("description"),
  fromEmail: text("from_email").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
});

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

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

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

// User types - Required for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
