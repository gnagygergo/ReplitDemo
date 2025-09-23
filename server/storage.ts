import { type Account, type InsertAccount, type Opportunity, type InsertOpportunity, type OpportunityWithAccount } from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private accounts: Map<string, Account>;
  private opportunities: Map<string, Opportunity>;

  constructor() {
    this.accounts = new Map();
    this.opportunities = new Map();
  }

  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = randomUUID();
    const account: Account = { 
      ...insertAccount, 
      id,
      address: insertAccount.address || null 
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const existing = this.accounts.get(id);
    if (!existing) return undefined;
    
    const updated: Account = { ...existing, ...updates };
    this.accounts.set(id, updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    // Check if account has opportunities
    const hasOpportunities = Array.from(this.opportunities.values()).some(
      opp => opp.accountId === id
    );
    
    if (hasOpportunities) {
      return false; // Cannot delete account with opportunities
    }
    
    return this.accounts.delete(id);
  }

  async getOpportunities(): Promise<OpportunityWithAccount[]> {
    const opportunities = Array.from(this.opportunities.values());
    const result: OpportunityWithAccount[] = [];
    
    for (const opportunity of opportunities) {
      const account = this.accounts.get(opportunity.accountId);
      if (account) {
        result.push({ ...opportunity, account });
      }
    }
    
    return result;
  }

  async getOpportunity(id: string): Promise<OpportunityWithAccount | undefined> {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return undefined;
    
    const account = this.accounts.get(opportunity.accountId);
    if (!account) return undefined;
    
    return { ...opportunity, account };
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    // Verify account exists
    const account = this.accounts.get(insertOpportunity.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    
    const id = randomUUID();
    const opportunity: Opportunity = { 
      ...insertOpportunity, 
      id,
      totalRevenue: insertOpportunity.totalRevenue.toString()
    };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunity(id: string, updates: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const existing = this.opportunities.get(id);
    if (!existing) return undefined;
    
    // If updating accountId, verify the new account exists
    if (updates.accountId) {
      const account = this.accounts.get(updates.accountId);
      if (!account) {
        throw new Error("Account not found");
      }
    }
    
    const updated: Opportunity = { 
      ...existing, 
      ...updates,
      totalRevenue: updates.totalRevenue !== undefined ? updates.totalRevenue.toString() : existing.totalRevenue
    };
    this.opportunities.set(id, updated);
    return updated;
  }

  async deleteOpportunity(id: string): Promise<boolean> {
    return this.opportunities.delete(id);
  }
}

export const storage = new MemStorage();
