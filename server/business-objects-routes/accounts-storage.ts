import { db } from "../db";
import { accounts, users, opportunities, cases } from "@shared/schema";
import type { Account, InsertAccount, AccountWithOwner } from "@shared/schema";
import { eq, asc, desc, and, isNull, or } from "drizzle-orm";

export class AccountStorage {
  // Reference to getUser from main storage - will be injected
  private getUser: (id: string) => Promise<any>;

  constructor(getUserFn: (id: string) => Promise<any>) {
    this.getUser = getUserFn;
  }

  async getAccounts(companyContext?: string, sortBy?: string, sortOrder?: string): Promise<AccountWithOwner[]> { // Added sortBy, sortOrder for sorting capability on Tables
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    // Added for sorting capability on Tables - Determine sort column - default to 'name'
    let sortColumn;
    if (sortBy === 'industry') {
      sortColumn = accounts.industry;
    } else if (sortBy === 'address') {
      sortColumn = accounts.address;
    } else {
      sortColumn = accounts.name;
    }

    // Added for sorting capability on Tables - Determine sort direction - default to 'asc'
    const orderDirection = sortOrder === 'desc' ? desc : asc;

    return await db
      .select()
      .from(accounts)
      .innerJoin(users, eq(accounts.ownerId, users.id))
      .where(eq(accounts.companyId, companyContext))
      .orderBy(orderDirection(sortColumn)) // Added for sorting capability on Tables
      .then((rows) =>
        rows.map((row) => ({
          ...row.accounts,
          owner: row.users,
        })),
      );
  }

  async searchAccounts(companyContext: string | undefined, filters: {
    isLegalEntity?: boolean;
    isPersonAccount?: boolean;
    isSelfEmployed?: boolean;
  }): Promise<AccountWithOwner[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    // Build filter conditions - OR logic for account types
    const filterConditions = [];
    
    if (filters.isLegalEntity) {
      filterConditions.push(eq(accounts.isLegalEntity, true));
    }
    if (filters.isPersonAccount) {
      filterConditions.push(eq(accounts.isPersonAccount, true));
    }
    if (filters.isSelfEmployed) {
      filterConditions.push(eq(accounts.isSelfEmployed, true));
    }

    // If no filters provided, return all accounts
    const whereCondition = filterConditions.length > 0
      ? and(
          eq(accounts.companyId, companyContext),
          or(...filterConditions)
        )
      : eq(accounts.companyId, companyContext);

    return await db
      .select()
      .from(accounts)
      .innerJoin(users, eq(accounts.ownerId, users.id))
      .where(whereCondition)
      .orderBy(asc(accounts.name))
      .then((rows) =>
        rows.map((row) => ({
          ...row.accounts,
          owner: row.users,
        })),
      );
  }

  async getAccount(id: string): Promise<AccountWithOwner | undefined> {
    const [result] = await db
      .select()
      .from(accounts)
      .innerJoin(users, eq(accounts.ownerId, users.id))
      .where(eq(accounts.id, id));

    if (!result) return undefined;

    return {
      ...result.accounts,
      owner: result.users,
    };
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    // Verify owner exists
    const owner = await this.getUser(insertAccount.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    // Automatically populate CompanyId from owner's CompanyId
    const accountData = {
      ...insertAccount,
      companyId: owner.companyId || null,
    };

    const [account] = await db.insert(accounts).values(accountData).returning();

    return account;
  }

  async updateAccount(
    id: string,
    updates: Partial<InsertAccount>,
  ): Promise<Account | undefined> {
    // If updating ownerId, verify the new owner exists
    if (updates.ownerId) {
      const owner = await this.getUser(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Remove companyId from updates - it cannot be changed once set
    const { companyId, ...allowedUpdates } = updates as any;

    const [account] = await db
      .update(accounts)
      .set(allowedUpdates)
      .where(eq(accounts.id, id))
      .returning();
    return account || undefined;
  }

  async getChildAccounts(parentAccountId: string, accountType?: string): Promise<AccountWithOwner[]> {
    let whereConditions = eq(accounts.parentAccountId, parentAccountId);
    
    // Add account type filter if specified
    if (accountType === 'contact') {
      whereConditions = and(whereConditions, eq(accounts.isCompanyContact, true)) as any;
    } else if (accountType === 'shipping') {
      whereConditions = and(whereConditions, eq(accounts.isShippingAddress, true), eq(accounts.isLegalEntity, false)) as any;
    } else if (accountType === 'legal_entity') {
      whereConditions = and(whereConditions, eq(accounts.isLegalEntity, true)) as any;
    }

    return await db
      .select()
      .from(accounts)
      .innerJoin(users, eq(accounts.ownerId, users.id))
      .where(whereConditions)
      .orderBy(asc(accounts.name))
      .then((rows) =>
        rows.map((row) => ({
          ...row.accounts,
          owner: row.users,
        })),
      );
  }

  async getParentAccounts(childAccountId: string): Promise<AccountWithOwner[]> {
    // Get the child account first to find its parent
    const child = await this.getAccount(childAccountId);
    if (!child || !child.parentAccountId) {
      return [];
    }

    // Get the parent account
    const parent = await this.getAccount(child.parentAccountId);
    if (!parent) {
      return [];
    }

    // Return as array for consistency
    return [parent];
  }

  async deleteAccount(id: string): Promise<boolean> {
    // Check if account has opportunities or cases
    const existingOpportunities = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.accountId, id));
    const existingCases = await db
      .select()
      .from(cases)
      .where(eq(cases.accountId, id));

    if (existingOpportunities.length > 0 || existingCases.length > 0) {
      return false; // Cannot delete account with opportunities or cases
    }

    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}
