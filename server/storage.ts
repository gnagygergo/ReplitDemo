import { type Account, type InsertAccount, type Opportunity, type InsertOpportunity, type OpportunityWithAccount, type Case, type InsertCase, type CaseWithAccount, accounts, opportunities, cases } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Account methods
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;
  
  // Opportunity methods
  getOpportunities(): Promise<OpportunityWithAccount[]>;
  getOpportunity(id: string): Promise<OpportunityWithAccount | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: string, opportunity: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: string): Promise<boolean>;
  
  // Case methods
  getCases(): Promise<CaseWithAccount[]>;
  getCase(id: string): Promise<CaseWithAccount | undefined>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, caseData: Partial<InsertCase>): Promise<Case | undefined>;
  deleteCase(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const [account] = await db.update(accounts).set(updates).where(eq(accounts.id, id)).returning();
    return account || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    // Check if account has opportunities or cases
    const existingOpportunities = await db.select().from(opportunities).where(eq(opportunities.accountId, id));
    const existingCases = await db.select().from(cases).where(eq(cases.accountId, id));
    
    if (existingOpportunities.length > 0 || existingCases.length > 0) {
      return false; // Cannot delete account with opportunities or cases
    }
    
    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getOpportunities(): Promise<OpportunityWithAccount[]> {
    return await db.select().from(opportunities).innerJoin(accounts, eq(opportunities.accountId, accounts.id))
      .then(rows => rows.map(row => ({
        ...row.opportunities,
        account: row.accounts
      })));
  }

  async getOpportunity(id: string): Promise<OpportunityWithAccount | undefined> {
    const [result] = await db.select().from(opportunities)
      .innerJoin(accounts, eq(opportunities.accountId, accounts.id))
      .where(eq(opportunities.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.opportunities,
      account: result.accounts
    };
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    // Verify account exists
    const account = await this.getAccount(insertOpportunity.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    
    const opportunityData = {
      ...insertOpportunity,
      totalRevenue: insertOpportunity.totalRevenue.toString()
    };
    
    const [opportunity] = await db.insert(opportunities).values(opportunityData).returning();
    return opportunity;
  }

  async updateOpportunity(id: string, updates: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    // If updating accountId, verify the new account exists
    if (updates.accountId) {
      const account = await this.getAccount(updates.accountId);
      if (!account) {
        throw new Error("Account not found");
      }
    }
    
    const updateData: any = { ...updates };
    if (updates.totalRevenue !== undefined) {
      updateData.totalRevenue = updates.totalRevenue.toString();
    }
    
    const [opportunity] = await db.update(opportunities).set(updateData).where(eq(opportunities.id, id)).returning();
    return opportunity || undefined;
  }

  async deleteOpportunity(id: string): Promise<boolean> {
    const result = await db.delete(opportunities).where(eq(opportunities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCases(): Promise<CaseWithAccount[]> {
    return await db.select().from(cases).innerJoin(accounts, eq(cases.accountId, accounts.id))
      .then(rows => rows.map(row => ({
        ...row.cases,
        account: row.accounts
      })));
  }

  async getCase(id: string): Promise<CaseWithAccount | undefined> {
    const [result] = await db.select().from(cases)
      .innerJoin(accounts, eq(cases.accountId, accounts.id))
      .where(eq(cases.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.cases,
      account: result.accounts
    };
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    // Verify account exists
    const account = await this.getAccount(insertCase.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    
    const [caseRecord] = await db.insert(cases).values(insertCase).returning();
    return caseRecord;
  }

  async updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined> {
    // If updating accountId, verify the new account exists
    if (updates.accountId) {
      const account = await this.getAccount(updates.accountId);
      if (!account) {
        throw new Error("Account not found");
      }
    }
    
    const [caseRecord] = await db.update(cases).set(updates).where(eq(cases.id, id)).returning();
    return caseRecord || undefined;
  }

  async deleteCase(id: string): Promise<boolean> {
    const result = await db.delete(cases).where(eq(cases.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
