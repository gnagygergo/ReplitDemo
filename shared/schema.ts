import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  industry: text("industry").notNull(),
});

export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  closeDate: date("close_date").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull(),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  subject: text("subject"),
  description: text("description"),
  fromEmail: text("from_email").notNull(),
});

// Define relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  opportunities: many(opportunities),
  cases: many(cases),
}));

export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
  account: one(accounts, {
    fields: [opportunities.accountId],
    references: [accounts.id],
  }),
}));

export const casesRelations = relations(cases, ({ one }) => ({
  account: one(accounts, {
    fields: [cases.accountId],
    references: [accounts.id],
  }),
}));

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
}).extend({
  industry: z.enum(["tech", "construction", "services"]),
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
}).extend({
  totalRevenue: z.number().min(0.01, "Total revenue must be greater than 0"),
  closeDate: z.string().min(1, "Close date is required"),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
}).extend({
  fromEmail: z.string().email("Please enter a valid email address"),
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

export type OpportunityWithAccount = Opportunity & {
  account: Account;
};

export type CaseWithAccount = Case & {
  account: Account;
};
