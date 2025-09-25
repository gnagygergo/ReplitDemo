import { type Account, type InsertAccount, type Opportunity, type InsertOpportunity, type OpportunityWithAccount, type OpportunityWithAccountAndOwner, type Case, type InsertCase, type CaseWithAccount, type CaseWithAccountAndOwner, type AccountWithOwner, type User, type UpsertUser, accounts, opportunities, cases, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Account methods
  getAccounts(): Promise<AccountWithOwner[]>;
  getAccount(id: string): Promise<AccountWithOwner | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;
  
  // Opportunity methods
  getOpportunities(): Promise<OpportunityWithAccountAndOwner[]>;
  getOpportunity(id: string): Promise<OpportunityWithAccountAndOwner | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: string, opportunity: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: string): Promise<boolean>;
  
  // Case methods
  getCases(): Promise<CaseWithAccountAndOwner[]>;
  getCase(id: string): Promise<CaseWithAccountAndOwner | undefined>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, caseData: Partial<InsertCase>): Promise<Case | undefined>;
  deleteCase(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Check if user owns any accounts, opportunities, or cases
    const ownedAccounts = await db.select().from(accounts).where(eq(accounts.ownerId, id));
    const ownedOpportunities = await db.select().from(opportunities).where(eq(opportunities.ownerId, id));
    const ownedCases = await db.select().from(cases).where(eq(cases.ownerId, id));
    
    if (ownedAccounts.length > 0 || ownedOpportunities.length > 0 || ownedCases.length > 0) {
      return false; // Cannot delete user who owns records
    }
    
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAccounts(): Promise<AccountWithOwner[]> {
    return await db.select().from(accounts)
      .innerJoin(users, eq(accounts.ownerId, users.id))
      .then(rows => rows.map(row => ({
        ...row.accounts,
        owner: row.users
      })));
  }

  async getAccount(id: string): Promise<AccountWithOwner | undefined> {
    const [result] = await db.select().from(accounts)
      .innerJoin(users, eq(accounts.ownerId, users.id))
      .where(eq(accounts.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.accounts,
      owner: result.users
    };
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    // Verify owner exists
    const owner = await this.getUser(insertAccount.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }
    
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    // If updating ownerId, verify the new owner exists
    if (updates.ownerId) {
      const owner = await this.getUser(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }
    
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

  async getOpportunities(): Promise<OpportunityWithAccountAndOwner[]> {
    return await db.select().from(opportunities)
      .innerJoin(accounts, eq(opportunities.accountId, accounts.id))
      .innerJoin(users, eq(opportunities.ownerId, users.id))
      .then(rows => rows.map(row => ({
        ...row.opportunities,
        account: row.accounts,
        owner: row.users
      })));
  }

  async getOpportunity(id: string): Promise<OpportunityWithAccountAndOwner | undefined> {
    const [result] = await db.select().from(opportunities)
      .innerJoin(accounts, eq(opportunities.accountId, accounts.id))
      .innerJoin(users, eq(opportunities.ownerId, users.id))
      .where(eq(opportunities.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.opportunities,
      account: result.accounts,
      owner: result.users
    };
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    // Verify account exists
    const account = await this.getAccount(insertOpportunity.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    
    // Verify owner exists
    const owner = await this.getUser(insertOpportunity.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
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
    
    // If updating ownerId, verify the new owner exists
    if (updates.ownerId) {
      const owner = await this.getUser(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
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

  async getCases(): Promise<CaseWithAccountAndOwner[]> {
    return await db.select().from(cases)
      .innerJoin(accounts, eq(cases.accountId, accounts.id))
      .innerJoin(users, eq(cases.ownerId, users.id))
      .then(rows => rows.map(row => ({
        ...row.cases,
        account: row.accounts,
        owner: row.users
      })));
  }

  async getCase(id: string): Promise<CaseWithAccountAndOwner | undefined> {
    const [result] = await db.select().from(cases)
      .innerJoin(accounts, eq(cases.accountId, accounts.id))
      .innerJoin(users, eq(cases.ownerId, users.id))
      .where(eq(cases.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.cases,
      account: result.accounts,
      owner: result.users
    };
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    // Verify account exists
    const account = await this.getAccount(insertCase.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    
    // Verify owner exists
    const owner = await this.getUser(insertCase.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
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
    
    // If updating ownerId, verify the new owner exists
    if (updates.ownerId) {
      const owner = await this.getUser(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
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
